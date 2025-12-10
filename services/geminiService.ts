import { GoogleGenAI } from "@google/genai";
import { generateCreativePrompts } from './promptGenerationService';
import type { GeneratedImage, BaseImage } from '../types';

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 5000;

// Utility to convert file to base64 and return its object URL
export const fileToImageObject = (file: File): Promise<BaseImage> => {
    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(file);
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result as string;
            // extract base64 part
            const base64 = result.split(',')[1];
            const mimeType = file.type;
            resolve({ base64, mimeType, url });
        };
        reader.onerror = error => reject(error);
        reader.readAsDataURL(file);
    });
};

// Utility to convert a remote URL to base64
export const urlToBase64 = async (url: string): Promise<{ base64: string, mimeType: string }> => {
    try {
        // Use wsrv.nl as a reliable image proxy/CDN that handles CORS headers correctly.
        // This is often more stable than generic cors proxies for images.
        const proxiedUrl = `https://wsrv.nl/?url=${encodeURIComponent(url)}`;
        
        const response = await fetch(proxiedUrl);
        if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);
        const blob = await response.blob();
        
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const result = reader.result as string;
                const base64 = result.split(',')[1];
                resolve({ base64, mimeType: blob.type });
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (error) {
        console.error("Error converting URL to base64:", error);
        throw error;
    }
};

export const identifyProductFromImage = async (base64: string, mimeType: string): Promise<string> => {
    if (!process.env.API_KEY) throw new Error("API_KEY not set");
    
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    { inlineData: { mimeType, data: base64 } },
                    { text: "Identify this product. Return only the generic product name (e.g., 'Lipstick', 'Running Shoe'). Do not include brand names or extra adjectives." }
                ]
            }
        });
        return response.text?.trim() || "Product";
    } catch (e) {
        console.error("Identification failed", e);
        return "Product";
    }
};

export const generateImageBatch = async (
    referenceImages: BaseImage[],
    theme: string,
    style: string,
    modelOption: string,
    imageCount: number,
    productName: string,
    productDetails: string,
    instructions: string,
    indianContext: boolean,
    onAppMode: boolean,
    aspectRatio: string,
    onInitialPrompts: (prompts: string[]) => void,
    onImageGenerated: (image: GeneratedImage, index: number) => void
) => {
    // 1. Generate Prompts
    const prompts = await generateCreativePrompts(
        theme, style, modelOption, imageCount, productName, productDetails, instructions, indianContext, onAppMode, aspectRatio
    );
    
    onInitialPrompts(prompts);

    // 2. Generate images with concurrency control to avoid Rate Limits (429)
    // We process images sequentially (limit 1) to be safest against strict rate limits.
    const CONCURRENCY_LIMIT = 1;
    const results: { status: 'fulfilled' | 'rejected', value?: GeneratedImage, reason?: any }[] = [];

    // Helper to create a task function
    const createTask = (prompt: string, index: number) => async () => {
        try {
            const generatedImage = await _generateSingleImage(referenceImages, prompt, aspectRatio);
            // On success, update the specific image in the gallery
            onImageGenerated(generatedImage, index);
            return { status: 'fulfilled' as const, value: generatedImage };
        } catch (error) {
            // On failure, log the error and return a rejected status
            console.error(`Failed to generate image ${index + 1}:`, error);
            onImageGenerated({ prompt, imageData: '' }, index);
            return { status: 'rejected' as const, reason: error };
        }
    };

    const tasks = prompts.map((prompt, index) => createTask(prompt, index));

    // Execute chunks
    for (let i = 0; i < tasks.length; i += CONCURRENCY_LIMIT) {
        const chunk = tasks.slice(i, i + CONCURRENCY_LIMIT);
        const chunkResults = await Promise.all(chunk.map(task => task()));
        results.push(...chunkResults);
        
        // Add a delay between requests to allow quota bucket to trickle refill
        if (i + CONCURRENCY_LIMIT < tasks.length) {
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }

    // Check for errors
    const failedResults = results.filter(
        (result): result is { status: 'rejected'; reason: any } => result.status === 'rejected'
    );
    
    if (failedResults.length > 0) {
        const permissionError = failedResults.find(f => 
            (f.reason.message || '').toLowerCase().includes("permission_denied") ||
            (f.reason.message || '').toLowerCase().includes("403")
        );

        if (permissionError) {
            throw new Error(`Authentication Error (403): Your API key is invalid or missing. Image generation failed. Please check your environment configuration.`);
        }

        const rateLimitError = failedResults.find(f => 
            (f.reason.message || '').toLowerCase().includes("429") || 
            (f.reason.message || '').toLowerCase().includes("resource_exhausted")
        );

        if (rateLimitError) {
            throw new Error(`API rate limit exceeded. ${failedResults.length} of ${prompts.length} images failed. Please try again later or generate fewer images.`);
        }

        throw new Error(`${failedResults.length} of ${prompts.length} images failed to generate due to an error. Please try again.`);
    }
};

const _generateSingleImage = async (
    referenceImages: BaseImage[],
    prompt: string,
    aspectRatio: string
): Promise<GeneratedImage> => {
    if (!process.env.API_KEY) throw new Error("API_KEY not set");

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    // Prepare contents: Text Prompt + All Reference Images
    const parts: any[] = [
        { text: prompt }
    ];

    referenceImages.forEach(img => {
        parts.push({
            inlineData: {
                mimeType: img.mimeType,
                data: img.base64
            }
        });
    });

    // gemini-2.5-flash-image (Nano Banana) does NOT support imageSize.
    const config: any = {
         imageConfig: {
             aspectRatio: aspectRatio,
         }
    };

    // Retry loop
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image', // Switched to Flash Image
                contents: { parts },
                config: config
            });

            // Extract Image
            let base64Image = '';
            if (response.candidates && response.candidates.length > 0) {
                 const content = response.candidates[0].content;
                 if (content && content.parts) {
                     for (const part of content.parts) {
                         if (part.inlineData && part.inlineData.data) {
                             base64Image = part.inlineData.data;
                             break;
                         }
                     }
                 }
            }

            if (!base64Image) {
                const finishReason = response.candidates?.[0]?.finishReason;
                
                // Retry specifically for 'STOP' if no image, as it might be a glitch. 
                // Only retry once for this specific error to avoid infinite loops on bad prompts.
                if (finishReason === 'STOP' && attempt < MAX_RETRIES) {
                    console.warn(`Attempt ${attempt}: Model finished with STOP but no image. Retrying...`);
                    continue; 
                }

                if (finishReason === 'STOP') {
                    throw new Error("The model finished but did not produce an image. This can happen with ambiguous prompts. Please try adjusting your theme or instructions.");
                } else if (finishReason) {
                    throw new Error(`Model refused to generate image. Reason: ${finishReason}. Please adjust your prompt.`);
                }
                throw new Error("No image was generated. The model returned an empty response.");
            }

            return {
                prompt: prompt,
                imageData: base64Image
            };

        } catch (error: any) {
            const errorMessage = (error.message || '').toLowerCase();
            
            // Non-retryable permission error
            if (errorMessage.includes("permission_denied") || errorMessage.includes("403")) {
                throw new Error("Authentication Error (403): Your API key is invalid or missing. Please check your environment configuration.");
            }

            // Retryable errors: 500s AND 429s
            const isServerError = errorMessage.includes("500") || errorMessage.includes("unknown") || errorMessage.includes("503") || errorMessage.includes("rpc failed");
            const isRateLimit = errorMessage.includes("429") || errorMessage.includes("resource_exhausted") || errorMessage.includes("quota");

            if ((isServerError || isRateLimit) && attempt < MAX_RETRIES) {
                // Linear backoff for rate limits: 5000, 10000, 15000...
                const delay = isRateLimit ? RETRY_DELAY_MS * attempt : RETRY_DELAY_MS; 
                console.warn(`Attempt ${attempt} failed with ${isRateLimit ? 'rate limit' : 'server error'}. Retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                continue; 
            }
            
            // Not retryable or exhausted
            let message = error.message || "Unknown error";
            if (message.includes("400")) {
                 message = "The model refused the request. Please try a different prompt or fewer reference images.";
            } else if (message.includes("SAFETY")) {
                 message = "Generation blocked by safety filters. Please adjust your prompt.";
            } else if (isRateLimit) {
                 message = "Quota exceeded. Please try generating fewer images or waiting a moment.";
            } else if (isServerError) {
                 message = "The AI service is temporarily unavailable. Please try again in a few moments.";
            }
            throw new Error(message);
        }
    }
    
    // This part should not be reachable due to the loop structure, but it satisfies TypeScript's need for a return path.
    throw new Error("Failed to generate image after multiple retries.");
};
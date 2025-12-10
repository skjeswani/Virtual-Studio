
import { GoogleGenAI, Type } from "@google/genai";

const PROMPT_EXAMPLES = `
- "A high-resolution, photorealistic image of the {{PRODUCT_NAME}}, perfectly centered on a seamless white infinity background (#FFFFFF). The shot should feature soft, diffused studio lighting to eliminate harsh shadows and create a clean, professional look. The product must be in tack-sharp focus from edge to edge. No additional props, text, or graphics. Ideal for e-commerce product listings and catalogues."
- "An ultra-high-resolution, front-view photograph of the {{PRODUCT_NAME}}, optimized for online catalogues. The lighting should be even and balanced to minimize shadows and accurately represent the product's texture and material details. Ensure color-accurate reproduction of all branding elements. The composition should be clean and straightforward, focusing solely on the product against a neutral background."
- "A professional, high-resolution product shot of the {{PRODUCT_NAME}} with a clean and modern aesthetic. The scene should be lightly styled with a few complementary props in neutral tones (e.g., linen fabric, a simple ceramic dish) that enhance the product without distracting from it. Use soft, natural window light to create gentle shadows. The product remains the primary focus against an isolated, uncluttered background. Perfect for social media and hero website images."
- "A high-resolution lifestyle photograph capturing an authentic moment of the {{PRODUCT_NAME}} in use. The scene features a person naturally and positively interacting with the product within a bright, contemporary interior that aligns with the brand's mood. The focus should be on the product, with the person and background creating a relatable, aspirational context. The lighting should be warm and inviting. Ideal for advertising campaigns and website banners."
- "An extreme close-up, high-resolution macro photograph of the {{PRODUCT_NAME}}. The shot must reveal intricate surface textures and material details with flawless edge-to-edge sharpness. Use precise lighting to highlight the texture while casting subtle, defining shadows. Ensure true-to-life color accuracy. No additional graphics or text should be present. Perfect for highlighting product quality on a sales page."
- "A dynamic, high-resolution action shot of the {{PRODUCT_NAME}} being used for its intended purpose. The image should be well-lit, clearly emphasizing the product's key features. Employ a shallow depth of field to create a soft, blurred background (bokeh), ensuring the product remains the sharp focal point. Ideal for feature sections on a product website."
- "An elegant, high-resolution studio photograph of the {{PRODUCT_NAME}}, designed for a luxury catalogue. Position the product on a polished, dark gray or black reflective surface. Utilize dramatic, low-key lighting with a subtle vignette to draw the viewer's eye. The lighting should create gentle highlights across the product's contours, emphasizing its premium form and materials."
- "A creative, high-resolution flat lay (top-down view) of the {{PRODUCT_NAME}}, artfully arranged with its key ingredients or complementary items in a knolling style. The scene should be illuminated with bright, even, ambient light to avoid harsh shadows. Use a clean, solid-colored background. Ensure there are no distracting extra elements. Perfect for visually telling the product's story on social media."
`;

export const generateCreativePrompts = async (
    theme: string,
    style: string,
    modelOption: string,
    imageCount: number,
    productName: string,
    productDetails: string,
    instructions: string,
    indianContext: boolean,
    onAppMode: boolean,
    aspectRatio: string
): Promise<string[]> => {
    if (!process.env.API_KEY) {
        throw new Error("API_KEY environment variable not set.");
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    let systemInstruction = `You are a world-class creative director for product photography. Your task is to generate distinct, professional, and photorealistic prompts for an AI image generator.

GUIDELINES:
- The user will provide one or more reference images of the product. Your generated prompts must result in images that are visually consistent with ALL provided reference images, matching key details like color, shape, texture, and branding.
- Always mention "high resolution" and the intended usage (e.g., e-commerce, print, catalogue).
- Be explicit about background, lighting, product positioning, and camera angles.
- If the user provides 'SPECIAL INSTRUCTIONS', incorporate them into the prompt. For example, if they say 'top-down', ensure the prompts describe a top-down camera angle.
- Focus on clarity, photorealism, and rich, descriptive details.
- Do NOT add extra scenes beyond what the user's theme describes. Keep the core meaning.
- Replace the placeholder '{{PRODUCT_NAME}}' with the actual product name provided by the user.
- The output MUST be a valid JSON array of strings.
`;

    if (onAppMode) {
        systemInstruction += `\n- ON-APP VISUAL GUIDELINES:
  - Adhere to character limits for text, both within the content space and inside imagery.
  - Maintain consistency in font size, position, color, and weight.
  - Ensure key image elements remain within the defined safe areas and are not cropped.`;
    }

    if (aspectRatio !== '1:1') {
        systemInstruction += `\n- COMPOSITION GUIDELINE: The desired aspect ratio is ${aspectRatio}. Ensure the generated prompts describe a composition that fits this format (e.g., "wide shot with negative space on sides" for 16:9, or "vertical composition with subject centered" for 9:16).`;
    }

    if (indianContext) {
        systemInstruction += `\n- Unless the user's theme specifies a different location or culture, generate scenes with a context relevant to modern India. This could include urban or rural settings, architecture, props, and cultural nuances.`;
    }

    const detailsSection = productDetails.trim() 
        ? `\nADDITIONAL PRODUCT DETAILS: "${productDetails.trim()}"`
        : '';

    const instructionsSection = instructions.trim()
        ? `\nSPECIAL INSTRUCTIONS: "${instructions.trim()}"`
        : '';

    const userPrompt = `Based on the examples below, please generate ${imageCount} unique and creative prompt variations for a product named "${productName}".

USER'S THEME: "${theme}"${detailsSection}${instructionsSection}
DESIRED STYLE: "${style}"
MODEL: "${modelOption} a model"
ASPECT RATIO: "${aspectRatio}"

Here are examples of the high-quality, professional prompts I expect. Use them as a style guide:
${PROMPT_EXAMPLES}

Now, generate the ${imageCount} prompts based on the user's theme and style.
`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: userPrompt,
            config: {
                systemInstruction,
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                }
            }
        });
        
        const jsonText = response.text.trim();
        const prompts = JSON.parse(jsonText);

        if (!Array.isArray(prompts) || prompts.some(p => typeof p !== 'string')) {
            throw new Error("Model returned an invalid JSON format.");
        }
        
        return prompts;

    } catch (error: any) {
        console.error("Error generating creative prompts:", error);
        
        // Robustly extract the error message or code
        const errorMsg = error?.message || error?.error?.message || JSON.stringify(error);
        const errorCode = error?.error?.code || error?.status;

        // Check for the specific permission denied error
        if (
            errorMsg.includes("PERMISSION_DENIED") || 
            errorMsg.includes("does not have permission") || 
            errorCode === 403 ||
            errorMsg.includes("403")
        ) {
             throw new Error("Authentication Error (403): Your API key is invalid or missing. This application requires a valid Google AI API key to be configured in the environment. Please check your setup.");
        }

        throw new Error("Failed to generate creative prompts. The model may have returned an unexpected response.");
    }
};
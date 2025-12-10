import React, { useState, useEffect } from 'react';
import type { GeneratedVideo } from '../types';

declare const saveAs: any;

interface VideoResultProps {
    video: GeneratedVideo;
    onClose: () => void;
}

const VideoResult: React.FC<VideoResultProps> = ({ video, onClose }) => {
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [isCopied, setIsCopied] = useState(false);

    useEffect(() => {
        const fetchVideo = async () => {
            if (!video.videoUri) {
                setError("No video URI provided.");
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            setError(null);
            try {
                // The URI requires an API key to be accessed.
                const response = await fetch(`${video.videoUri}&key=${process.env.API_KEY}`);
                if (!response.ok) {
                    throw new Error(`Failed to fetch video: ${response.statusText}`);
                }
                const blob = await response.blob();
                const url = URL.createObjectURL(blob);
                setVideoUrl(url);
            } catch (err: any) {
                setError(err.message || "Could not load video.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchVideo();

        // Cleanup function to revoke the object URL when the component unmounts or the URI changes
        return () => {
            if (videoUrl) {
                URL.revokeObjectURL(videoUrl);
            }
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [video.videoUri]);

    const handleDownload = () => {
        if (videoUrl) {
            saveAs(videoUrl, `virtual-studio-animation.mp4`);
        }
    };
    
    const handleCopyPrompt = () => {
        navigator.clipboard.writeText(video.prompt);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    const handleShare = async () => {
        if (!videoUrl) return;
        try {
            const response = await fetch(videoUrl);
            const blob = await response.blob();
            const file = new File([blob], 'virtual-studio-animation.mp4', { type: 'video/mp4' });

            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    files: [file],
                    title: 'Virtual Studio GIF',
                    text: `GIF based on prompt: "${video.prompt}"`,
                });
            } else {
                alert("Sharing not supported on this browser.");
            }
        } catch (error) {
            console.error("Error sharing:", error);
            alert("Could not share video.");
        }
    };

    return (
        <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 shadow-xl rounded-lg overflow-hidden">
            <div className="p-4 flex justify-between items-center border-b border-gray-200 dark:border-gray-800">
                <h4 className="font-bold text-lg text-gray-900 dark:text-white">Generated GIF</h4>
                <button 
                    onClick={onClose} 
                    className="p-1 rounded-full text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800 hover:text-gray-600 dark:hover:text-gray-200"
                    aria-label="Close video viewer"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
            <div className="p-4 min-h-[200px] flex items-center justify-center">
                {isLoading && (
                     <div className="flex flex-col items-center justify-center text-center p-8 space-y-4">
                        <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400">Loading Video...</h3>
                    </div>
                )}
                {error && <p className="text-sm text-red-500">{error}</p>}
                {videoUrl && !isLoading && (
                    <div className="space-y-4 w-full">
                        <video src={videoUrl} autoPlay loop muted playsInline className="w-full rounded-md bg-gray-100 dark:bg-gray-900 aspect-video" />
                        <div className="flex justify-center gap-2 md:gap-4">
                             {/* Share Button */}
                            <button
                                onClick={handleShare}
                                className="flex items-center gap-2 py-2 px-4 rounded-lg bg-gray-100 dark:bg-gray-900 hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-800 dark:text-gray-200 font-semibold text-sm transition-colors"
                                title="Share Video"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                </svg>
                                <span>Share</span>
                            </button>
                            {/* Download Button */}
                            <button
                                onClick={handleDownload}
                                className="flex items-center gap-2 py-2 px-4 rounded-lg bg-gray-100 dark:bg-gray-900 hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-800 dark:text-gray-200 font-semibold text-sm transition-colors"
                                title="Download as MP4"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                <span>Download GIF</span>
                            </button>
                            {/* Copy Prompt Button */}
                            <button
                                onClick={handleCopyPrompt}
                                className="flex items-center gap-2 py-2 px-4 rounded-lg bg-gray-100 dark:bg-gray-900 hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-800 dark:text-gray-200 font-semibold text-sm transition-colors"
                                title="Copy Motion Prompt"
                            >
                                {isCopied ? (
                                    <>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                        </svg>
                                        <span>Copied!</span>
                                    </>
                                ) : (
                                    <>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                        </svg>
                                        <span>Copy Prompt</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VideoResult;
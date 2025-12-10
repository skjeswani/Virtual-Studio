import React, { useState, useEffect } from 'react';
import type { GeneratedImage } from '../types';

declare const JSZip: any;
declare const saveAs: any;

interface ImageCardProps {
    img: GeneratedImage;
    index: number;
    productName: string;
    aspectRatio: string;
    addToCatalog: (image: GeneratedImage) => void;
}

const ProgressLoader: React.FC = () => {
    return (
        <div className="flex flex-col items-center justify-center h-full w-full bg-gray-50 dark:bg-gray-900">
            <svg className="animate-spin h-8 w-8 text-gray-400 dark:text-gray-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest animate-pulse">Creating...</p>
        </div>
    );
};

const ImageCard: React.FC<ImageCardProps> = ({ img, index, productName, aspectRatio, addToCatalog }) => {
    const [isCopied, setIsCopied] = useState(false);
    const [isAdded, setIsAdded] = useState(false);
    
    const aspectClass = {
        '1:1': 'aspect-square',
        '16:9': 'aspect-video',
        '9:16': 'aspect-[9/16]',
    }[aspectRatio] || 'aspect-square';

    const handleDownloadSingle = (e: React.MouseEvent) => {
        e.stopPropagation();
        saveAs(`data:image/jpeg;base64,${img.imageData}`, `${productName}-generated-${index + 1}.jpg`);
    };

    const handleCopyPrompt = (e: React.MouseEvent) => {
        e.stopPropagation();
        navigator.clipboard.writeText(img.prompt);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };
    
    const handleAddToCatalog = (e: React.MouseEvent) => {
        e.stopPropagation();
        addToCatalog(img);
        setIsAdded(true);
        setTimeout(() => setIsAdded(false), 2500); // Reset after a while
    };

    const handleShare = async (e: React.MouseEvent) => {
        e.stopPropagation();
        
        try {
            const base64Response = await fetch(`data:image/jpeg;base64,${img.imageData}`);
            const blob = await base64Response.blob();
            const file = new File([blob], `${productName}-${index + 1}.jpg`, { type: 'image/jpeg' });

            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    files: [file],
                    title: `${productName} - AI Generated`,
                    text: img.prompt,
                });
            } else {
                try {
                    await navigator.clipboard.write([
                        new ClipboardItem({
                            [blob.type]: blob,
                        }),
                    ]);
                    alert("Image copied to clipboard!");
                } catch (err) {
                    console.error("Failed to copy image", err);
                }
            }
        } catch (error) {
            console.error("Error sharing:", error);
        }
    };
    
    // Use ProgressLoader if image data is missing (loading state)
    if (!img.imageData) {
        return (
            <div className={`w-full border border-gray-200 dark:border-gray-800 ${aspectClass}`}>
                <ProgressLoader />
            </div>
        );
    }

    return (
        <div className={`w-full group relative bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 overflow-hidden ${aspectClass}`}>
            <img
                src={`data:image/jpeg;base64,${img.imageData}`}
                alt={`Generated image ${index + 1}`}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            
            {/* Action Overlay */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-2 md:gap-4">
                {/* Add to Catalog Button */}
                <button
                    onClick={handleAddToCatalog}
                    className="p-3 md:p-4 rounded-full bg-white/10 hover:bg-white text-white hover:text-black border border-white/20 hover:border-white transition-all duration-200 backdrop-blur-md shadow-lg transform hover:scale-110"
                    title="Add to Catalog"
                >
                    {isAdded ? (
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:h-6 md:w-6 text-green-400 group-hover:text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:h-6 md:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    )}
                </button>
                {/* Share Button */}
                <button
                    onClick={handleShare}
                    className="p-3 md:p-4 rounded-full bg-white/10 hover:bg-white text-white hover:text-black border border-white/20 hover:border-white transition-all duration-200 backdrop-blur-md shadow-lg transform hover:scale-110"
                    title="Share Image"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:h-6 md:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                </button>

                {/* Download Button */}
                <button
                    onClick={handleDownloadSingle}
                    className="p-3 md:p-4 rounded-full bg-white/10 hover:bg-white text-white hover:text-black border border-white/20 hover:border-white transition-all duration-200 backdrop-blur-md shadow-lg transform hover:scale-110"
                    title="Download Image"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:h-6 md:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                </button>
                
                {/* Copy Prompt Button */}
                <button
                    onClick={handleCopyPrompt}
                    className="p-3 md:p-4 rounded-full bg-white/10 hover:bg-white text-white hover:text-black border border-white/20 hover:border-white transition-all duration-200 backdrop-blur-md shadow-lg transform hover:scale-110"
                    title="Copy Prompt"
                >
                    {isCopied ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:h-6 md:w-6 text-green-400 group-hover:text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                    ) : (
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:h-6 md:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                    )}
                </button>
            </div>
        </div>
    );
};

interface ImageGalleryProps {
    images: GeneratedImage[];
    isLoading: boolean;
    error: string | null;
    baseImageUrl: string | null | undefined;
    productName: string;
    aspectRatio: string;
    addToCatalog: (image: GeneratedImage) => void;
}

const ImageGallery: React.FC<ImageGalleryProps> = ({ images, isLoading, error, baseImageUrl, productName, aspectRatio, addToCatalog }) => {
    const [isZipping, setIsZipping] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        setCurrentIndex(0);
    }, [images.length > 0 && images[0].prompt]);

    const handleDownloadAll = async () => {
        if (isZipping) return;
        setIsZipping(true);
        try {
            const zip = new JSZip();
            images.forEach((img, index) => {
                if (img.imageData) {
                    zip.file(`${productName}-generated-${index + 1}.jpg`, img.imageData, { base64: true });
                }
            });
            const content = await zip.generateAsync({ type: 'blob' });
            saveAs(content, `virtual-studio-${productName}-images.zip`);
        } catch (err) {
            console.error("Failed to create zip file:", err);
        } finally {
            setIsZipping(false);
        }
    };

    const goToPrevious = () => {
        const isFirstSlide = currentIndex === 0;
        const newIndex = isFirstSlide ? images.length - 1 : currentIndex - 1;
        setCurrentIndex(newIndex);
    };

    const goToNext = () => {
        const isLastSlide = currentIndex === images.length - 1;
        const newIndex = isLastSlide ? 0 : currentIndex + 1;
        setCurrentIndex(newIndex);
    };

    const goToSlide = (slideIndex: number) => {
        setCurrentIndex(slideIndex);
    };

    if (error) {
        return (
            <div className="h-64 flex flex-col items-center justify-center text-center p-8 space-y-2">
                <h3 className="text-xl font-bold text-red-500">Generation Failed</h3>
                <p className="text-red-500 dark:text-red-400">{error}</p>
            </div>
        );
    }

    // Phase 1: Initial Prompt Generation (Loading true, but no image placeholders yet)
    if (isLoading && images.length === 0) {
        return (
            <div className="h-64 flex flex-col items-center justify-center space-y-6 animate-fade-in">
                <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-black dark:bg-white rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-2 h-2 bg-black dark:bg-white rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-2 h-2 bg-black dark:bg-white rounded-full animate-bounce"></div>
                </div>
                <p className="text-xs font-bold text-gray-400 dark:text-gray-600 uppercase tracking-widest">Dreaming up concepts...</p>
            </div>
        );
    }

    // Phase 2 & Results: Images available (either placeholders or generated)
    if (images.length > 0) {
        const hasGeneratedImages = images.some(img => !!img.imageData);
        return (
             <div className="animate-fade-in space-y-6 w-full pt-8 mt-8 border-t border-gray-200 dark:border-gray-800">
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-extrabold text-gray-900 dark:text-white tracking-widest uppercase">Generated Results</h3>
                    {hasGeneratedImages && (
                        <button
                            onClick={handleDownloadAll}
                            disabled={isZipping}
                            className="flex items-center bg-black dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-200 text-white dark:text-black text-xs font-semibold py-2 px-3 rounded-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-wait focus:outline-none uppercase tracking-wider"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            {isZipping ? 'ZIPPING...' : 'DOWNLOAD ALL'}
                        </button>
                    )}
                </div>
                
                <div className="relative max-w-2xl mx-auto w-full group/carousel">
                    <div className="w-full shadow-2xl shadow-black/5 dark:shadow-white/5">
                         <ImageCard 
                            key={currentIndex} 
                            img={images[currentIndex]} 
                            index={currentIndex} 
                            productName={productName}
                            aspectRatio={aspectRatio}
                            addToCatalog={addToCatalog}
                        />
                    </div>
                    
                    {/* Navigation Arrows - Integrated into the image area, visible on hover (desktop) or always (touch) */}
                    <button 
                        onClick={goToPrevious}
                        className="absolute top-1/2 -translate-y-1/2 left-4 z-10 p-3 bg-white/80 dark:bg-black/80 backdrop-blur-md text-black dark:text-white rounded-full shadow-lg hover:bg-white dark:hover:bg-black transition-all duration-200 opacity-100 md:opacity-0 md:group-hover/carousel:opacity-100 focus:opacity-100"
                        aria-label="Previous image"
                    >
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    
                    <button 
                        onClick={goToNext}
                        className="absolute top-1/2 -translate-y-1/2 right-4 z-10 p-3 bg-white/80 dark:bg-black/80 backdrop-blur-md text-black dark:text-white rounded-full shadow-lg hover:bg-white dark:hover:bg-black transition-all duration-200 opacity-100 md:opacity-0 md:group-hover/carousel:opacity-100 focus:opacity-100"
                        aria-label="Next image"
                    >
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                </div>

                <div className="flex justify-center pt-2 space-x-2">
                    {images.map((_, slideIndex) => (
                        <button
                            key={slideIndex}
                            onClick={() => goToSlide(slideIndex)}
                            className={`w-2 h-2 rounded-full transition-all duration-300 focus:outline-none ${
                                currentIndex === slideIndex 
                                    ? 'bg-black dark:bg-white w-6' 
                                    : 'bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600'
                            }`}
                            aria-label={`Go to image ${slideIndex + 1}`}
                        />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center text-center min-h-[40vh] border-2 border-dashed border-gray-200 dark:border-gray-800 p-8 space-y-4">
            {baseImageUrl ? (
                <div className="p-4 border border-gray-100 dark:border-gray-800 bg-white dark:bg-black shadow-sm max-w-xs rotate-2">
                     <img src={baseImageUrl} alt="Selected base" className="max-w-full max-h-40 object-contain" />
                </div>
            ) : (
                 <div className="w-16 h-16 border-2 border-gray-300 dark:border-gray-700 flex items-center justify-center text-gray-300 dark:text-gray-700">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                 </div>
            )}
            <h3 className="text-lg font-bold text-gray-900 dark:text-white uppercase tracking-wide">Studio Ready</h3>
            <p className="max-w-md text-sm text-gray-500">
                Select a product, define your vision, and generate professional assets.
            </p>
        </div>
    );
};

export default ImageGallery;
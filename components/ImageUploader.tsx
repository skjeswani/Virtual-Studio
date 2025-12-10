import React, { useState, useCallback, useEffect, useRef } from 'react';
import { fileToImageObject, identifyProductFromImage } from '../services/geminiService';
import type { BaseImage, UserCatalogItem } from '../types';

// Helper to convert base64 to a blob URL. We need this to display catalog images.
const base64ToBlobUrl = (base64: string, mimeType: string): string => {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: mimeType });
    return URL.createObjectURL(blob);
};

interface ImageUploaderProps {
    onProductSelect: (images: BaseImage[] | null) => void;
    setProductName: (name: string) => void;
    setProductDetails: (details: string) => void;
    productName: string;
    isLoading: boolean;
    selectedReferenceUrls: string[];
    userCatalog: UserCatalogItem[];
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ 
    onProductSelect, 
    setProductName, 
    setProductDetails, 
    productName, 
    isLoading, 
    selectedReferenceUrls,
    userCatalog
}) => {
    const [selectedCatalogId, setSelectedCatalogId] = useState<string | null>(null);
    const [isIdentifying, setIsIdentifying] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    // An item is considered "uploaded" if it's not from the catalog (i.e. has a blob url and no catalog id selected)
    const isUploaded = selectedCatalogId === null && selectedReferenceUrls.length > 0 && selectedReferenceUrls[0]?.startsWith('blob:');

    // Effect: If an upload occurs, clear the catalog selection visually.
    useEffect(() => {
        if (isUploaded) {
            setSelectedCatalogId(null);
        }
    }, [isUploaded]);

    // Effect: If the selected reference URL is gone (e.g. generation starts or item is deselected), clear selection.
    useEffect(() => {
        if (selectedReferenceUrls.length === 0) {
            setSelectedCatalogId(null);
        }
    }, [selectedReferenceUrls]);

    const handleCatalogSelect = useCallback((item: UserCatalogItem) => {
        // Clear file input value to avoid conflicts
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }

        if (selectedCatalogId === item.id) {
            // Deselect
            setSelectedCatalogId(null);
            onProductSelect(null);
            setProductName('');
            setProductDetails('');
        } else {
            // Select
            setSelectedCatalogId(item.id);
            const url = base64ToBlobUrl(item.base64, item.mimeType);
            const imageObject: BaseImage = {
                base64: item.base64,
                mimeType: item.mimeType,
                url: url
            };
            onProductSelect([imageObject]);
            setProductName(item.name);
            setProductDetails(''); // Details are not saved in catalog
        }
    }, [onProductSelect, setProductName, setProductDetails, selectedCatalogId]);


    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setSelectedCatalogId(null); // Clear catalog selection
            setProductDetails(''); 
            setIsIdentifying(true);
            
            try {
                const imageObject = await fileToImageObject(file);
                onProductSelect([imageObject]); 
                setProductName("Identifying..."); 

                const identifiedName = await identifyProductFromImage(imageObject.base64, imageObject.mimeType);
                setProductName(identifiedName); 
            } catch (error) {
                console.error("Failed to process file:", error);
                // Fallback if identification fails
                if (file) {
                   try {
                        const imageObject = await fileToImageObject(file);
                        onProductSelect([imageObject]);
                    } catch (e) {
                        onProductSelect(null);
                    }
                }
                setProductName("My Product");
            } finally {
                setIsIdentifying(false);
            }
        }
    };
    
    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const hasCatalogItems = userCatalog.length > 0;

    return (
        <div className="space-y-6 relative">
            <div className="text-center">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">1. SELECT PRODUCT</h2>
                <p className="text-sm text-gray-500 mt-1">Upload a new image or choose from your catalog.</p>
            </div>
            
            <div className={`grid gap-3 ${hasCatalogItems ? 'grid-cols-3' : 'grid-cols-1'}`}>
                {/* Upload Button is always first or only item */}
                <button
                    onClick={handleUploadClick}
                    disabled={isLoading}
                    className={`group relative flex flex-col items-center justify-start transition-all duration-200 focus:outline-none ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                    <div className={`w-full aspect-square rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600 flex flex-col items-center justify-center transition-colors bg-gray-50 dark:bg-gray-900/50 ${isUploaded ? 'border-black dark:border-white' : ''}`}>
                         {isUploaded && selectedReferenceUrls.length > 0 ? (
                             <img src={selectedReferenceUrls[0]} alt="Uploaded" className="w-full h-full object-cover rounded-lg opacity-75" />
                         ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                            </svg>
                         )}
                         {isUploaded && (
                            <div className="absolute top-2 right-2 bg-black dark:bg-white text-white dark:text-black rounded-full p-1 shadow-sm z-10">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                            </div>
                         )}
                    </div>
                    <span className={`mt-1.5 text-xs uppercase tracking-wider font-medium text-center transition-colors ${isUploaded ? 'text-black dark:text-white font-bold' : 'text-gray-500 group-hover:text-gray-900 dark:group-hover:text-gray-300'}`}>
                        {isUploaded ? 'Custom' : 'Upload New'}
                    </span>
                </button>

                {/* Catalog Items */}
                {userCatalog.map((item) => {
                    const isSelected = selectedCatalogId === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => handleCatalogSelect(item)}
                            disabled={isLoading}
                            className={`group relative flex flex-col transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-black rounded-lg ${
                                isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                            }`}
                        >
                            <div className={`relative w-full aspect-square overflow-hidden rounded-lg border-2 transition-all duration-200 ${
                                isSelected
                                    ? 'border-black dark:border-white'
                                    : 'border-gray-200 dark:border-gray-800 group-hover:border-gray-400 dark:group-hover:border-gray-600'
                            }`}>
                                <img 
                                    src={`data:image/jpeg;base64,${item.base64}`} 
                                    alt={item.name} 
                                    className="w-full h-full object-cover" 
                                />
                                {isSelected && (
                                    <div className="absolute top-2 right-2 bg-black dark:bg-white text-white dark:text-black rounded-full p-1 shadow-sm z-10">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                )}
                            </div>
                            <span className={`mt-1.5 text-xs uppercase tracking-wider font-medium text-center transition-colors ${
                                isSelected ? 'text-black dark:text-white font-bold' : 'text-gray-500 group-hover:text-gray-900 dark:group-hover:text-gray-300'
                            }`}>
                                {item.name}
                            </span>
                        </button>
                    );
                })}

            </div>

            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/png, image/jpeg, image/webp"
                className="hidden"
                disabled={isLoading}
            />
            
            {isUploaded && (
                 <div className="mt-4 space-y-2 animate-fade-in">
                    <label htmlFor="product-name" className="block text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-white">
                        Product Name
                    </label>
                     <div className="relative">
                        <input
                            id="product-name"
                            type="text"
                            value={productName}
                            onChange={(e) => setProductName(e.target.value)}
                            disabled={isLoading || isIdentifying}
                            className="w-full p-3 bg-white dark:bg-black border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-1 focus:ring-black dark:focus:ring-white focus:border-black dark:focus:border-white transition-colors duration-200 placeholder-gray-400 dark:placeholder-gray-600 disabled:opacity-50 text-gray-900 dark:text-white text-sm"
                        />
                        {isIdentifying && (
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                <svg className="animate-spin h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ImageUploader;

import React, { useState, useEffect } from 'react';

interface PromptControlsProps {
    theme: string;
    setTheme: (prompt: string) => void;
    productDetails: string;
    setProductDetails: (details: string) => void;
    instructions: string;
    setInstructions: (instructions: string) => void;
    style: string;
    setStyle: (style: string) => void;
    modelOption: string;
    setModelOption: (option: string) => void;
    imageCount: number;
    setImageCount: (count: number) => void;
    aspectRatio: string;
    setAspectRatio: (ratio: string) => void;
    indianContext: boolean;
    setIndianContext: (enabled: boolean) => void;
    onAppMode: boolean;
    setOnAppMode: (enabled: boolean) => void;
    onGenerate: () => void;
    isLoading: boolean;
    isImageSelected: boolean;
}

const STYLE_OPTIONS = [
    { value: 'Natural', label: 'Natural' },
    { value: 'Studio', label: 'Studio' },
    { value: 'Cartoonish / Artistic', label: 'Artistic' },
    { value: 'Photoshoot', label: 'Photoshoot' },
];

const MODEL_OPTIONS = [
    { value: 'with', label: 'With Model' },
    { value: 'without', label: 'Without Model' },
];

const ASPECT_RATIO_OPTIONS = [
    { value: '1:1', label: 'Square' },
    { value: '16:9', label: 'Wide' },
    { value: '9:16', label: 'Tall' },
];

const PromptControls: React.FC<PromptControlsProps> = ({
    theme,
    setTheme,
    productDetails,
    setProductDetails,
    instructions,
    setInstructions,
    style,
    setStyle,
    modelOption,
    setModelOption,
    imageCount,
    setImageCount,
    aspectRatio,
    setAspectRatio,
    indianContext,
    setIndianContext,
    onAppMode,
    setOnAppMode,
    onGenerate,
    isLoading,
    isImageSelected
}) => {
    const [localCount, setLocalCount] = useState<string>(imageCount.toString());
    const [countError, setCountError] = useState<string | null>(null);

    // Sync local state if prop changes externally, but respect typing
    useEffect(() => {
        if (parseInt(localCount) !== imageCount && !countError && localCount !== '') {
            setLocalCount(imageCount.toString());
        }
    }, [imageCount, localCount, countError]);

    const handleCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        
        // Allow only digits
        if (!/^\d*$/.test(val)) return;

        setLocalCount(val);

        if (val === '') {
            setCountError("Please enter a number (1-8)");
            return;
        }

        const num = parseInt(val, 10);
        if (num < 1 || num > 8) {
            setCountError("Value must be between 1-8");
        } else {
            setCountError(null);
            setImageCount(num);
        }
    };

    return (
        <div className="space-y-8">
            <div className="space-y-2">
                <label htmlFor="theme-prompt" className="text-xl font-semibold text-gray-900 dark:text-white">2. Theme</label>
                <div className="relative">
                    <textarea
                        id="theme-prompt"
                        value={theme}
                        onChange={(e) => setTheme(e.target.value)}
                        placeholder=""
                        maxLength={120}
                        className="w-full h-16 p-3 bg-white dark:bg-black border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 placeholder-gray-400 dark:placeholder-gray-500 disabled:opacity-50 resize-none text-gray-900 dark:text-white"
                        disabled={isLoading}
                    />
                    <span className="absolute bottom-2 right-3 text-xs text-gray-400 dark:text-gray-500">
                        {theme.length} / 120
                    </span>
                </div>
            </div>
            
            <div className="space-y-2">
                <label htmlFor="product-details" className="text-xl font-semibold text-gray-900 dark:text-white">3. Product Details</label>
                <textarea
                    id="product-details"
                    value={productDetails}
                    onChange={(e) => setProductDetails(e.target.value)}
                    placeholder="e.g., A minimalist chair made of light oak wood with beige fabric cushions."
                    className="w-full h-28 p-3 bg-white dark:bg-black border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 placeholder-gray-400 dark:placeholder-gray-500 disabled:opacity-50 text-gray-900 dark:text-white"
                    disabled={isLoading}
                />
            </div>

            <div className="space-y-2">
                <label htmlFor="instructions" className="text-xl font-semibold text-gray-900 dark:text-white">4. Instructions <span className="text-sm font-normal text-gray-500">(Optional)</span></label>
                 <div className="relative">
                    <textarea
                        id="instructions"
                        value={instructions}
                        onChange={(e) => setInstructions(e.target.value)}
                        placeholder="e.g., top-down, dark moody lighting"
                        maxLength={200}
                        className="w-full h-24 p-3 bg-white dark:bg-black border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 placeholder-gray-400 dark:placeholder-gray-500 disabled:opacity-50 resize-none text-gray-900 dark:text-white"
                        disabled={isLoading}
                    />
                    <span className="absolute bottom-2 right-3 text-xs text-gray-400 dark:text-gray-500">
                        {instructions.length} / 200
                    </span>
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-xl font-semibold text-gray-900 dark:text-white">5. Select Style</label>
                 <div className="grid grid-cols-2 gap-2">
                    {STYLE_OPTIONS.map((option) => (
                        <button
                            key={option.value}
                            onClick={() => setStyle(option.value)}
                            disabled={isLoading}
                            className={`w-full py-2 px-3 text-sm font-semibold border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-black disabled:opacity-50 ${
                                style === option.value
                                    ? 'bg-gray-900 text-white dark:bg-white dark:text-black border-transparent'
                                    : 'border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-900'
                            }`}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-xl font-semibold text-gray-900 dark:text-white">6. Include Model</label>
                 <div className="grid grid-cols-2 gap-2">
                    {MODEL_OPTIONS.map((option) => (
                        <button
                            key={option.value}
                            onClick={() => setModelOption(option.value)}
                            disabled={isLoading}
                            className={`w-full py-2 px-3 text-sm font-semibold border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-black disabled:opacity-50 ${
                                modelOption === option.value
                                    ? 'bg-gray-900 text-white dark:bg-white dark:text-black border-transparent'
                                    : 'border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-900'
                            }`}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
            </div>
            
            <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">7. Generation Options</h2>
                <div className="space-y-2">
                    <label htmlFor="image-count" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Number of Images</label>
                    <input
                        type="text"
                        inputMode="numeric"
                        id="image-count"
                        value={localCount}
                        onChange={handleCountChange}
                        placeholder="1-8"
                        className={`w-full p-2 bg-white dark:bg-black border rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 disabled:opacity-50 text-gray-900 dark:text-white ${
                            countError 
                            ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                            : 'border-gray-300 dark:border-gray-700'
                        }`}
                        disabled={isLoading}
                    />
                    {countError && (
                        <p className="text-sm text-red-500 mt-1">{countError}</p>
                    )}
                </div>
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Aspect Ratio</label>
                    <div className="flex space-x-2">
                        {ASPECT_RATIO_OPTIONS.map((option) => (
                            <button
                                key={option.value}
                                onClick={() => setAspectRatio(option.value)}
                                disabled={isLoading}
                                className={`w-full py-2 px-3 text-sm font-semibold border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-black disabled:opacity-50 ${
                                    aspectRatio === option.value
                                        ? 'bg-gray-900 text-white dark:bg-white dark:text-black border-transparent'
                                        : 'border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-900'
                                }`}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                </div>
                 <div className="flex items-center justify-between pt-2">
                    <div>
                        <label htmlFor="on-app-toggle" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            On-App Imagery
                        </label>
                        <p className="text-xs text-gray-500 font-normal">Generate with In-SOP's</p>
                    </div>
                    <button
                        type="button"
                        id="on-app-toggle"
                        onClick={() => setOnAppMode(!onAppMode)}
                        disabled={isLoading}
                        className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-black disabled:opacity-50 ${
                            onAppMode ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                        }`}
                        role="switch"
                        aria-checked={onAppMode}
                    >
                        <span
                            className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${
                                onAppMode ? 'translate-x-6' : 'translate-x-1'
                            }`}
                        />
                    </button>
                </div>
                 <div className="flex items-center justify-between pt-2">
                    <div>
                        <label htmlFor="indian-context-toggle" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Indian Context
                        </label>
                        <p className="text-xs text-gray-500 font-normal">Generate scenes relevant to modern India.</p>
                    </div>
                    <button
                        type="button"
                        id="indian-context-toggle"
                        onClick={() => setIndianContext(!indianContext)}
                        disabled={isLoading}
                        className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-black disabled:opacity-50 ${
                            indianContext ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                        }`}
                        role="switch"
                        aria-checked={indianContext}
                    >
                        <span
                            className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${
                                indianContext ? 'translate-x-6' : 'translate-x-1'
                            }`}
                        />
                    </button>
                </div>
            </div>

            <button
                onClick={onGenerate}
                disabled={isLoading || !isImageSelected || !!countError || localCount === ''}
                className="w-full flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-all duration-200 disabled:bg-gray-200 dark:disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-black"
            >
                {isLoading ? (
                    <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 2000/svg">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Generating...
                    </>
                ) : (
                    '✨ Generate Images'
                )}
            </button>
             {!isImageSelected && (
                <p className="text-xs text-center text-gray-500">Please select a base image to enable generation.</p>
            )}
        </div>
    );
};

export default PromptControls;

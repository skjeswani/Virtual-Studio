
import React from 'react';

const Header: React.FC = () => {
    return (
        <header className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-black">
            <div className="container mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Virtual Studio</h1>
            </div>
        </header>
    );
};

export default Header;
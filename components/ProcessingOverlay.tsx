import React from 'react';

export const ProcessingOverlay = () => {
    return (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-20 rounded-lg">
            <div className="flex items-center space-x-2">
                <div className="w-8 h-8 border-4 border-blue-500 border-dashed rounded-full animate-spin"></div>
                <span className="text-lg font-semibold text-gray-700">Processing...</span>
            </div>
        </div>
    );
};

export default ProcessingOverlay;

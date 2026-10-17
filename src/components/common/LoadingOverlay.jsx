import React from 'react';
import ProgressBar from './ProgressBar';

const LoadingOverlay = ({
  isLoading = false,
  message = 'Memproses data...',
  progress = null,
  children,
  className = '',
}) => {
  return (
    <div className={`relative ${className}`}>
      {children}

      {isLoading && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-xs z-50 flex flex-col items-center justify-center p-6 rounded-inherit transition-opacity">
          <div className="flex flex-col items-center max-w-xs text-center">
            {/* Animated Spinner */}
            <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4" />

            {/* Loading Message */}
            <p className="text-sm font-semibold text-gray-800 tracking-tight">
              {message}
            </p>

            {/* Optional Progress Bar */}
            {typeof progress === 'number' && (
              <div className="w-48 mt-3">
                <ProgressBar value={progress} size="sm" showPercentage color="blue" />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LoadingOverlay;

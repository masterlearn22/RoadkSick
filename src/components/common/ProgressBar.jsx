import React from 'react';

const colorStyles = {
  blue: 'bg-blue-600',
  green: 'bg-emerald-600',
  red: 'bg-red-600',
  orange: 'bg-orange-500',
  yellow: 'bg-amber-500',
};

const sizeStyles = {
  sm: 'h-1.5',
  md: 'h-2.5',
  lg: 'h-4',
};

const ProgressBar = ({
  value = 0,
  label,
  showPercentage = true,
  color = 'blue',
  animated = false,
  size = 'md',
  className = '',
}) => {
  const clampedValue = Math.min(100, Math.max(0, Math.round(value)));
  const fillColor = colorStyles[color] || colorStyles.blue;
  const barHeight = sizeStyles[size] || sizeStyles.md;

  return (
    <div className={`w-full ${className}`}>
      {(label || showPercentage) && (
        <div className="flex justify-between items-center mb-1 text-xs">
          {label && (
            <span className="font-medium text-gray-700 truncate">{label}</span>
          )}
          {showPercentage && (
            <span className="font-semibold text-gray-900 ml-auto">
              {clampedValue}%
            </span>
          )}
        </div>
      )}

      <div className={`w-full bg-gray-100 rounded-full overflow-hidden ${barHeight}`}>
        <div
          className={`${fillColor} ${barHeight} rounded-full transition-all duration-300 ease-out ${
            animated ? 'animate-pulse' : ''
          }`}
          style={{ width: `${clampedValue}%` }}
          role="progressbar"
          aria-valuenow={clampedValue}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  );
};

export default ProgressBar;

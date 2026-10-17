import React from 'react';

const colorStyles = {
  blue: {
    bgIcon: 'bg-blue-50 text-blue-600 border-blue-100',
    border: 'hover:border-blue-300',
  },
  emerald: {
    bgIcon: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    border: 'hover:border-emerald-300',
  },
  red: {
    bgIcon: 'bg-rose-50 text-rose-600 border-rose-100',
    border: 'hover:border-rose-300',
  },
  orange: {
    bgIcon: 'bg-orange-50 text-orange-600 border-orange-100',
    border: 'hover:border-orange-300',
  },
  purple: {
    bgIcon: 'bg-amber-50 text-amber-600 border-amber-100',
    border: 'hover:border-amber-300',
  },
};

const StatCard = ({
  title,
  value,
  icon,
  change,
  changeType = 'increase',
  subtitle,
  color = 'blue',
  className = '',
}) => {
  const chosenColor = colorStyles[color] || colorStyles.blue;
  const isIncrease = changeType === 'increase';

  return (
    <div
      className={`bg-white rounded-2xl border border-slate-200/90 p-3 sm:p-4 shadow-2xs transition-all duration-200 hover:shadow-md ${chosenColor.border} ${className}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider truncate">
            {title}
          </p>
          <div className="mt-1 sm:mt-1.5 flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {value}
            </span>
          </div>

          {(change !== undefined || subtitle) && (
            <div className="mt-1.5 sm:mt-2 flex items-center flex-wrap gap-1 text-[10px] sm:text-xs">
              {change !== undefined && (
                <span
                  className={`inline-flex items-center gap-0.5 font-bold px-1.5 py-0.2 rounded-md ${
                    isIncrease
                      ? 'text-emerald-700 bg-emerald-50'
                      : 'text-rose-700 bg-rose-50'
                  }`}
                >
                  <span>{isIncrease ? '↑' : '↓'}</span>
                  <span>{change}</span>
                </span>
              )}
              {subtitle && (
                <span className="text-slate-500 font-medium truncate">{subtitle}</span>
              )}
            </div>
          )}
        </div>

        {icon && (
          <div
            className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center flex-shrink-0 border shadow-2xs ${chosenColor.bgIcon}`}
          >
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;

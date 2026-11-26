import React from 'react';

const Card = ({
  children,
  className = '',
  title,
  subtitle,
  headerRight,
  noPadding = false,
  ...props
}) => {
  const hasHeader = title || subtitle || headerRight;

  return (
    <div
      className={`bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden transition-all ${className}`}
      {...props}
    >
      {hasHeader && (
        <div className="px-4 sm:px-5 py-3.5 sm:py-4 border-b border-slate-100 flex items-center justify-between gap-4">
          <div className="min-w-0">
            {title && (
              <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-snug truncate">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 truncate">
                {subtitle}
              </p>
            )}
          </div>
          {headerRight && (
            <div className="flex items-center gap-2 flex-shrink-0">
              {headerRight}
            </div>
          )}
        </div>
      )}
      <div className={noPadding ? '' : 'p-4 sm:p-5'}>{children}</div>
    </div>
  );
};

export default Card;

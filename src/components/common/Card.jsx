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
      className={`bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden transition-all ${className}`}
      {...props}
    >
      {hasHeader && (
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-4">
          <div>
            {title && (
              <h3 className="font-semibold text-gray-900 text-base leading-snug">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
            )}
          </div>
          {headerRight && <div className="flex items-center gap-2">{headerRight}</div>}
        </div>
      )}
      <div className={noPadding ? '' : 'p-5'}>{children}</div>
    </div>
  );
};

export default Card;

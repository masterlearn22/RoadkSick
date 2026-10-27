import React from 'react';

const PageContainer = ({
  children,
  title,
  subtitle,
  action,
  className = '',
  hideHeaderOnMobile = false,
}) => {
  return (
    <div
      className={`flex-1 overflow-y-auto p-2 sm:p-5 md:p-6 space-y-3 sm:space-y-6 ${className}`}
    >
      {(title || subtitle || action) && (
        <div
          className={`flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-200/80 ${
            hideHeaderOnMobile ? 'hidden sm:flex' : 'flex'
          }`}
        >
          <div>
            {title && (
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5 leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>
          {action && (
            <div className="flex items-center gap-2 self-start sm:self-auto flex-shrink-0">
              {action}
            </div>
          )}
        </div>
      )}
      {children}
    </div>
  );
};

export default PageContainer;

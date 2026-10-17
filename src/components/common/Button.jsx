import React from 'react';

const variantClasses = {
  primary:
    'bg-blue-600 hover:bg-blue-700 text-white shadow-sm border border-transparent focus:ring-blue-500',
  secondary:
    'bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 shadow-xs focus:ring-gray-300',
  success:
    'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm border border-transparent focus:ring-emerald-500',
  danger:
    'bg-red-600 hover:bg-red-700 text-white shadow-sm border border-transparent focus:ring-red-500',
  ghost:
    'bg-transparent hover:bg-gray-100 text-gray-600 hover:text-gray-900 border border-transparent focus:ring-gray-300',
};

const sizeClasses = {
  sm: 'px-2.5 py-1.5 text-xs font-medium rounded-md gap-1.5',
  md: 'px-4 py-2 text-sm font-medium rounded-lg gap-2',
  lg: 'px-5 py-2.5 text-base font-medium rounded-xl gap-2.5',
};

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  loading = false,
  disabled = false,
  onClick,
  className = '',
  type = 'button',
  ...props
}) => {
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={`inline-flex items-center justify-center transition-all select-none focus:outline-none focus:ring-2 focus:ring-offset-1 ${
        variantClasses[variant] || variantClasses.primary
      } ${sizeClasses[size] || sizeClasses.md} ${
        isDisabled ? 'opacity-60 cursor-not-allowed shadow-none' : 'active:scale-[0.98]'
      } ${className}`}
      {...props}
    >
      {loading ? (
        <svg
          className="animate-spin -ml-0.5 h-4 w-4 text-current"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : icon ? (
        <span className="flex-shrink-0 flex items-center justify-center">{icon}</span>
      ) : null}
      {children}
    </button>
  );
};

export default Button;

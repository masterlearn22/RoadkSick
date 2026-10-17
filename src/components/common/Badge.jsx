import React from 'react';

const variantStyles = {
  default: 'bg-gray-100 text-gray-800 border-gray-200',
  pothole: 'bg-red-50 text-red-700 border-red-200',
  longitudinal_crack: 'bg-orange-50 text-orange-700 border-orange-200',
  alligator_crack: 'bg-yellow-50 text-yellow-800 border-yellow-300',
  rutting: 'bg-blue-50 text-blue-700 border-blue-200',
  patches: 'bg-green-50 text-green-700 border-green-200',
  high: 'bg-red-50 text-red-700 border-red-200 font-semibold',
  medium: 'bg-amber-50 text-amber-800 border-amber-200 font-semibold',
  low: 'bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold',
};

const defaultIcons = {
  pothole: '🕳️',
  longitudinal_crack: '🔀',
  alligator_crack: '🐊',
  rutting: '🛞',
  patches: '🩹',
};

const Badge = ({
  children,
  variant = 'default',
  showIcon = false,
  className = '',
  ...props
}) => {
  const currentVariant = variantStyles[variant] || variantStyles.default;
  const icon = showIcon ? defaultIcons[variant] : null;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full text-xs font-medium px-2.5 py-0.5 border ${currentVariant} ${className}`}
      {...props}
    >
      {icon && <span className="text-[11px] leading-none">{icon}</span>}
      <span>{children}</span>
    </span>
  );
};

export default Badge;

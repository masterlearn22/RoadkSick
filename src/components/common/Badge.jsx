import React from 'react';
import { getDamageTypeConfig } from '../../data/damageTypes';

const variantStyles = {
  default: 'bg-slate-100 text-slate-700 border-slate-200',
  pothole: 'bg-rose-50 text-rose-700 border-rose-200/80',
  rutting: 'bg-purple-50 text-purple-700 border-purple-200/80',
  patches: 'bg-purple-50 text-purple-700 border-purple-200/80',
  alligator_crack: 'bg-orange-50 text-orange-700 border-orange-200/80',
  longitudinal_crack: 'bg-amber-50 text-amber-800 border-amber-200/80',
  high: 'bg-rose-50 text-rose-700 border-rose-200 font-semibold',
  berat: 'bg-rose-50 text-rose-700 border-rose-200 font-semibold',
  tinggi: 'bg-rose-50 text-rose-700 border-rose-200 font-semibold',
  medium: 'bg-amber-50 text-amber-800 border-amber-200 font-semibold',
  sedang: 'bg-amber-50 text-amber-800 border-amber-200 font-semibold',
  low: 'bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold',
  ringan: 'bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold',
};

const Badge = ({
  children,
  variant = 'default',
  showIcon = false,
  className = '',
  ...props
}) => {
  const currentVariant = variantStyles[variant] || variantStyles.default;
  const isDamageKey = ['pothole', 'rutting', 'patches', 'alligator_crack', 'longitudinal_crack'].includes(variant);
  const icon = showIcon && isDamageKey ? getDamageTypeConfig(variant).icon : null;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full text-[11px] font-semibold px-2.5 py-0.5 border ${currentVariant} ${className}`}
      {...props}
    >
      {icon && <span className="text-[11px] leading-none">{icon}</span>}
      <span>{children}</span>
    </span>
  );
};

export default Badge;

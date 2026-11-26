import React from 'react';
import { getDamageTypeConfig } from '../../data/damageTypes';

/**
 * DamageLabel
 * Badge untuk menampilkan 1 dari 4 kelas kerusakan resmi beserta skor keyakinan.
 */
const DamageLabel = ({
  type,
  confidence,
  size = 'md',
  showConfidence = false,
  className = '',
}) => {
  const damage = getDamageTypeConfig(type);

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1.5',
    md: 'text-xs px-2.5 py-1 gap-2',
    lg: 'text-sm px-3.5 py-1.5 gap-2.5 font-semibold',
  };

  return (
    <span
      className={`inline-flex items-center rounded-lg font-semibold border transition-colors ${
        sizeClasses[size] || sizeClasses.md
      } ${className}`}
      style={{
        color: damage.color,
        backgroundColor: `${damage.color}14`,
        borderColor: `${damage.color}35`,
      }}
    >
      <span className="leading-none">{damage.icon}</span>
      <span>{damage.label}</span>

      {showConfidence && confidence !== undefined && (
        <span
          className="ml-1 px-1.5 py-0.2 rounded font-mono text-[10px] font-bold"
          style={{
            backgroundColor: `${damage.color}25`,
            color: damage.color,
          }}
        >
          {((confidence <= 1 ? confidence * 100 : confidence)).toFixed(0)}%
        </span>
      )}
    </span>
  );
};

export default DamageLabel;

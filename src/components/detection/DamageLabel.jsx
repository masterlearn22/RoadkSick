import React from 'react';
import { DAMAGE_TYPES } from '../../data/damageTypes';

/**
 * DamageLabel
 * Badge component for displaying damage type with icon, label, and confidence score.
 *
 * @param {string} type - Key in DAMAGE_TYPES ('pothole', 'longitudinal_crack', etc.)
 * @param {number} confidence - Confidence score 0 - 1
 * @param {'sm'|'md'|'lg'} size - Badge size
 * @param {boolean} showConfidence - Whether to show the percentage badge
 */
const DamageLabel = ({
  type,
  confidence,
  size = 'md',
  showConfidence = false,
  className = '',
}) => {
  const damage = DAMAGE_TYPES[type] || {
    label: type || 'Unknown',
    labelId: 'Tidak Diketahui',
    color: '#6B7280',
    icon: '⚠️',
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1.5',
    md: 'text-xs px-2.5 py-1 gap-2',
    lg: 'text-sm px-3.5 py-1.5 gap-2.5 font-semibold',
  };

  return (
    <span
      className={`inline-flex items-center rounded-md font-medium border transition-colors shadow-2xs ${
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
          {(confidence * 100).toFixed(0)}%
        </span>
      )}
    </span>
  );
};

export default DamageLabel;

import React from 'react';
import { DAMAGE_TYPES } from '../../data/damageTypes';

/**
 * DetectionSummary
 * Summary panel for detection results showing total count and per-type horizontal bars.
 *
 * @param {Array} detections - List of detections or summary counts
 * @param {number} totalCount - Optional explicit total count
 */
const DetectionSummary = ({
  detections = [],
  totalCount,
  className = '',
}) => {
  // Calculate distribution by type
  const counts = Object.keys(DAMAGE_TYPES).reduce((acc, key) => {
    acc[key] = 0;
    return acc;
  }, {});

  detections.forEach((d) => {
    const type = d.type || d.damage_type || d.key;
    if (counts[type] !== undefined) {
      counts[type] += d.count || 1;
    }
  });

  const computedTotal =
    totalCount !== undefined
      ? totalCount
      : Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <div
      className={`bg-white rounded-xl border border-gray-200 p-5 shadow-sm ${className}`}
    >
      <div className="flex items-center justify-between pb-4 border-b border-gray-100">
        <div>
          <h3 className="font-bold text-gray-900 text-base">
            Ringkasan Kerusakan
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Statistik deteksi berdasarkan klasifikasi YOLOv8
          </p>
        </div>
        <div className="text-right">
          <span className="text-2xl font-black text-gray-900 tracking-tight">
            {computedTotal}
          </span>
          <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">
            Total Temuan
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-3.5">
        {Object.entries(DAMAGE_TYPES).map(([key, typeInfo]) => {
          const count = counts[key] || 0;
          const percentage =
            computedTotal > 0 ? ((count / computedTotal) * 100).toFixed(0) : 0;

          return (
            <div key={key} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-base leading-none">{typeInfo.icon}</span>
                  <span className="font-semibold text-gray-800">
                    {typeInfo.label}
                  </span>
                  <span className="text-[11px] text-gray-400 font-normal">
                    ({typeInfo.labelId})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-900 font-mono">
                    {count}
                  </span>
                  <span className="text-gray-400 text-[11px] w-9 text-right font-mono">
                    {percentage}%
                  </span>
                </div>
              </div>

              {/* Horizontal bar */}
              <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500 ease-out"
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: typeInfo.color,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DetectionSummary;

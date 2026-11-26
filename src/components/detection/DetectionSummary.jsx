import React from 'react';
import { OFFICIAL_DAMAGE_TYPES, normalizeDamageType } from '../../data/damageTypes';

/**
 * DetectionSummary
 * Ringkasan distribusi 4 kelas kerusakan resmi skripsi.
 */
const DetectionSummary = ({
  detections = [],
  totalCount,
  className = '',
}) => {
  const counts = OFFICIAL_DAMAGE_TYPES.reduce((acc, item) => {
    acc[item.id] = 0;
    return acc;
  }, {});

  detections.forEach((d) => {
    const key = normalizeDamageType(d.type || d.damage_type || d.key);
    counts[key] = (counts[key] || 0) + (d.count || 1);
  });

  const computedTotal =
    totalCount !== undefined
      ? totalCount
      : Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <div
      className={`bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs ${className}`}
    >
      <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
        <div>
          <h3 className="font-bold text-slate-900 text-sm sm:text-base">
            Ringkasan 4 Kelas Kerusakan
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Klasifikasi real-time model YOLO terbaik
          </p>
        </div>
        <div className="text-right">
          <span className="text-2xl font-black text-slate-900 tracking-tight">
            {computedTotal}
          </span>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Total Temuan
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {OFFICIAL_DAMAGE_TYPES.map((typeInfo) => {
          const count = counts[typeInfo.id] || 0;
          const percentage =
            computedTotal > 0 ? Math.round((count / computedTotal) * 100) : 0;

          return (
            <div key={typeInfo.id} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm leading-none">{typeInfo.icon}</span>
                  <span className="font-semibold text-slate-800 truncate">
                    {typeInfo.label}
                  </span>
                  <span className="text-[10px] text-slate-400 hidden sm:inline">
                    ({typeInfo.englishLabel})
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 font-mono">
                  <span className="font-bold text-slate-900">{count}</span>
                  <span className="text-slate-400 text-[11px] w-9 text-right">
                    {percentage}%
                  </span>
                </div>
              </div>

              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
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

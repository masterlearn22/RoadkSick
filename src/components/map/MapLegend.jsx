import React from 'react';
import { OFFICIAL_DAMAGE_TYPES, normalizeDamageType } from '../../data/damageTypes';

const MapLegend = ({ markers = [], className = '' }) => {
  const typeCounts = markers.reduce((acc, m) => {
    const key = normalizeDamageType(m.type);
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  return (
    <div
      className={`bg-white/95 backdrop-blur-md p-3.5 rounded-2xl border border-slate-200/90 shadow-xl text-xs pointer-events-auto ${className}`}
    >
      <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-slate-100 gap-4">
        <h4 className="font-extrabold text-slate-800 text-[11px] uppercase tracking-wider">
          Legenda 4 Kelas
        </h4>
        <span className="text-[10px] bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded-full">
          {markers.length} titik
        </span>
      </div>

      <div className="space-y-2">
        {OFFICIAL_DAMAGE_TYPES.map((item) => {
          const count = typeCounts[item.id] || 0;
          return (
            <div key={item.id} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 shadow-2xs text-[10px] border border-white"
                  style={{ backgroundColor: item.color }}
                >
                  {item.icon}
                </span>
                <span className="text-slate-700 font-semibold text-[11px] truncate">
                  {item.label}
                </span>
              </div>
              <span className="font-mono font-bold text-slate-600 text-[11px]">
                {count}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MapLegend;

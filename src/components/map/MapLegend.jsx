import React from 'react';
import { DAMAGE_TYPES } from '../../utils/damageTypes';

const MapLegend = ({ markers = [], className = '' }) => {
  // Compute counts per type
  const typeCounts = markers.reduce((acc, m) => {
    const t = m.type || 'pothole';
    acc[t] = (acc[t] || 0) + 1;
    return acc;
  }, {});

  const damageList = Object.values(DAMAGE_TYPES);

  return (
    <div
      className={`bg-white/95 backdrop-blur-xs p-3.5 rounded-xl border border-gray-200/80 shadow-md text-xs pointer-events-auto ${className}`}
    >
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-100">
        <h4 className="font-bold text-gray-800 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
          <span>🗺️</span>
          <span>Legenda Peta</span>
        </h4>
        <span className="text-[10px] bg-gray-100 text-gray-600 font-semibold px-2 py-0.5 rounded-full">
          {markers.length} titik
        </span>
      </div>

      <div className="space-y-2">
        {damageList.map((item) => {
          const count = typeCounts[item.id] || 0;
          return (
            <div key={item.id} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span
                  className="w-3.5 h-3.5 rounded-full flex items-center justify-center flex-shrink-0 shadow-2xs text-[9px]"
                  style={{ backgroundColor: item.color }}
                >
                  {item.icon}
                </span>
                <span className="text-gray-700 font-medium text-[11px]">
                  {item.shortLabel}
                </span>
              </div>
              <span className="font-mono font-bold text-gray-500 text-[11px]">
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

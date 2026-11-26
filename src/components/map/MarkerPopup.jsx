import React from 'react';
import Badge from '../common/Badge';
import { formatCoordinate, formatTimestamp, formatConfidence } from '../../utils/formatters';
import { getDamageTypeConfig } from '../../data/damageTypes';
import { DEFAULT_CENTER, SEVERITY_LEVELS, normalizeSeverity } from '../../utils/constants';

const MarkerPopup = ({ detection, onDetailClick, onNavigateClick }) => {
  if (!detection) return null;

  const config = getDamageTypeConfig(detection.type);
  const normSev = normalizeSeverity(detection.severity);
  const sevConfig = SEVERITY_LEVELS[normSev];

  let lat = DEFAULT_CENTER[0];
  let lng = DEFAULT_CENTER[1];
  if (detection.coordinates?.lat !== undefined) {
    lat = detection.coordinates.lat;
    lng = detection.coordinates.lng;
  } else if (Array.isArray(detection.position)) {
    lat = detection.position[0];
    lng = detection.position[1];
  } else if (Array.isArray(detection.coordinates)) {
    lat = detection.coordinates[0];
    lng = detection.coordinates[1];
  }

  const handleOpenGoogleMaps = (e) => {
    e.stopPropagation();
    if (onNavigateClick) {
      onNavigateClick(detection);
    } else {
      window.open(
        `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
        '_blank',
        'noopener,noreferrer'
      );
    }
  };

  const handleDetail = (e) => {
    e.stopPropagation();
    if (onDetailClick) {
      onDetailClick(detection);
    }
  };

  return (
    <div className="w-64 p-1 text-slate-800 text-xs">
      <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-slate-100">
        <Badge variant={detection.type} showIcon>
          {config.label}
        </Badge>
        <Badge variant={normSev}>{sevConfig.shortLabel}</Badge>
      </div>

      {/* Foto Bukti */}
      <div
        onClick={handleDetail}
        className="w-full h-28 mb-2.5 bg-slate-900 rounded-xl overflow-hidden flex items-center justify-center border border-slate-200 relative group cursor-pointer"
        title="Klik untuk melihat detail lengkap"
      >
        {detection.imageUrl ? (
          <>
            <img
              src={detection.imageUrl}
              alt={config.label}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            />
            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[11px] font-bold transition-opacity">
              Lihat Detail Foto
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center text-slate-400">
            <span className="text-2xl mb-0.5">{config.icon}</span>
            <span className="text-[10px] text-slate-400 font-medium">
              Foto Bukti Tidak Tersedia
            </span>
          </div>
        )}
      </div>

      <div className="space-y-1.5 mb-3 text-[11px]">
        <div className="flex justify-between items-baseline gap-2">
          <span className="text-slate-500">Segmen:</span>
          <span className="font-semibold text-slate-900 text-right truncate max-w-[155px]">
            {detection.route_segment || detection.location || 'Jombang – Surabaya'}
          </span>
        </div>

        <div className="flex justify-between items-baseline">
          <span className="text-slate-500">Confidence:</span>
          <span className="font-bold text-emerald-600 font-mono">
            {formatConfidence(detection.confidence)}
          </span>
        </div>

        <div className="flex justify-between items-baseline">
          <span className="text-slate-500">Koordinat:</span>
          <span className="font-mono text-[10px] text-slate-700">
            {formatCoordinate(lat, 5)}, {formatCoordinate(lng, 5)}
          </span>
        </div>

        {detection.timestamp && (
          <div className="flex justify-between items-baseline">
            <span className="text-slate-500">Waktu:</span>
            <span className="text-slate-600 text-[10px]">
              {formatTimestamp(detection.timestamp)}
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
        <button
          type="button"
          onClick={handleDetail}
          className="px-2 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-bold text-[11px] transition-colors text-center cursor-pointer"
        >
          Detail Lengkap
        </button>
        <button
          type="button"
          onClick={handleOpenGoogleMaps}
          className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-[11px] transition-colors text-center cursor-pointer"
        >
          Google Maps
        </button>
      </div>
    </div>
  );
};

export default MarkerPopup;

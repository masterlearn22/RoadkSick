import React from 'react';
import Badge from '../common/Badge';
import { formatCoordinate, formatTimestamp, formatConfidence } from '../../utils/formatters';
import { getDamageTypeConfig } from '../../utils/damageTypes';

const MarkerPopup = ({ detection, onDetailClick, onNavigateClick }) => {
  if (!detection) return null;

  const config = getDamageTypeConfig(detection.type);

  // Extract coordinates safely
  let lat = -6.917;
  let lng = 107.619;
  if (Array.isArray(detection.coordinates)) {
    lat = detection.coordinates[0];
    lng = detection.coordinates[1];
  } else if (detection.coordinates?.system) {
    lat = detection.coordinates.system.lat;
    lng = detection.coordinates.system.lng;
  } else if (detection.coordinates?.lat !== undefined) {
    lat = detection.coordinates.lat;
    lng = detection.coordinates.lng;
  } else if (Array.isArray(detection.position)) {
    lat = detection.position[0];
    lng = detection.position[1];
  }

  const handleOpenGoogleMaps = (e) => {
    e.stopPropagation();
    if (onNavigateClick) {
      onNavigateClick(detection);
    } else {
      const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleDetail = (e) => {
    e.stopPropagation();
    if (onDetailClick) {
      onDetailClick(detection);
    } else {
      alert(`Detail Kerusakan ID: ${detection.id}\nJenis: ${config.label}\nLokasi: ${detection.location || detection.locationName || 'Kota Bandung'}\nKoordinat: ${lat}, ${lng}`);
    }
  };

  return (
    <div className="w-64 p-1 text-gray-800 text-xs">
      {/* Header: Badge & ID */}
      <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-gray-100">
        <Badge variant={detection.type} showIcon>
          {config.shortLabel}
        </Badge>
        <span className="font-mono font-semibold text-gray-500 text-[11px]">
          {detection.id}
        </span>
      </div>

      {/* Image Thumbnail / Placeholder */}
      <div className="w-full h-24 mb-2.5 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center border border-gray-200 relative group">
        {detection.imageUrl ? (
          <img
            src={detection.imageUrl}
            alt={config.label}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-gray-400">
            <span className="text-2xl mb-0.5">📷</span>
            <span className="text-[10px] text-gray-400 font-medium">Foto Deteksi YOLOv8</span>
          </div>
        )}
      </div>

      {/* Info Rows */}
      <div className="space-y-1.5 mb-3 text-[11px]">
        <div className="flex justify-between items-baseline">
          <span className="text-gray-500">Lokasi:</span>
          <span className="font-medium text-gray-900 text-right truncate max-w-[150px]">
            {detection.location || detection.locationName || detection.roadName || 'Kota Bandung'}
          </span>
        </div>

        <div className="flex justify-between items-baseline">
          <span className="text-gray-500">Keyakinan:</span>
          <span className="font-semibold text-emerald-600">
            {formatConfidence(detection.confidence)}
          </span>
        </div>

        <div className="flex justify-between items-baseline">
          <span className="text-gray-500">Koordinat:</span>
          <span className="font-mono text-[10px] text-gray-700">
            {formatCoordinate(lat, 5)}, {formatCoordinate(lng, 5)}
          </span>
        </div>

        {detection.timestamp && (
          <div className="flex justify-between items-baseline">
            <span className="text-gray-500">Waktu:</span>
            <span className="text-gray-600 text-[10px]">
              {formatTimestamp(detection.timestamp)}
            </span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-gray-100">
        <button
          type="button"
          onClick={handleDetail}
          className="px-2 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-md font-semibold text-[11px] transition-colors text-center"
        >
          🔍 Detail
        </button>
        <button
          type="button"
          onClick={handleOpenGoogleMaps}
          className="px-2 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md font-semibold text-[11px] transition-colors text-center"
        >
          📍 Navigate
        </button>
      </div>
    </div>
  );
};

export default MarkerPopup;

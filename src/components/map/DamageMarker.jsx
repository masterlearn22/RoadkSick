import React, { useMemo } from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import MarkerPopup from './MarkerPopup';
import { getDamageTypeConfig } from '../../utils/damageTypes';

const DamageMarker = ({ detection, isSelected = false, onClick, onDetailClick, onNavigateClick }) => {
  if (!detection) return null;

  const position = useMemo(() => {
    if (Array.isArray(detection.coordinates)) {
      return detection.coordinates;
    }
    if (detection.coordinates?.system) {
      return [detection.coordinates.system.lat, detection.coordinates.system.lng];
    }
    if (detection.coordinates?.lat !== undefined) {
      return [detection.coordinates.lat, detection.coordinates.lng];
    }
    if (Array.isArray(detection.position)) {
      return detection.position;
    }
    return [-6.917, 107.619];
  }, [detection]);

  const customIcon = useMemo(() => {
    const config = getDamageTypeConfig(detection.type);
    const color = config.color;
    const icon = config.icon;
    const size = isSelected ? 34 : 26;

    return L.divIcon({
      className: 'road-damage-marker-container',
      html: `
        <div style="
          width: ${size}px;
          height: ${size}px;
          background-color: ${color};
          border: ${isSelected ? '3px solid #1E293B' : '2px solid #FFFFFF'};
          border-radius: 9999px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.25), 0 2px 4px -2px rgba(0, 0, 0, 0.2);
          cursor: pointer;
          transform: ${isSelected ? 'scale(1.15)' : 'scale(1)'};
          transition: transform 0.2s ease, border-color 0.2s ease;
        ">
          <span style="font-size: ${isSelected ? '15px' : '12px'}; line-height: 1; user-select: none;">
            ${icon}
          </span>
        </div>
      `,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
      popupAnchor: [0, -(size / 2) - 4],
    });
  }, [detection.type, isSelected]);

  return (
    <Marker
      position={position}
      icon={customIcon}
      eventHandlers={{
        click: () => {
          if (onClick) onClick(detection);
        },
      }}
    >
      <Popup closeButton={true} className="custom-leaflet-popup">
        <MarkerPopup
          detection={detection}
          onDetailClick={onDetailClick}
          onNavigateClick={onNavigateClick}
        />
      </Popup>
    </Marker>
  );
};

export default DamageMarker;

import React, { useMemo } from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import MarkerPopup from './MarkerPopup';
import { getDamageTypeConfig } from '../../data/damageTypes';
import { DEFAULT_CENTER } from '../../utils/constants';

const DamageMarker = ({
  detection,
  isSelected = false,
  onClick,
  onDetailClick,
  onNavigateClick,
}) => {
  const position = useMemo(() => {
    if (!detection) return DEFAULT_CENTER;
    if (Array.isArray(detection.position)) return detection.position;
    if (Array.isArray(detection.coordinates)) return detection.coordinates;
    if (detection.coordinates?.lat !== undefined) {
      return [detection.coordinates.lat, detection.coordinates.lng];
    }
    if (detection.coordinates?.system) {
      return [detection.coordinates.system.lat, detection.coordinates.system.lng];
    }
    return DEFAULT_CENTER;
  }, [detection]);

  const detectionType = detection?.type;

  const customIcon = useMemo(() => {
    const config = getDamageTypeConfig(detectionType);
    const color = config.color;
    const icon = config.icon;
    const size = isSelected ? 36 : 28;

    return L.divIcon({
      className: 'road-damage-marker-container',
      html: `
        <div style="
          width: ${size}px;
          height: ${size}px;
          background-color: ${color};
          border: ${isSelected ? '3px solid #0F172A' : '2.5px solid #FFFFFF'};
          border-radius: 9999px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 10px -1px rgba(15, 23, 42, 0.35);
          cursor: pointer;
          transform: ${isSelected ? 'scale(1.12)' : 'scale(1)'};
          transition: transform 0.2s ease;
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
  }, [detectionType, isSelected]);

  if (!detection) return null;

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

import React, { useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import DamageMarker from './DamageMarker';
import { DEFAULT_CENTER, DEFAULT_ZOOM } from '../../utils/constants';

import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
});

const MapEffect = ({ flyTarget }) => {
  const map = useMap();

  useEffect(() => {
    if (!flyTarget) return;
    const { lat, lng, zoom } = flyTarget;
    if (lat != null && lng != null) {
      map.flyTo([lat, lng], zoom || 15, { duration: 0.9 });
    }
  }, [flyTarget, map]);

  return null;
};

const GISMap = ({
  markers = [],
  basemap = 'osm', // 'osm' | 'satellite'
  userLocation = null,
  flyTarget = null,
  onMarkerClick,
  onDetailClick,
  selectedMarkerId,
  center = DEFAULT_CENTER,
  zoom = DEFAULT_ZOOM,
  className = '',
  children,
}) => {
  return (
    <div
      className={`relative w-full h-full min-h-[400px] overflow-hidden rounded-xl border border-slate-200 ${className}`}
    >
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={true}
        className="w-full h-full z-0"
      >
        {basemap === 'satellite' ? (
          <TileLayer
            attribution="Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics | RoadSick Web GIS"
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            maxZoom={19}
          />
        ) : (
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> | RoadSick Web GIS'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
          />
        )}

        <MapEffect flyTarget={flyTarget} />

        {/* Titik Lokasi Pengguna (Web Geolocation API) */}
        {userLocation?.lat != null && userLocation?.lng != null && (
          <CircleMarker
            center={[userLocation.lat, userLocation.lng]}
            radius={9}
            pathOptions={{
              color: '#FFFFFF',
              weight: 3,
              fillColor: '#2563EB',
              fillOpacity: 1,
            }}
          >
            <Tooltip direction="top" offset={[0, -8]}>
              <span className="text-xs font-bold">Posisi Anda Saat Ini</span>
            </Tooltip>
          </CircleMarker>
        )}

        {/* Marker Kerusakan Jalan */}
        {markers.map((marker) => (
          <DamageMarker
            key={marker.id}
            detection={marker}
            isSelected={marker.id === selectedMarkerId}
            onClick={() => onMarkerClick && onMarkerClick(marker)}
            onDetailClick={onDetailClick}
          />
        ))}

        {children}
      </MapContainer>
    </div>
  );
};

export default GISMap;

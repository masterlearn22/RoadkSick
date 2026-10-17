import React, { useEffect } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import DamageMarker from './DamageMarker';

// Fix Vite leaflet default icon path issues
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
});

const DEFAULT_CENTER = [-6.917, 107.619]; // Bandung City Center
const DEFAULT_ZOOM = 14;

// Helper component to center map when selected marker changes
const MapEffect = ({ center, zoom, selectedMarker }) => {
  const map = useMap();

  useEffect(() => {
    if (selectedMarker) {
      let lat = null;
      let lng = null;
      if (Array.isArray(selectedMarker.coordinates)) {
        lat = selectedMarker.coordinates[0];
        lng = selectedMarker.coordinates[1];
      } else if (selectedMarker.coordinates?.system) {
        lat = selectedMarker.coordinates.system.lat;
        lng = selectedMarker.coordinates.system.lng;
      } else if (selectedMarker.coordinates?.lat !== undefined) {
        lat = selectedMarker.coordinates.lat;
        lng = selectedMarker.coordinates.lng;
      } else if (Array.isArray(selectedMarker.position)) {
        lat = selectedMarker.position[0];
        lng = selectedMarker.position[1];
      }

      if (lat !== null && lng !== null) {
        map.flyTo([lat, lng], 16, { duration: 1 });
      }
    }
  }, [selectedMarker, map]);

  return null;
};

const GISMap = ({
  markers = [],
  onMarkerClick,
  selectedMarkerId,
  center = DEFAULT_CENTER,
  zoom = DEFAULT_ZOOM,
  className = '',
  children,
}) => {
  const selectedMarker = markers.find((m) => m.id === selectedMarkerId);

  return (
    <div className={`relative w-full h-full min-h-[400px] overflow-hidden rounded-xl border border-gray-200 shadow-xs ${className}`}>
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={true}
        className="w-full h-full z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> kontributor | RoadSick Web GIS'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        <MapEffect
          center={center}
          zoom={zoom}
          selectedMarker={selectedMarker}
        />

        {markers.map((marker) => (
          <DamageMarker
            key={marker.id}
            detection={marker}
            isSelected={marker.id === selectedMarkerId}
            onClick={() => onMarkerClick && onMarkerClick(marker)}
          />
        ))}

        {children}
      </MapContainer>
    </div>
  );
};

export default GISMap;

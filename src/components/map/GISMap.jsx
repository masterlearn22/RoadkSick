import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Tooltip, useMap } from 'react-leaflet';
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

// Koridor Surabaya – Mojokerto – Jombang
const DEFAULT_CENTER = [-7.4664, 112.4338];
const DEFAULT_ZOOM = 11;

// Custom Icon for Ground Truth Validation Points
const groundTruthIcon = L.divIcon({
  className: 'ground-truth-marker',
  html: `
    <div style="
      width: 28px;
      height: 28px;
      background: #10B981;
      border: 2px solid #FFFFFF;
      border-radius: 9999px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 6px rgba(0,0,0,0.3);
      font-size: 14px;
      cursor: pointer;
    ">
      🎯
    </div>
  `,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -16],
});

// Helper component to center map when selected marker changes
const MapEffect = ({ selectedMarker }) => {
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
        map.flyTo([lat, lng], 15, { duration: 1 });
      }
    }
  }, [selectedMarker, map]);

  return null;
};

const GISMap = ({
  markers = [],
  tracks = [],
  rmseVectors = [],
  showMarkers = true,
  showTracks = true,
  showRmseVectors = true,
  onMarkerClick,
  selectedMarkerId,
  center = DEFAULT_CENTER,
  zoom = DEFAULT_ZOOM,
  className = '',
  children,
}) => {
  const selectedMarker = markers.find((m) => m.id === selectedMarkerId);

  // Parse track positions for Polyline
  const trackPositions = useMemo(() => {
    if (!tracks || tracks.length === 0) return [];
    return tracks
      .map((p) => {
        if (Array.isArray(p)) return p;
        if (p.latitude !== undefined && p.longitude !== undefined) {
          return [p.latitude, p.longitude];
        }
        if (p.lat !== undefined && p.lng !== undefined) {
          return [p.lat, p.lng];
        }
        return null;
      })
      .filter(Boolean);
  }, [tracks]);

  // Parse RMSE error vectors
  const parsedRmseVectors = useMemo(() => {
    if (!rmseVectors || rmseVectors.length === 0) return [];
    return rmseVectors.map((v) => {
      const sysLat = v.sysLat ?? v.system?.lat;
      const sysLng = v.sysLng ?? v.system?.lng;
      const gtLat = v.gtLat ?? v.groundTruth?.lat;
      const gtLng = v.gtLng ?? v.groundTruth?.lng;
      const dist = v.distance ?? v.error_distance_m ?? 0;
      const sampleCode = v.sampleCode ?? v.sample_code ?? v.id;

      if (sysLat == null || sysLng == null || gtLat == null || gtLng == null) return null;

      return {
        id: v.id,
        sampleCode,
        systemPos: [sysLat, sysLng],
        gtPos: [gtLat, gtLng],
        distance: dist,
        fieldNotes: v.fieldNotes || v.field_notes,
      };
    }).filter(Boolean);
  }, [rmseVectors]);

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
          selectedMarker={selectedMarker}
        />

        {/* 1. Polyline Lintasan GNSS Smartwatch Supercalla Onyx */}
        {showTracks && trackPositions.length > 1 && (
          <Polyline
            positions={trackPositions}
            pathOptions={{
              color: '#2563EB',
              weight: 4,
              opacity: 0.8,
              lineJoin: 'round',
            }}
          >
            <Tooltip sticky>
              <div className="text-xs font-semibold">
                Jalur Lintasan Survei GNSS (Supercalla Onyx)
              </div>
            </Tooltip>
          </Polyline>
        )}

        {/* 2. Vektor Error Spasial RMSE (Garis Putus-Putus & Marker Ground Truth) */}
        {showRmseVectors && parsedRmseVectors.map((v) => (
          <React.Fragment key={`rmse-${v.id}`}>
            {/* Garis koneksi antara sistem GNSS dan Ground Truth aktual */}
            <Polyline
              positions={[v.systemPos, v.gtPos]}
              pathOptions={{
                color: '#EF4444',
                weight: 2,
                dashArray: '6, 6',
                opacity: 0.9,
              }}
            >
              <Tooltip sticky>
                <div className="text-xs">
                  <span className="font-bold text-red-600">Error Spasial: {v.distance.toFixed(2)} m</span>
                  <div className="text-[10px] text-gray-500">Sampel: {v.sampleCode}</div>
                </div>
              </Tooltip>
            </Polyline>

            {/* Marker Ground Truth Target */}
            <Marker position={v.gtPos} icon={groundTruthIcon}>
              <Popup className="custom-leaflet-popup">
                <div className="p-2 text-xs">
                  <div className="font-bold text-emerald-700 flex items-center gap-1 mb-1">
                    <span>🎯 Ground Truth Lapangan</span>
                  </div>
                  <div className="text-[11px] text-gray-600 space-y-0.5 font-mono">
                    <div>Kode: <b>{v.sampleCode}</b></div>
                    <div>Lat: {v.gtPos[0].toFixed(6)}</div>
                    <div>Lng: {v.gtPos[1].toFixed(6)}</div>
                    <div className="pt-1 text-red-600 font-bold border-t mt-1">
                      Selisih Jarak: {v.distance.toFixed(2)} m
                    </div>
                    {v.fieldNotes && (
                      <div className="text-[10px] text-gray-500 italic mt-1 font-sans">
                        Catatan: {v.fieldNotes}
                      </div>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          </React.Fragment>
        ))}

        {/* 3. Marker Kerusakan Jalan YOLOv8 */}
        {showMarkers && markers.map((marker) => (
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

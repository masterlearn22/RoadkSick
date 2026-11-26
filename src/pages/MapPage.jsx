import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  Filter,
  Layers,
  LocateFixed,
  Navigation,
  X,
  ExternalLink,
  MapPin,
  Maximize2,
} from 'lucide-react';
import GISMap from '../components/map/GISMap';
import MapLegend from '../components/map/MapLegend';
import Badge from '../components/common/Badge';
import useMapStore from '../store/useMapStore';
import { getMapMarkers } from '../services';
import { OFFICIAL_DAMAGE_TYPES, getDamageTypeConfig } from '../data/damageTypes';
import { formatCoordinate, formatConfidence, formatTimestamp } from '../utils/formatters';
import {
  DEFAULT_CENTER,
  DEFAULT_ZOOM,
  ROUTE_SEGMENTS,
  SEVERITY_LEVELS,
  matchesRouteSegment,
} from '../utils/constants';

const SEVERITY_OPTIONS = [
  { value: 'all', label: 'Semua Tingkat' },
  { value: 'high', label: 'Berat / Tinggi' },
  { value: 'medium', label: 'Sedang' },
  { value: 'low', label: 'Ringan / Rendah' },
];

const MapPage = () => {
  const {
    markers,
    setMarkers,
    filters,
    toggleTypeFilter,
    setSeverityFilter,
    setDateRange,
    resetFilters,
    setSelectedMarker,
  } = useMapStore();

  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showLegend, setShowLegend] = useState(true);
  const [basemap, setBasemap] = useState('osm'); // 'osm' | 'satellite'
  const [activeMarkerData, setActiveMarkerData] = useState(null);
  const [detailModalMarker, setDetailModalMarker] = useState(null);
  const [selectedSegment, setSelectedSegment] = useState('all');
  const [userLocation, setUserLocation] = useState(null);
  const [flyTarget, setFlyTarget] = useState(null);

  const loadMarkers = useCallback(async () => {
    try {
      const res = await getMapMarkers();
      if (res?.success && res.data) {
        setMarkers(res.data);
      }
    } catch (err) {
      console.error('Failed to load map markers:', err);
    }
  }, [setMarkers]);

  useEffect(() => {
    loadMarkers();
  }, [loadMarkers]);

  const filteredMarkers = useMemo(() => {
    return markers.filter((marker) => {
      if (filters.types && filters.types.length > 0) {
        if (!filters.types.includes(marker.type)) return false;
      } else {
        return false;
      }

      if (filters.severity && filters.severity !== 'all') {
        if (marker.severity !== filters.severity) return false;
      }

      if (!matchesRouteSegment(marker.route_segment, selectedSegment)) {
        return false;
      }

      if (filters.dateRange?.start && marker.timestamp) {
        const markerTime = new Date(marker.timestamp).getTime();
        const startTime = new Date(filters.dateRange.start).getTime();
        if (markerTime < startTime) return false;
      }
      if (filters.dateRange?.end && marker.timestamp) {
        const markerTime = new Date(marker.timestamp).getTime();
        const endTime = new Date(`${filters.dateRange.end}T23:59:59`).getTime();
        if (markerTime > endTime) return false;
      }

      return true;
    });
  }, [markers, filters, selectedSegment]);

  const handleMarkerClick = (marker) => {
    setActiveMarkerData(marker);
    setSelectedMarker(marker);
    const lat = marker.coordinates?.lat ?? marker.position?.[0];
    const lng = marker.coordinates?.lng ?? marker.position?.[1];
    if (lat != null && lng != null) {
      setFlyTarget({ lat, lng, zoom: 16, ts: Date.now() });
    }
  };

  const handleRecenterCorridor = () => {
    setFlyTarget({
      lat: DEFAULT_CENTER[0],
      lng: DEFAULT_CENTER[1],
      zoom: DEFAULT_ZOOM,
      ts: Date.now(),
    });
  };

  const handleLocateMe = () => {
    if (!('geolocation' in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        setUserLocation(coords);
        setFlyTarget({ ...coords, zoom: 16, ts: Date.now() });
      },
      (err) => {
        console.warn('Gagal mendapatkan lokasi GPS:', err.message);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const isAllTypesSelected = filters.types.length === OFFICIAL_DAMAGE_TYPES.length;
  const hasAdvancedFilter =
    filters.severity !== 'all' ||
    Boolean(filters.dateRange?.start) ||
    Boolean(filters.dateRange?.end) ||
    selectedSegment !== 'all';

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden bg-slate-100">
      {/* 1. TOP FLOATING FILTER PILLS: Semua + 4 Kelas Resmi (offset kiri agar tidak menimpa Zoom Control) */}
      <div className="absolute top-2.5 sm:top-3 left-14 right-3 sm:right-5 z-30 pointer-events-none flex flex-col gap-2">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pointer-events-auto py-1 px-0.5">
          <button
            type="button"
            onClick={() => {
              resetFilters();
              setSelectedSegment('all');
            }}
            className={`px-3.5 py-2 rounded-full text-xs font-bold whitespace-nowrap shadow-md transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer backdrop-blur-md ${
              isAllTypesSelected && !hasAdvancedFilter
                ? 'bg-slate-900 text-white border border-slate-700'
                : 'bg-white/95 text-slate-700 border border-slate-200/90 hover:bg-slate-50'
            }`}
          >
            <span>Semua Kelas</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                isAllTypesSelected && !hasAdvancedFilter
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-200 text-slate-800'
              }`}
            >
              {filteredMarkers.length}
            </span>
          </button>

          {OFFICIAL_DAMAGE_TYPES.map((type) => {
            const isSelected = filters.types?.includes(type.id);
            const count = markers.filter((m) => m.type === type.id).length;

            return (
              <button
                key={type.id}
                type="button"
                onClick={() => toggleTypeFilter(type.id)}
                className={`px-3 py-2 rounded-full text-xs font-bold whitespace-nowrap shadow-md transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer backdrop-blur-md ${
                  isSelected
                    ? 'bg-white/95 text-slate-900 border-2'
                    : 'bg-white/75 text-slate-500 opacity-70 border border-slate-200 hover:opacity-100'
                }`}
                style={{
                  borderColor: isSelected ? type.color : 'transparent',
                }}
              >
                <span className="text-sm leading-none">{type.icon}</span>
                <span>{type.label}</span>
                <span
                  className="text-[10px] px-1.5 py-0.2 rounded-full font-mono text-white"
                  style={{ backgroundColor: type.color }}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. LEAFLET WEB GIS VIEWPORT */}
      <div className="w-full h-full relative z-0">
        <GISMap
          markers={filteredMarkers}
          basemap={basemap}
          userLocation={userLocation}
          flyTarget={flyTarget}
          onMarkerClick={handleMarkerClick}
          onDetailClick={(m) => setDetailModalMarker(m)}
          selectedMarkerId={activeMarkerData?.id}
          center={DEFAULT_CENTER}
          zoom={DEFAULT_ZOOM}
          className="rounded-none border-none"
        />
      </div>

      {/* 3. FLOATING ACTION BUTTONS (FABs) */}
      <div className="absolute right-3 sm:right-5 bottom-4 sm:bottom-6 z-30 flex flex-col gap-2 pointer-events-auto">
        <button
          type="button"
          onClick={handleLocateMe}
          className="w-11 h-11 rounded-2xl bg-white/95 backdrop-blur-md text-slate-700 hover:text-blue-600 border border-slate-200/90 shadow-lg flex items-center justify-center transition-all active:scale-90 cursor-pointer"
          title="Lokasi GPS Saya Saat Ini"
        >
          <Navigation className="w-5 h-5 text-blue-600" />
        </button>

        <button
          type="button"
          onClick={handleRecenterCorridor}
          className="w-11 h-11 rounded-2xl bg-white/95 backdrop-blur-md text-slate-700 hover:text-blue-600 border border-slate-200/90 shadow-lg flex items-center justify-center transition-all active:scale-90 cursor-pointer"
          title="Pusatkan ke Koridor Jombang – Surabaya"
        >
          <LocateFixed className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={() => setBasemap((prev) => (prev === 'osm' ? 'satellite' : 'osm'))}
          className={`w-11 h-11 rounded-2xl border shadow-lg flex items-center justify-center transition-all active:scale-90 cursor-pointer ${
            basemap === 'satellite'
              ? 'bg-slate-900 text-white border-slate-800'
              : 'bg-white/95 text-slate-700 border-slate-200/90 hover:text-blue-600'
          }`}
          title={basemap === 'osm' ? 'Ganti ke Citra Satelit' : 'Ganti ke Peta Jalan OSM'}
        >
          <Layers className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={() => setShowLegend(!showLegend)}
          className={`w-11 h-11 rounded-2xl border shadow-lg flex items-center justify-center transition-all active:scale-90 cursor-pointer text-xs font-extrabold ${
            showLegend
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white/95 text-slate-700 border-slate-200/90'
          }`}
          title="Tampilkan / Sembunyikan Legenda"
        >
          <MapPin className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={() => setShowFilterModal(true)}
          className={`w-11 h-11 rounded-2xl border shadow-lg flex items-center justify-center transition-all active:scale-90 cursor-pointer relative ${
            hasAdvancedFilter
              ? 'bg-amber-500 text-white border-amber-500'
              : 'bg-white/95 text-slate-700 border-slate-200/90 hover:text-blue-600'
          }`}
          title="Filter Segmen & Tanggal"
        >
          <Filter className="w-5 h-5" />
          {hasAdvancedFilter && (
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-rose-600 rounded-full border-2 border-white" />
          )}
        </button>
      </div>

      {/* 4. FLOATING MAP LEGEND */}
      {showLegend && !activeMarkerData && (
        <div className="hidden sm:block absolute left-5 bottom-6 z-30 max-w-xs">
          <MapLegend markers={filteredMarkers} />
        </div>
      )}

      {/* 5. SELECTED MARKER CARD */}
      {activeMarkerData && (
        <div className="absolute inset-x-3 sm:inset-x-auto sm:left-5 sm:bottom-6 bottom-3 z-40 sm:w-96 bg-white/95 backdrop-blur-md rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-2xl p-4">
          <div className="flex items-start justify-between gap-3 mb-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="text-xl flex-shrink-0">
                {getDamageTypeConfig(activeMarkerData.type).icon}
              </span>
              <div className="min-w-0">
                <h4 className="font-extrabold text-sm text-slate-900 leading-tight truncate">
                  {getDamageTypeConfig(activeMarkerData.type).label}
                </h4>
                <span className="text-[11px] text-slate-500 font-medium">
                  Keyakinan:{' '}
                  <span className="text-emerald-600 font-bold font-mono">
                    {formatConfidence(activeMarkerData.confidence)}
                  </span>
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveMarkerData(null)}
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-1.5 text-xs text-slate-600 mb-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-400">Segmen:</span>
              <span className="font-semibold text-slate-800 truncate">
                {activeMarkerData.route_segment || activeMarkerData.location || 'Jombang – Surabaya'}
              </span>
            </div>
            <div className="flex items-center justify-between font-mono text-[11px]">
              <span className="text-slate-400 font-sans">Koordinat GPS:</span>
              <span className="text-slate-700 font-semibold">
                {formatCoordinate(activeMarkerData.coordinates?.lat, 5)},{' '}
                {formatCoordinate(activeMarkerData.coordinates?.lng, 5)}
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Waktu Deteksi:</span>
              <span className="text-slate-700 font-medium">
                {formatTimestamp(activeMarkerData.timestamp)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setDetailModalMarker(activeMarkerData)}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-all cursor-pointer"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Detail & Foto</span>
            </button>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${activeMarkerData.coordinates?.lat},${activeMarkerData.coordinates?.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 transition-all"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Google Maps</span>
            </a>
          </div>
        </div>
      )}

      {/* 6. FILTER LANJUTAN MODAL */}
      {showFilterModal && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-xs"
          onClick={() => setShowFilterModal(false)}
        >
          <div
            className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl border border-slate-200 shadow-2xl p-5 space-y-4 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-blue-600" />
                <h3 className="font-extrabold text-slate-900 text-sm">
                  Filter Spasial Rute Jombang – Surabaya
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowFilterModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Segmen Pengujian Lapangan
              </label>
              <select
                value={selectedSegment}
                onChange={(e) => setSelectedSegment(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 font-semibold bg-slate-50"
              >
                <option value="all">Semua Segmen (Jombang – Surabaya)</option>
                {ROUTE_SEGMENTS.map((seg) => (
                  <option key={seg.value} value={seg.value}>
                    {seg.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Tingkat Keparahan
              </label>
              <div className="grid grid-cols-2 gap-2">
                {SEVERITY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setSeverityFilter(opt.value)}
                    className={`p-2.5 rounded-xl border text-xs font-semibold text-left transition-all cursor-pointer ${
                      filters.severity === opt.value
                        ? 'bg-blue-50 border-blue-600 text-blue-700'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Rentang Tanggal Survei
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[11px] text-slate-400 block mb-1">Mulai:</span>
                  <input
                    type="date"
                    value={filters.dateRange?.start || ''}
                    onChange={(e) =>
                      setDateRange(e.target.value || null, filters.dateRange?.end || null)
                    }
                    className="w-full text-xs p-2 rounded-xl border border-slate-200 font-mono"
                  />
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block mb-1">Sampai:</span>
                  <input
                    type="date"
                    value={filters.dateRange?.end || ''}
                    onChange={(e) =>
                      setDateRange(filters.dateRange?.start || null, e.target.value || null)
                    }
                    className="w-full text-xs p-2 rounded-xl border border-slate-200 font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  resetFilters();
                  setSelectedSegment('all');
                  setShowFilterModal(false);
                }}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                Reset Filter
              </button>
              <button
                type="button"
                onClick={() => setShowFilterModal(false)}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
              >
                Terapkan ({filteredMarkers.length} Titik)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. MODAL DETAIL MARKER & FOTO BUKTI */}
      {detailModalMarker && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setDetailModalMarker(null)}
        >
          <div
            className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant={detailModalMarker.type} showIcon>
                  {getDamageTypeConfig(detailModalMarker.type).label}
                </Badge>
                <Badge variant={detailModalMarker.severity}>
                  {SEVERITY_LEVELS[detailModalMarker.severity]?.label || detailModalMarker.severity}
                </Badge>
              </div>
              <button
                type="button"
                onClick={() => setDetailModalMarker(null)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              {detailModalMarker.imageUrl ? (
                <div className="aspect-video rounded-2xl overflow-hidden bg-slate-950 border border-slate-200">
                  <img
                    src={detailModalMarker.imageUrl}
                    alt="Foto Bukti Kerusakan Jalan"
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : (
                <div className="aspect-video rounded-2xl bg-slate-100 border border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 text-xs">
                  <span className="text-3xl mb-1">
                    {getDamageTypeConfig(detailModalMarker.type).icon}
                  </span>
                  <span>Belum ada foto bukti terlampir pada titik ini</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2.5 text-xs bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">
                    Segmen Rute
                  </span>
                  <span className="font-bold text-slate-800">
                    {detailModalMarker.route_segment || 'Jombang – Surabaya'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">
                    Confidence Score
                  </span>
                  <span className="font-mono font-bold text-emerald-600">
                    {formatConfidence(detailModalMarker.confidence)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">
                    Koordinat GPS
                  </span>
                  <span className="font-mono font-semibold text-slate-700">
                    {formatCoordinate(detailModalMarker.coordinates?.lat, 6)},{' '}
                    {formatCoordinate(detailModalMarker.coordinates?.lng, 6)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">
                    Timestamp
                  </span>
                  <span className="font-medium text-slate-700">
                    {formatTimestamp(detailModalMarker.timestamp)}
                  </span>
                </div>
              </div>

              <a
                href={`https://www.google.com/maps/search/?api=1&query=${detailModalMarker.coordinates?.lat},${detailModalMarker.coordinates?.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Navigasi ke Lokasi di Google Maps</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapPage;

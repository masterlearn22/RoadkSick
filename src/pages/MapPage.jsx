import React, { useEffect, useMemo, useState } from 'react';
import {
  Filter,
  Layers,
  LocateFixed,
  X,
  ExternalLink,
  ChevronUp,
  ChevronDown,
  Calendar,
  Sparkles,
  MapPin,
} from 'lucide-react';
import GISMap from '../components/map/GISMap';
import MapLegend from '../components/map/MapLegend';
import useMapStore from '../store/useMapStore';
import { getMapMarkers } from '../services';
import { DAMAGE_TYPES } from '../utils/damageTypes';
import { formatCoordinate, formatTimestamp, formatConfidence } from '../utils/formatters';

const SEVERITY_OPTIONS = [
  { value: 'all', label: 'Semua Tingkat' },
  { value: 'high', label: 'Tinggi (High)' },
  { value: 'medium', label: 'Sedang (Medium)' },
  { value: 'low', label: 'Rendah (Low)' },
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
    selectedMarker,
    setSelectedMarker,
    center,
    zoom,
  } = useMapStore();

  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showLegend, setShowLegend] = useState(false);
  const [activeMarkerData, setActiveMarkerData] = useState(null);

  // Load initial markers on mount
  useEffect(() => {
    let isMounted = true;
    const fetchMarkers = async () => {
      try {
        const res = await getMapMarkers();
        if (isMounted && res?.success && res.data) {
          setMarkers(res.data);
        }
      } catch (err) {
        console.error('Failed to load map markers:', err);
      }
    };

    fetchMarkers();
    return () => {
      isMounted = false;
    };
  }, [setMarkers]);

  // Filter markers based on selections
  const filteredMarkers = useMemo(() => {
    return markers.filter((marker) => {
      // 1. Damage Type filter
      if (filters.types && filters.types.length > 0) {
        if (!filters.types.includes(marker.type)) return false;
      }

      // 2. Severity filter
      if (filters.severity && filters.severity !== 'all') {
        if (marker.severity !== filters.severity) return false;
      }

      // 3. Date range filter
      if (filters.dateRange?.start && marker.timestamp) {
        const markerTime = new Date(marker.timestamp).getTime();
        const startTime = new Date(filters.dateRange.start).getTime();
        if (markerTime < startTime) return false;
      }
      if (filters.dateRange?.end && marker.timestamp) {
        const markerTime = new Date(marker.timestamp).getTime();
        const endTime = new Date(filters.dateRange.end).getTime();
        if (markerTime > endTime) return false;
      }

      return true;
    });
  }, [markers, filters]);

  // Handle marker selection for floating mobile card
  const handleMarkerClick = (marker) => {
    setActiveMarkerData(marker);
    setSelectedMarker(marker);
  };

  const handleRecenter = () => {
    // Bandung city center
    setSelectedMarker({
      id: 'center-reset',
      coordinates: [-6.917, 107.619],
    });
  };

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden bg-slate-100">
      {/* 1. TOP FLOATING BAR: Mobile-first Horizontal Damage Type Filter Pills */}
      <div className="absolute top-2.5 sm:top-4 inset-x-2.5 sm:inset-x-6 z-30 pointer-events-none flex flex-col gap-2">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pointer-events-auto py-1 px-1">
          {/* "Semua" Filter Pill */}
          <button
            type="button"
            onClick={resetFilters}
            className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap shadow-md transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer backdrop-blur-md ${
              filters.types.length === Object.keys(DAMAGE_TYPES).length &&
              filters.severity === 'all'
                ? 'bg-slate-900 text-white border border-slate-700'
                : 'bg-white/95 text-slate-700 border border-slate-200/90 hover:bg-slate-50'
            }`}
          >
            <span>Semua</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200/80 text-slate-800 font-mono">
              {filteredMarkers.length}
            </span>
          </button>

          {/* Individual Damage Type Pills */}
          {Object.values(DAMAGE_TYPES).map((type) => {
            const isSelected = filters.types?.includes(type.id);
            const count = markers.filter((m) => m.type === type.id).length;

            return (
              <button
                key={type.id}
                type="button"
                onClick={() => toggleTypeFilter(type.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap shadow-md transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer backdrop-blur-md ${
                  isSelected
                    ? 'bg-white text-slate-900 border-2'
                    : 'bg-white/80 text-slate-500 opacity-60 border border-slate-200 hover:opacity-100'
                }`}
                style={{
                  borderColor: isSelected ? type.color : 'transparent',
                }}
              >
                <span className="text-sm">{type.icon}</span>
                <span>{type.shortLabel}</span>
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

      {/* 2. LEAFLET MAP VIEWPORT (Full Screen) */}
      <div className="w-full h-full relative z-0">
        <GISMap
          markers={filteredMarkers}
          onMarkerClick={handleMarkerClick}
          selectedMarkerId={activeMarkerData?.id}
          className="rounded-none border-none"
        />
      </div>

      {/* 3. FLOATING ACTION BUTTONS (FABs) */}
      <div className="absolute right-3 sm:right-5 bottom-4 sm:bottom-6 z-30 flex flex-col gap-2.5 pointer-events-auto">
        {/* Recenter Bandung GPS Button */}
        <button
          type="button"
          onClick={handleRecenter}
          className="w-11 h-11 rounded-2xl bg-white text-slate-700 hover:text-blue-600 border border-slate-200/90 shadow-lg flex items-center justify-center transition-all active:scale-90 cursor-pointer"
          title="Pusatkan ke Bandung"
          aria-label="Pusatkan Peta"
        >
          <LocateFixed className="w-5 h-5 text-blue-600" />
        </button>

        {/* Legend Toggle Button */}
        <button
          type="button"
          onClick={() => setShowLegend(!showLegend)}
          className={`w-11 h-11 rounded-2xl border shadow-lg flex items-center justify-center transition-all active:scale-90 cursor-pointer ${
            showLegend
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white text-slate-700 border-slate-200/90 hover:text-blue-600'
          }`}
          title="Legenda Peta"
          aria-label="Legenda"
        >
          <Layers className="w-5 h-5" />
        </button>

        {/* Filter Modal Trigger */}
        <button
          type="button"
          onClick={() => setShowFilterModal(true)}
          className={`w-11 h-11 rounded-2xl border shadow-lg flex items-center justify-center transition-all active:scale-90 cursor-pointer relative ${
            filters.severity !== 'all' || filters.dateRange?.start
              ? 'bg-amber-500 text-white border-amber-500'
              : 'bg-white text-slate-700 border-slate-200/90 hover:text-blue-600'
          }`}
          title="Filter Lanjutan"
          aria-label="Filter"
        >
          <Filter className="w-5 h-5" />
          {(filters.severity !== 'all' || filters.dateRange?.start) && (
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white" />
          )}
        </button>
      </div>

      {/* 4. FLOATING MAP LEGEND (Toggled) */}
      {showLegend && (
        <div className="absolute left-3 sm:left-6 bottom-4 sm:bottom-6 z-30 max-w-xs animate-in fade-in slide-in-from-bottom-4 duration-200">
          <MapLegend markers={filteredMarkers} />
        </div>
      )}

      {/* 5. MOBILE BOTTOM SHEET FOR SELECTED MARKER */}
      {activeMarkerData && (
        <div className="absolute inset-x-2.5 sm:inset-x-auto sm:left-6 sm:bottom-6 bottom-3 z-40 max-w-md bg-white/95 backdrop-blur-md rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-2xl p-4 animate-in fade-in slide-in-from-bottom-5 duration-200">
          <div className="flex items-start justify-between gap-3 mb-2.5">
            <div className="flex items-center gap-2">
              <span className="text-xl">
                {DAMAGE_TYPES[activeMarkerData.type]?.icon || '⚠️'}
              </span>
              <div>
                <h4 className="font-extrabold text-sm text-slate-900 leading-tight">
                  {DAMAGE_TYPES[activeMarkerData.type]?.label || activeMarkerData.type}
                </h4>
                <span className="text-[11px] text-slate-500 font-medium">
                  ID: {activeMarkerData.id} • Keyakinan:{' '}
                  <span className="text-emerald-600 font-bold">
                    {formatConfidence(activeMarkerData.confidence)}
                  </span>
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveMarkerData(null)}
              className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-1.5 text-xs text-slate-600 mb-3 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Lokasi:</span>
              <span className="font-semibold text-slate-800 truncate max-w-[200px]">
                {activeMarkerData.location ||
                  activeMarkerData.locationName ||
                  'Kota Bandung'}
              </span>
            </div>
            <div className="flex items-center justify-between font-mono text-[11px]">
              <span className="text-slate-400">Koordinat:</span>
              <span className="text-slate-700 font-semibold">
                {formatCoordinate(
                  activeMarkerData.coordinates?.system?.lat ||
                    activeMarkerData.coordinates?.[0] ||
                    activeMarkerData.coordinates?.lat ||
                    -6.917,
                  5
                )}
                ,{' '}
                {formatCoordinate(
                  activeMarkerData.coordinates?.system?.lng ||
                    activeMarkerData.coordinates?.[1] ||
                    activeMarkerData.coordinates?.lng ||
                    107.619,
                  5
                )}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${
                activeMarkerData.coordinates?.system?.lat ||
                activeMarkerData.coordinates?.[0] ||
                activeMarkerData.coordinates?.lat ||
                -6.917
              },${
                activeMarkerData.coordinates?.system?.lng ||
                activeMarkerData.coordinates?.[1] ||
                activeMarkerData.coordinates?.lng ||
                107.619
              }`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 transition-all"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Buka Google Maps</span>
            </a>
          </div>
        </div>
      )}

      {/* 6. ADVANCED FILTER MODAL / BOTTOM SHEET */}
      {showFilterModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl border border-slate-200 shadow-2xl p-5 space-y-4 max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom-8 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-blue-600" />
                <h3 className="font-extrabold text-slate-900 text-sm">
                  Filter Lanjutan Spasial
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowFilterModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Severity Radio Options */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Tingkat Kerusakan (Severity)
              </label>
              <div className="grid grid-cols-2 gap-2">
                {SEVERITY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setSeverityFilter(opt.value)}
                    className={`p-2.5 rounded-xl border text-xs font-semibold text-left transition-all ${
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

            {/* Date Range Inputs */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Rentang Waktu Survei
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

            {/* Action buttons in modal */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  resetFilters();
                  setShowFilterModal(false);
                }}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800"
              >
                Reset Semua
              </button>
              <button
                type="button"
                onClick={() => setShowFilterModal(false)}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20"
              >
                Terapkan Filter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapPage;

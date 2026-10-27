import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  Filter,
  Layers,
  LocateFixed,
  X,
  ExternalLink,
  Target,
} from 'lucide-react';
import GISMap from '../components/map/GISMap';
import MapLegend from '../components/map/MapLegend';
import RMSEModal from '../components/map/RMSEModal';
import useMapStore from '../store/useMapStore';
import { getMapMarkers, getSurveyTracks, getRMSEData } from '../services';
import { DAMAGE_TYPES } from '../utils/damageTypes';
import { formatCoordinate, formatConfidence } from '../utils/formatters';
import { ROUTE_SEGMENTS } from '../utils/constants';

const SEVERITY_OPTIONS = [
  { value: 'all', label: 'Semua Tingkat' },
  { value: 'high', label: 'Tinggi (High)' },
  { value: 'medium', label: 'Sedang (Medium)' },
  { value: 'low', label: 'Rendah (Low)' },
];

// Koridor Studi Kasus
const CORRIDOR_CENTER = [-7.4664, 112.4338];
const CORRIDOR_ZOOM = 11;

const MapPage = () => {
  const {
    markers,
    setMarkers,
    surveyTracks,
    setSurveyTracks,
    rmseVectors,
    setRmseVectors,
    filters,
    toggleTypeFilter,
    setSeverityFilter,
    setDateRange,
    resetFilters,
    setSelectedMarker,
  } = useMapStore();

  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showLegend, setShowLegend] = useState(false);
  const [showLayerMenu, setShowLayerMenu] = useState(false);
  const [showRmseModal, setShowRmseModal] = useState(false);
  const [activeMarkerData, setActiveMarkerData] = useState(null);
  const [selectedSegment, setSelectedSegment] = useState('all');

  // Layer Visibility States
  const [showMarkersLayer, setShowMarkersLayer] = useState(true);
  const [showTracksLayer, setShowTracksLayer] = useState(true);
  const [showRmseLayer, setShowRmseLayer] = useState(true);

  // RMSE summary state
  const [rmseSummary, setRmseSummary] = useState(null);

  // Load initial markers, tracks, and RMSE data
  const loadData = useCallback(async () => {
    try {
      const [markersRes, tracksRes, rmseRes] = await Promise.all([
        getMapMarkers(),
        getSurveyTracks(),
        getRMSEData(),
      ]);

      if (markersRes?.success && markersRes.data) {
        setMarkers(markersRes.data);
      }
      if (tracksRes?.success && tracksRes.data) {
        setSurveyTracks(tracksRes.data);
      }
      if (rmseRes?.success && rmseRes.data) {
        if (Array.isArray(rmseRes.data)) {
          setRmseVectors(rmseRes.data);
        } else if (Array.isArray(rmseRes.data.samples)) {
          setRmseVectors(rmseRes.data.samples);
          setRmseSummary(rmseRes.data.summary);
        }
      }
    } catch (err) {
      console.error('Failed to load map data:', err);
    }
  }, [setMarkers, setSurveyTracks, setRmseVectors]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filter markers based on selections and corridor segments
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

      // 3. Segment filter
      if (selectedSegment !== 'all') {
        if (marker.route_segment && !marker.route_segment.includes(selectedSegment)) {
          return false;
        }
      }

      // 4. Date range filter
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
  }, [markers, filters, selectedSegment]);

  // Handle marker selection for floating mobile card
  const handleMarkerClick = (marker) => {
    setActiveMarkerData(marker);
    setSelectedMarker(marker);
  };

  const handleRecenter = () => {
    setSelectedMarker({
      id: 'center-reset',
      coordinates: [...CORRIDOR_CENTER],
    });
  };

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden bg-slate-100">
      {/* 1. TOP FLOATING BAR: Damage Type & Segment Pills */}
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

          {/* Individual Damage Type Pills (4 Kelas YOLOv8) */}
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
          tracks={surveyTracks}
          rmseVectors={rmseVectors}
          showMarkers={showMarkersLayer}
          showTracks={showTracksLayer}
          showRmseVectors={showRmseLayer}
          onMarkerClick={handleMarkerClick}
          selectedMarkerId={activeMarkerData?.id}
          center={CORRIDOR_CENTER}
          zoom={CORRIDOR_ZOOM}
          className="rounded-none border-none"
        />
      </div>

      {/* 3. FLOATING ACTION BUTTONS (FABs) */}
      <div className="absolute right-3 sm:right-5 bottom-4 sm:bottom-6 z-30 flex flex-col gap-2.5 pointer-events-auto">
        {/* Recenter Surabaya-Mojokerto-Jombang Corridor */}
        <button
          type="button"
          onClick={handleRecenter}
          className="w-11 h-11 rounded-2xl bg-white text-slate-700 hover:text-blue-600 border border-slate-200/90 shadow-lg flex items-center justify-center transition-all active:scale-90 cursor-pointer"
          title="Pusatkan ke Koridor Surabaya–Mojokerto–Jombang"
          aria-label="Pusatkan Peta"
        >
          <LocateFixed className="w-5 h-5 text-blue-600" />
        </button>

        {/* Layer Toggle Menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowLayerMenu(!showLayerMenu)}
            className={`w-11 h-11 rounded-2xl border shadow-lg flex items-center justify-center transition-all active:scale-90 cursor-pointer ${
              showLayerMenu
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-slate-700 border-slate-200/90 hover:text-blue-600'
            }`}
            title="Pengaturan Layer Spasial"
            aria-label="Layer Spasial"
          >
            <Layers className="w-5 h-5" />
          </button>

          {/* Layer Options Popover */}
          {showLayerMenu && (
            <div className="absolute right-14 bottom-0 w-64 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200 shadow-2xl p-3 text-xs space-y-2 animate-in fade-in slide-in-from-right-3 duration-150">
              <div className="font-extrabold text-slate-900 pb-1.5 border-b border-slate-100 flex items-center justify-between">
                <span>Layer Spasial Web GIS</span>
                <span className="text-[10px] text-blue-600 font-mono">3 Layer Aktif</span>
              </div>

              {/* Layer 1: Marker Kerusakan */}
              <label className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors">
                <span className="flex items-center gap-2 text-slate-700 font-semibold">
                  <span>📍</span>
                  <span>Marker Kerusakan (4 Kelas)</span>
                </span>
                <input
                  type="checkbox"
                  checked={showMarkersLayer}
                  onChange={(e) => setShowMarkersLayer(e.target.checked)}
                  className="rounded-md text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                />
              </label>

              {/* Layer 2: Polyline Trajectory Smartwatch */}
              <label className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors">
                <span className="flex items-center gap-2 text-slate-700 font-semibold">
                  <span className="text-blue-600 font-black">〰️</span>
                  <span>Lintasan GNSS Smartwatch</span>
                </span>
                <input
                  type="checkbox"
                  checked={showTracksLayer}
                  onChange={(e) => setShowTracksLayer(e.target.checked)}
                  className="rounded-md text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                />
              </label>

              {/* Layer 3: Error Vector RMSE */}
              <label className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors">
                <span className="flex items-center gap-2 text-slate-700 font-semibold">
                  <span>🎯</span>
                  <span>Vektor Error Spasial RMSE</span>
                </span>
                <input
                  type="checkbox"
                  checked={showRmseLayer}
                  onChange={(e) => setShowRmseLayer(e.target.checked)}
                  className="rounded-md text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                />
              </label>
            </div>
          )}
        </div>

        {/* RMSE Modal Trigger Button */}
        <button
          type="button"
          onClick={() => setShowRmseModal(true)}
          className="w-11 h-11 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-500 shadow-lg flex items-center justify-center transition-all active:scale-90 cursor-pointer"
          title="Validasi Ground Truth & Evaluasi Spasial RMSE"
          aria-label="RMSE Evaluasi"
        >
          <Target className="w-5 h-5" />
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
          <span className="text-sm">🗺️</span>
        </button>

        {/* Filter Modal Trigger */}
        <button
          type="button"
          onClick={() => setShowFilterModal(true)}
          className={`w-11 h-11 rounded-2xl border shadow-lg flex items-center justify-center transition-all active:scale-90 cursor-pointer relative ${
            filters.severity !== 'all' || filters.dateRange?.start || selectedSegment !== 'all'
              ? 'bg-amber-500 text-white border-amber-500'
              : 'bg-white text-slate-700 border-slate-200/90 hover:text-blue-600'
          }`}
          title="Filter Lanjutan"
          aria-label="Filter"
        >
          <Filter className="w-5 h-5" />
          {(filters.severity !== 'all' || filters.dateRange?.start || selectedSegment !== 'all') && (
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
                  activeMarkerData.roadName ||
                  'Koridor Surabaya - Mojokerto - Jombang'}
              </span>
            </div>
            <div className="flex items-center justify-between font-mono text-[11px]">
              <span className="text-slate-400">Koordinat GNSS:</span>
              <span className="text-slate-700 font-semibold">
                {formatCoordinate(
                  activeMarkerData.coordinates?.system?.lat ||
                    activeMarkerData.coordinates?.[0] ||
                    activeMarkerData.coordinates?.lat ||
                    CORRIDOR_CENTER[0],
                  5
                )}
                ,{' '}
                {formatCoordinate(
                  activeMarkerData.coordinates?.system?.lng ||
                    activeMarkerData.coordinates?.[1] ||
                    activeMarkerData.coordinates?.lng ||
                    CORRIDOR_CENTER[1],
                  5
                )}
              </span>
            </div>
            {activeMarkerData.route_segment && (
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Segmen:</span>
                <span className="text-blue-700 font-medium">{activeMarkerData.route_segment}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${
                activeMarkerData.coordinates?.system?.lat ||
                activeMarkerData.coordinates?.[0] ||
                activeMarkerData.coordinates?.lat ||
                CORRIDOR_CENTER[0]
              },${
                activeMarkerData.coordinates?.system?.lng ||
                activeMarkerData.coordinates?.[1] ||
                activeMarkerData.coordinates?.lng ||
                CORRIDOR_CENTER[1]
              }`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 transition-all"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Buka Google Maps</span>
            </a>
            <button
              type="button"
              onClick={() => setShowRmseModal(true)}
              className="px-3 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 font-bold text-xs rounded-xl transition-all flex items-center gap-1 cursor-pointer"
            >
              <Target className="w-3.5 h-3.5" />
              <span>Uji RMSE</span>
            </button>
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
                  Filter Lanjutan Spasial Koridor
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

            {/* Segmen Koridor Studi Kasus */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Segmen Koridor Jalan
              </label>
              <select
                value={selectedSegment}
                onChange={(e) => setSelectedSegment(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 font-medium"
              >
                <option value="all">Semua Segmen (Surabaya – Mojokerto – Jombang)</option>
                {ROUTE_SEGMENTS.map((seg) => (
                  <option key={seg.value} value={seg.value}>
                    {seg.label}
                  </option>
                ))}
              </select>
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
                  setSelectedSegment('all');
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

      {/* 7. INTERACTIVE RMSE EVALUATION MODAL */}
      <RMSEModal
        isOpen={showRmseModal}
        onClose={() => setShowRmseModal(false)}
        rmseSamples={rmseVectors}
        summary={rmseSummary}
        detections={markers}
        onDataUpdated={loadData}
      />
    </div>
  );
};

export default MapPage;

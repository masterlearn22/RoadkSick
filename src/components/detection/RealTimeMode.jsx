import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Save,
  Radio,
  Compass,
  Navigation,
  Activity,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
} from 'lucide-react';
import BoundingBoxCanvas from './BoundingBoxCanvas';
import DetectionLog from './DetectionLog';
import { DAMAGE_TYPES } from '../../data/damageTypes';

const DAMAGE_KEYS = Object.keys(DAMAGE_TYPES);

const RealTimeMode = () => {
  const [isActive, setIsActive] = useState(false);
  const [detections, setDetections] = useState([]);
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({
    pothole: 0,
    longitudinal_crack: 0,
    alligator_crack: 0,
    rutting: 0,
    patches: 0,
  });
  const [fps, setFps] = useState(29.1);
  const [isSaved, setIsSaved] = useState(false);
  const [currentCoords, setCurrentCoords] = useState({
    lat: -7.4664,
    lng: 112.4338,
  });
  const [showLogMobile, setShowLogMobile] = useState(false);

  const containerRef = useRef(null);

  // Interval for real-time simulation
  useEffect(() => {
    let interval = null;

    if (isActive) {
      interval = setInterval(() => {
        // 1. Pick random damage type & confidence 0.78 - 0.98
        const randomType =
          DAMAGE_KEYS[Math.floor(Math.random() * DAMAGE_KEYS.length)];
        const confidence = parseFloat(
          (0.78 + Math.random() * (0.98 - 0.78)).toFixed(2)
        );

        // 2. Simulated GPS movement around corridor coordinates (-7.4664 ± 0.0006)
        const deltaLat = (Math.random() - 0.48) * 0.0006;
        const deltaLng = (Math.random() - 0.48) * 0.0006;
        const newLat = parseFloat((currentCoords.lat + deltaLat).toFixed(6));
        const newLng = parseFloat((currentCoords.lng + deltaLng).toFixed(6));
        setCurrentCoords({ lat: newLat, lng: newLng });

        // 3. Random bbox inside container
        const width = Math.floor(100 + Math.random() * 140);
        const height = Math.floor(70 + Math.random() * 100);
        const x = Math.floor(40 + Math.random() * 260);
        const y = Math.floor(60 + Math.random() * 160);

        const newId = `RT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        const newDetection = {
          id: newId,
          type: randomType,
          confidence,
          bbox: { x, y, width, height },
        };

        const newLog = {
          id: newId,
          type: randomType,
          confidence,
          coordinates: { lat: newLat, lng: newLng },
          timestamp: new Date().toISOString(),
        };

        // Keep latest 2 on screen so mobile viewfinder isn't cluttered
        setDetections((prev) => [...prev.slice(-1), newDetection]);

        // Keep 50 logs max
        setLogs((prev) => {
          const nextLogs = [...prev, newLog];
          if (nextLogs.length > 50) return nextLogs.slice(nextLogs.length - 50);
          return nextLogs;
        });

        // Update stats
        setStats((prev) => ({
          ...prev,
          [randomType]: (prev[randomType] || 0) + 1,
        }));

        // Dynamic FPS fluctuation
        setFps(parseFloat((28.0 + Math.random() * 2.5).toFixed(1)));
      }, 3000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, currentCoords]);

  const handleStart = () => {
    setIsActive(true);
    setIsSaved(false);
  };

  const handlePause = () => {
    setIsActive(false);
  };

  const handleReset = () => {
    setDetections([]);
    setLogs([]);
    setStats({
      pothole: 0,
      longitudinal_crack: 0,
      alligator_crack: 0,
      rutting: 0,
      patches: 0,
    });
  };

  const handleSaveToInventory = () => {
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
    }, 3000);
  };

  const totalDetections = Object.values(stats).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* 1. Mobile Quick Stats Chips (Horizontal Scrollable) */}
      <div className="bg-white/95 backdrop-blur-md p-2.5 sm:p-3 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div className="flex items-center justify-between mb-2 px-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
            <Activity className="w-3.5 h-3.5 text-blue-600" />
            <span>Akumulasi Temuan Kerusakan</span>
          </div>
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
            {totalDetections} Terdeteksi
          </span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {Object.entries(DAMAGE_TYPES).map(([key, item]) => {
            const count = stats[key] || 0;
            return (
              <div
                key={key}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border flex-shrink-0 text-xs font-semibold select-none transition-transform active:scale-95"
                style={{
                  backgroundColor: `${item.color}10`,
                  borderColor: `${item.color}35`,
                  color: item.color,
                }}
              >
                <span className="text-sm">{item.icon}</span>
                <span className="text-slate-700">{item.label}</span>
                <span
                  className="px-1.5 py-0.2 rounded-md font-mono text-[11px] font-bold text-white shadow-2xs"
                  style={{ backgroundColor: item.color }}
                >
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Main Viewport & Logs Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5 sm:gap-5">
        {/* Viewport Col (Camera HUD) */}
        <div className="lg:col-span-2 space-y-3 sm:space-y-4">
          <div
            ref={containerRef}
            className="relative w-full aspect-[4/3] sm:aspect-video bg-slate-950 rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl border border-slate-800 flex items-center justify-center select-none"
          >
            {/* Camera Viewfinder Reticle Corners */}
            <div className="absolute inset-3 sm:inset-4 pointer-events-none z-20">
              <div className="w-6 h-6 border-t-2 border-l-2 border-white/60 rounded-tl-lg absolute top-0 left-0" />
              <div className="w-6 h-6 border-t-2 border-r-2 border-white/60 rounded-tr-lg absolute top-0 right-0" />
              <div className="w-6 h-6 border-b-2 border-l-2 border-white/60 rounded-bl-lg absolute bottom-0 left-0" />
              <div className="w-6 h-6 border-b-2 border-r-2 border-white/60 rounded-br-lg absolute bottom-0 right-0" />

              {/* Center Crosshair */}
              <div className="absolute inset-0 flex items-center justify-center opacity-30">
                <div className="w-8 h-0.5 bg-white" />
                <div className="w-0.5 h-8 bg-white absolute" />
              </div>
            </div>

            {/* Gradient & Visual Background Simulation */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-slate-950/40 pointer-events-none" />

            {/* Road texture simulation effect */}
            <div className="absolute inset-0 opacity-25 pointer-events-none flex flex-col justify-end">
              <div className="h-2/3 border-t border-dashed border-slate-600 flex justify-center">
                <div className="w-2 h-full border-r border-dashed border-amber-400/60" />
              </div>
            </div>

            {/* Central feed label */}
            <div className="text-center z-0 px-4">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-center mx-auto mb-2.5 shadow-lg backdrop-blur-md">
                <Radio className={`w-7 h-7 ${isActive ? 'text-emerald-400 animate-pulse' : 'text-slate-400'}`} />
              </div>
              <h4 className="text-sm sm:text-base font-bold text-white tracking-tight">
                Kamera Inspeksi Dashcam (Surabaya – Mojokerto)
              </h4>
              <p className="text-[11px] sm:text-xs text-slate-300/80 mt-0.5 max-w-xs mx-auto">
                {isActive
                  ? '⚡ YOLOv8 sedang memindai permukaan jalan...'
                  : 'Tekan "Mulai Deteksi" untuk simulasi aliran frame'}
              </p>
            </div>

            {/* Bounding box canvas overlay */}
            <BoundingBoxCanvas detections={isActive ? detections : []} />

            {/* TOP HUD: Live Telemetry Bar */}
            <div className="absolute top-3 left-3 right-3 z-30 flex items-center justify-between pointer-events-none">
              {/* GPS Lat/Lng pill */}
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900/80 backdrop-blur-md border border-slate-700 text-[10px] sm:text-xs font-mono text-white shadow-xs">
                <Navigation className="w-3 h-3 text-sky-400 animate-pulse" />
                <span className="font-semibold text-slate-300">GPS:</span>
                <span>
                  {currentCoords.lat.toFixed(5)}, {currentCoords.lng.toFixed(5)}
                </span>
              </div>

              {/* FPS Counter */}
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900/80 backdrop-blur-md border border-slate-700 text-[10px] sm:text-xs font-mono text-emerald-400 font-bold shadow-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                <span>FPS: {isActive ? fps : '0.0'}</span>
              </div>
            </div>

            {/* BOTTOM HUD: REC Indicator & Model Info */}
            <div className="absolute bottom-3 left-3 right-3 z-30 flex items-center justify-between pointer-events-none">
              <div
                className={`px-2.5 py-1 rounded-xl backdrop-blur-md border text-[10px] sm:text-[11px] font-bold flex items-center gap-1.5 shadow-xs ${
                  isActive
                    ? 'bg-rose-950/80 border-rose-600 text-rose-300'
                    : 'bg-slate-900/80 border-slate-700 text-slate-400'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    isActive ? 'bg-rose-500 animate-pulse' : 'bg-slate-500'
                  }`}
                />
                <span>{isActive ? 'LIVE SCANNING' : 'STANDBY'}</span>
              </div>

              <div className="text-[10px] font-mono text-slate-400 bg-black/60 backdrop-blur-xs px-2 py-0.5 rounded-lg border border-slate-800">
                YOLOv8x • 720p
              </div>
            </div>
          </div>

          {/* Touch-Friendly Action Bar */}
          <div className="bg-white/95 backdrop-blur-md p-3 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-2 flex-1 sm:flex-initial">
              {!isActive ? (
                <button
                  type="button"
                  onClick={handleStart}
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-3 sm:py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-95 text-white rounded-xl text-sm font-bold shadow-md shadow-emerald-500/20 transition-all cursor-pointer select-none"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>Mulai Deteksi</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handlePause}
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-3 sm:py-2.5 bg-slate-700 hover:bg-slate-800 active:scale-95 text-white rounded-xl text-sm font-bold shadow-md transition-all cursor-pointer select-none"
                >
                  <Pause className="w-4 h-4 fill-white" />
                  <span>Jeda (Pause)</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleReset}
                className="p-3 sm:py-2.5 sm:px-3 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-xl text-sm font-medium transition-colors active:scale-95 cursor-pointer"
                title="Reset Sesi"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              {isSaved && (
                <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1 animate-fade">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Tersimpan!
                </span>
              )}
              <button
                type="button"
                onClick={handleSaveToInventory}
                disabled={logs.length === 0}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-3 sm:py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer select-none"
              >
                <Save className="w-4 h-4" />
                <span>Simpan ke Inventori ({logs.length})</span>
              </button>
            </div>
          </div>

          {/* Mobile Log Accordion Trigger (< lg) */}
          <div className="lg:hidden">
            <button
              type="button"
              onClick={() => setShowLogMobile(!showLogMobile)}
              className="w-full flex items-center justify-between p-3.5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs text-xs font-bold text-slate-800 cursor-pointer active:scale-98"
            >
              <span className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-blue-600" />
                Lihat Log Aliran Deteksi ({logs.length})
              </span>
              {showLogMobile ? (
                <ChevronUp className="w-4 h-4 text-slate-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-500" />
              )}
            </button>

            {showLogMobile && (
              <div className="mt-2">
                <DetectionLog logs={logs} maxHeight="360px" />
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Streaming Log (Desktop only or always visible on >= lg) */}
        <div className="hidden lg:block lg:col-span-1">
          <DetectionLog logs={logs} maxHeight="540px" />
        </div>
      </div>
    </div>
  );
};

export default RealTimeMode;

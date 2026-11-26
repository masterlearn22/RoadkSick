import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Camera,
  Play,
  Square,
  MapPin,
  Navigation,
  Compass,
  Map,
  Eye,
  SwitchCamera,
  Volume2,
  VolumeX,
  ShieldCheck,
  ShieldAlert,
  Sliders,
  ChevronDown,
  Radio,
  Clock,
  Zap,
  Maximize2,
  X,
  CheckCircle2,
  Server,
  RefreshCw,
  AlertTriangle,
  Activity,
} from 'lucide-react';
import PageContainer from '../components/layout/PageContainer';
import BoundingBoxCanvas from '../components/detection/BoundingBoxCanvas';
import DetectionLog from '../components/detection/DetectionLog';
import DetectionSummary from '../components/detection/DetectionSummary';
import Badge from '../components/common/Badge';
import { createWatermarkedImageBlob } from '../utils/watermark';
import {
  uploadDamageImage,
  saveDetection,
  processRealtimeFrame,
  startRealtimeDetection,
  createSurveySession,
  getBackendModelInfo,
  getYoloApiUrl,
  setYoloApiUrl,
} from '../services';
import { OFFICIAL_DAMAGE_TYPES, getDamageTypeConfig } from '../data/damageTypes';
import { ROUTE_SEGMENTS } from '../utils/constants';

const DEFAULT_CORRIDOR_GPS = {
  lat: -7.5458,
  lng: 112.2389,
  accuracy: null,
  speed: '0.0',
};

const DetectionPage = () => {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const captureCanvasRef = useRef(null);
  const isLoopActiveRef = useRef(false);
  const lastSavedPerTypeRef = useRef({});
  const gpsCoordsRef = useRef(DEFAULT_CORRIDOR_GPS);
  const inferParamsRef = useRef({
    confThreshold: 0.25,
    imgSize: 640,
    streamDelayMs: 150,
    saveCooldownSec: 3,
  });

  // Status Kamera & Streaming
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [cameraFacing, setCameraFacing] = useState('environment');
  const [cameraError, setCameraError] = useState('');

  // Status Web Geolocation API
  const [gpsCoords, setGpsCoords] = useState(DEFAULT_CORRIDOR_GPS);
  const [isGpsActive, setIsGpsActive] = useState(false);
  const [gpsError, setGpsError] = useState('');

  // Status Backend YOLO
  const [backendConnected, setBackendConnected] = useState(false);
  const [backendUrlInput, setBackendUrlInput] = useState(() => getYoloApiUrl());
  const [activeModelName, setActiveModelName] = useState('YOLO Nano Best');
  const [backendWarning, setBackendWarning] = useState('');
  const [storageWarning, setStorageWarning] = useState('');

  // Parameter Survei & Inferensi Real-Time
  const [selectedSegment, setSelectedSegment] = useState(ROUTE_SEGMENTS[0].value);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [confThreshold, setConfThreshold] = useState(0.25);
  const [imgSize, setImgSize] = useState(640);
  const [streamDelayMs, setStreamDelayMs] = useState(150); // 0 = secepat mungkin, 150-1000ms jeda antar frame
  const [saveCooldownSec, setSaveCooldownSec] = useState(3);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Telemetry & Hasil Real-Time
  const [currentDetections, setCurrentDetections] = useState([]);
  const [frameDimensions, setFrameDimensions] = useState({ width: 640, height: 360 });
  const [telemetry, setTelemetry] = useState({ fps: 0, latencyMs: 0, framesProcessed: 0 });
  const [sessionLogs, setSessionLogs] = useState([]);
  const [lastSavedItem, setLastSavedItem] = useState(null);
  const [previewWatermarkUrl, setPreviewWatermarkUrl] = useState(null);
  const [isFlashing, setIsFlashing] = useState(false);

  // UI Modals & Mobile Tabs
  const [activeTab, setActiveTab] = useState('preview'); // 'preview' | 'history' | 'summary'
  const [showSegmentModal, setShowSegmentModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showPermissionGuide, setShowPermissionGuide] = useState(false);
  const [fullPhotoModalUrl, setFullPhotoModalUrl] = useState(null);

  useEffect(() => {
    gpsCoordsRef.current = gpsCoords;
  }, [gpsCoords]);

  useEffect(() => {
    inferParamsRef.current = {
      confThreshold,
      imgSize,
      streamDelayMs,
      saveCooldownSec,
    };
  }, [confThreshold, imgSize, streamDelayMs, saveCooldownSec]);

  // 1. Cek Koneksi Backend YOLO saat mount
  const checkBackendConnection = useCallback(async () => {
    const info = await getBackendModelInfo();
    if (info.connected) {
      setBackendConnected(true);
      setBackendWarning('');
      const modelLabel =
        info.model_info?.weights_filename ||
        info.model_info?.model_name ||
        'YOLO Nano Best';
      setActiveModelName(modelLabel);
    } else {
      setBackendConnected(false);
    }
    return info.connected;
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      const info = await getBackendModelInfo();
      if (!active) return;
      if (info.connected) {
        setBackendConnected(true);
        setActiveModelName(
          info.model_info?.weights_filename ||
            info.model_info?.model_name ||
            'YOLO Nano Best'
        );
      } else {
        setBackendConnected(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // 2. Inisialisasi Stream Kamera (WebRTC getUserMedia)
  const initCamera = useCallback(async (facing) => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError('Browser tidak mendukung akses kamera (gunakan HTTPS atau localhost).');
        setIsCameraReady(false);
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facing,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(() => {});
          setCameraError('');
          setIsCameraReady(true);
        };
      }
    } catch (err) {
      console.warn('Gagal membuka kamera:', err);
      setCameraError(
        'Izin kamera belum aktif atau diblokir browser. Pastikan halaman diakses melalui HTTPS.'
      );
      setIsCameraReady(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    const startAsync = async () => {
      if (!active) return;
      await initCamera(cameraFacing);
    };
    startAsync();

    return () => {
      active = false;
      isLoopActiveRef.current = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [cameraFacing, initCamera]);

  // 3. Pelacakan GPS Browser via Web Geolocation API
  useEffect(() => {
    if (!('geolocation' in navigator)) {
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setIsGpsActive(true);
        setGpsError('');
        setGpsCoords({
          lat: Number(pos.coords.latitude.toFixed(6)),
          lng: Number(pos.coords.longitude.toFixed(6)),
          accuracy: Number((pos.coords.accuracy || 5.0).toFixed(1)),
          speed: pos.coords.speed ? (pos.coords.speed * 3.6).toFixed(1) : '0.0',
        });
      },
      (err) => {
        setIsGpsActive(false);
        setGpsError(err.message || 'Lokasi GPS belum diizinkan');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 1000,
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  const handleRequestPermissions = async () => {
    await initCamera(cameraFacing);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setIsGpsActive(true);
          setGpsError('');
          setGpsCoords({
            lat: Number(pos.coords.latitude.toFixed(6)),
            lng: Number(pos.coords.longitude.toFixed(6)),
            accuracy: Number((pos.coords.accuracy || 5.0).toFixed(1)),
            speed: pos.coords.speed ? (pos.coords.speed * 3.6).toFixed(1) : '0.0',
          });
        },
        (err) => {
          setIsGpsActive(false);
          setGpsError(err.message || 'Izin GPS ditolak');
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }
  };

  // Alert Beep & Getar saat Kerusakan Terdeteksi
  const playDetectionAlert = useCallback(() => {
    if (!soundEnabled) return;
    try {
      if (navigator.vibrate) navigator.vibrate(120);
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const audioCtx = new AudioCtx();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.frequency.value = 880;
      gain.gain.value = 0.12;
      osc.start();
      setTimeout(() => {
        osc.stop();
        audioCtx.close().catch(() => {});
      }, 130);
    } catch {
      // Abaikan jika browser memblokir audio otomatis
    }
  }, [soundEnabled]);

  // 4. Watermark + Upload + Simpan ke Supabase
  const captureAndSaveDamage = useCallback(
    async (primaryDetection, allFrameDetections, srcWidth, srcHeight) => {
      if (!videoRef.current) return;

      try {
        setIsFlashing(true);
        setTimeout(() => setIsFlashing(false), 160);

        const coords = gpsCoordsRef.current;
        const nowIso = new Date().toISOString();

        const watermarkedBlob = await createWatermarkedImageBlob(videoRef.current, {
          damageType: primaryDetection.type,
          confidence: primaryDetection.confidence,
          lat: coords.lat,
          lng: coords.lng,
          gpsAccuracy: coords.accuracy,
          timestamp: nowIso,
          routeSegment: selectedSegment,
          detections: allFrameDetections,
          sourceWidth: srcWidth,
          sourceHeight: srcHeight,
          modelName: activeModelName,
        });

        const fileName = `roadsick_${primaryDetection.type}_${Date.now()}.jpg`;
        const fileObj = new File([watermarkedBlob], fileName, { type: 'image/jpeg' });
        const localPreviewUrl = URL.createObjectURL(watermarkedBlob);
        setPreviewWatermarkUrl(localPreviewUrl);

        let imageUrl = null;
        try {
          imageUrl = await uploadDamageImage(fileObj);
        } catch (uploadErr) {
          console.warn('Upload ke Supabase Storage gagal:', uploadErr);
          imageUrl = null;
        }

        const payload = {
          sessionId: activeSessionId,
          type: primaryDetection.type,
          confidence: primaryDetection.confidence,
          severity: primaryDetection.severity || 'sedang',
          bbox: primaryDetection.bbox,
          imageUrl: imageUrl || null,
          capturedAt: nowIso,
          latitude: coords.lat,
          longitude: coords.lng,
          roadName:
            selectedSegment === 'Luar Koridor / Rute Bebas'
              ? 'Rute Eksplorasi Lapangan'
              : `Koridor ${selectedSegment}`,
          routeSegment: selectedSegment,
        };

        let savedId = `local-${Date.now()}`;
        let savedToCloud = false;
        try {
          const res = await saveDetection(payload);
          savedId = res?.data?.id || savedId;
          savedToCloud = true;
          setStorageWarning('');
        } catch (dbErr) {
          setStorageWarning(dbErr.message);
        }

        playDetectionAlert();

        const logEntry = {
          id: savedId,
          type: primaryDetection.type,
          confidence: primaryDetection.confidence,
          severity: primaryDetection.severity,
          coordinates: { lat: coords.lat, lng: coords.lng },
          timestamp: nowIso,
          imageUrl: imageUrl || localPreviewUrl,
          savedToCloud,
        };

        setLastSavedItem(logEntry);
        setSessionLogs((prev) => [logEntry, ...prev].slice(0, 60));
      } catch (err) {
        console.error('Gagal menyimpan hasil deteksi:', err);
      }
    },
    [activeSessionId, activeModelName, selectedSegment, playDetectionAlert]
  );

  // 5. Loop Real-Time Inference Berkelanjutan (while loop asinkron tanpa recursion warning)
  const runInferenceLoop = useCallback(async () => {
    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    while (isLoopActiveRef.current) {
      const videoEl = videoRef.current;

      if (!videoEl || videoEl.readyState < 2) {
        await sleep(200);
        continue;
      }

      const vidW = videoEl.videoWidth || 640;
      const vidH = videoEl.videoHeight || 360;
      const targetW = 640;
      const targetH = Math.round((vidH / vidW) * targetW) || 360;

      if (!captureCanvasRef.current) {
        captureCanvasRef.current = document.createElement('canvas');
      }
      const canvas = captureCanvasRef.current;
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoEl, 0, 0, targetW, targetH);

      const frameBase64 = canvas.toDataURL('image/jpeg', 0.82);
      const {
        confThreshold: curConf,
        imgSize: curImgSize,
        streamDelayMs: curDelay,
        saveCooldownSec: curCooldown,
      } = inferParamsRef.current;

      const res = await processRealtimeFrame(frameBase64, curConf, curImgSize);
      if (!isLoopActiveRef.current) break;

      if (res.connected) {
        setBackendConnected(true);
        setBackendWarning('');
        if (res.data?.model) setActiveModelName(res.data.model);

        const detections = res.data?.detections || [];
        setFrameDimensions({
          width: res.data?.imgWidth || targetW,
          height: res.data?.imgHeight || targetH,
        });
        setCurrentDetections(detections);
        setTelemetry((prev) => ({
          fps: res.data?.fps || 0,
          latencyMs: res.data?.processingTimeMs || 0,
          framesProcessed: prev.framesProcessed + 1,
        }));

        if (detections.length > 0) {
          const sorted = [...detections].sort(
            (a, b) => (b.confidence || 0) - (a.confidence || 0)
          );
          const primary = sorted[0];
          const nowMs = Date.now();
          const lastTime = lastSavedPerTypeRef.current[primary.type] || 0;

          if (nowMs - lastTime >= curCooldown * 1000) {
            lastSavedPerTypeRef.current[primary.type] = nowMs;
            captureAndSaveDamage(
              primary,
              detections,
              res.data?.imgWidth || targetW,
              res.data?.imgHeight || targetH
            );
          }
        }
      } else {
        setBackendConnected(false);
        setCurrentDetections([]);
        setBackendWarning(
          'Server YOLO Python tidak terjangkau. Pastikan backend FastAPI berjalan dan URL server benar di Pengaturan.'
        );
        setTelemetry((prev) => ({ ...prev, fps: 0, latencyMs: 0 }));
      }

      if (isLoopActiveRef.current) {
        await sleep(res.connected ? curDelay : 1500);
      }
    }
  }, [captureAndSaveDamage]);

  const handleStartDetection = async () => {
    if (!isCameraReady) {
      await handleRequestPermissions();
      return;
    }

    // Buat sesi survei baru di Supabase jika belum ada pada sesi aktif
    if (!activeSessionId) {
      try {
        const sessRes = await createSurveySession({
          sessionName: `Survei Real-Time ${selectedSegment}`,
          routeCorridor: 'Jombang - Surabaya',
          routeSegment: selectedSegment,
        });
        if (sessRes?.data?.id) {
          setActiveSessionId(sessRes.data.id);
        }
      } catch {
        // Lanjutkan deteksi walaupun pembuatan metadata sesi gagal
      }
    }

    await startRealtimeDetection();
    isLoopActiveRef.current = true;
    setIsDetecting(true);
    runInferenceLoop();
  };

  const handleStopDetection = () => {
    isLoopActiveRef.current = false;
    setIsDetecting(false);
    setCurrentDetections([]);
  };

  // Snapshot Manual untuk mencatat frame saat ini (menggunakan deteksi aktif atau kategori pilihan)
  const handleManualSnap = async () => {
    if (!videoRef.current || !isCameraReady) return;
    const vidW = videoRef.current.videoWidth || 640;
    const vidH = videoRef.current.videoHeight || 360;

    const targetItem = currentDetections[0] || {
      type: 'pothole',
      confidence: 0.9,
      severity: 'sedang',
      bbox: {
        x: Math.round(vidW * 0.25),
        y: Math.round(vidH * 0.35),
        width: Math.round(vidW * 0.5),
        height: Math.round(vidH * 0.35),
      },
    };

    await captureAndSaveDamage(
      targetItem,
      currentDetections.length > 0 ? currentDetections : [targetItem],
      currentDetections.length > 0 ? frameDimensions.width : vidW,
      currentDetections.length > 0 ? frameDimensions.height : vidH
    );
  };

  const handleSaveBackendUrl = async () => {
    setYoloApiUrl(backendUrlInput);
    const ok = await checkBackendConnection();
    if (ok) setShowSettingsModal(false);
  };

  const isAllSensorsReady = isCameraReady && isGpsActive;
  const currentSegmentObj =
    ROUTE_SEGMENTS.find((s) => s.value === selectedSegment) || ROUTE_SEGMENTS[0];

  return (
    <PageContainer
      title="Deteksi Kerusakan Jalan Real-Time"
      subtitle="Aliran kamera langsung dengan model YOLO terbaik & penandaan posisi otomatis Web Geolocation API (Rute Jombang – Surabaya)"
      hideHeaderOnMobile={true}
      action={
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowSettingsModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl shadow-2xs transition-all cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5 text-blue-600" />
            <span>Pengaturan YOLO</span>
          </button>
        </div>
      }
      className="p-2.5 sm:p-5 max-w-7xl mx-auto w-full"
    >
      {/* TOP STATUS BAR: GPS, Backend YOLO & Segmen Rute */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          {/* Status GPS Web Geolocation API */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200/90 shadow-2xs text-xs">
            <span className="relative flex h-2 w-2">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  isGpsActive ? 'bg-emerald-400' : 'bg-amber-400'
                }`}
              />
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${
                  isGpsActive ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
              />
            </span>
            <span className="font-bold text-slate-800">
              {isGpsActive ? `GPS ±${gpsCoords.accuracy}m` : 'GPS Menunggu'}
            </span>
            <span className="text-slate-400 font-mono text-[10px] hidden sm:inline">
              ({gpsCoords.lat.toFixed(5)}, {gpsCoords.lng.toFixed(5)})
            </span>
          </div>

          {/* Status Koneksi Backend YOLO */}
          <button
            type="button"
            onClick={() => setShowSettingsModal(true)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold shadow-2xs transition-all cursor-pointer ${
              backendConnected
                ? 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100'
                : 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>{backendConnected ? `YOLO Aktif (${activeModelName})` : 'Server YOLO Offline'}</span>
          </button>
        </div>

        {/* Tombol Izin & Settings Cepat Mobile */}
        <div className="flex items-center gap-1.5">
          {!isAllSensorsReady ? (
            <button
              type="button"
              onClick={handleRequestPermissions}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-full shadow-xs active:scale-95 transition-all flex items-center gap-1 cursor-pointer text-[11px]"
            >
              <Zap className="w-3.5 h-3.5 fill-white" />
              <span>Aktifkan Kamera & GPS</span>
            </button>
          ) : (
            <div className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Sensor Siap</span>
            </div>
          )}

          <button
            type="button"
            onClick={() => setShowSettingsModal(true)}
            className="sm:hidden p-2 rounded-full bg-white border border-slate-200 text-slate-600 shadow-2xs active:scale-95"
            title="Pengaturan Server & Model YOLO"
          >
            <Sliders className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Warning Banners jika Backend Offline / Enum SQL perlu migrasi */}
      {(backendWarning || storageWarning || gpsError) && (
        <div className="space-y-2">
          {backendWarning && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 flex items-start justify-between gap-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Server Inferensi YOLO Belum Terhubung</span>
                  <span className="text-[11px] text-amber-800">{backendWarning}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSettingsModal(true)}
                className="px-2.5 py-1 bg-amber-600 text-white rounded-lg text-[11px] font-bold flex-shrink-0 cursor-pointer"
              >
                Atur URL
              </button>
            </div>
          )}

          {storageWarning && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-900 flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Peringatan Penyimpanan Supabase</span>
                <span className="text-[11px]">{storageWarning}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MAIN GRID: Viewfinder Kiri (2 Kolom Desktop) + Panel Log & Statistik Kanan */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* KOLOM KIRI: KAMERA VIEWFINDER + SHUTTER CONTROLS */}
        <div className="lg:col-span-7 space-y-3.5">
          <div className="relative w-full aspect-[4/3] sm:aspect-video bg-slate-950 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl flex items-center justify-center select-none">
            {/* Live Video Feed */}
            <video
              ref={videoRef}
              playsInline
              muted
              autoPlay
              className="w-full h-full object-cover z-0"
            />

            {/* Efek Shutter Flash */}
            <div
              className={`absolute inset-0 bg-white pointer-events-none z-50 transition-opacity duration-150 ${
                isFlashing ? 'opacity-85' : 'opacity-0'
              }`}
            />

            {/* Canvas Bounding Box Overlay (tersinkron object-cover) */}
            <BoundingBoxCanvas
              detections={currentDetections}
              sourceWidth={frameDimensions.width}
              sourceHeight={frameDimensions.height}
              objectFit="cover"
            />

            {/* Viewfinder Corner Reticles */}
            <div className="absolute inset-4 pointer-events-none z-20">
              <div className="w-5 h-5 border-t-2 border-l-2 border-white/75 rounded-tl-lg absolute top-0 left-0" />
              <div className="w-5 h-5 border-t-2 border-r-2 border-white/75 rounded-tr-lg absolute top-0 right-0" />
              <div className="w-5 h-5 border-b-2 border-l-2 border-white/75 rounded-bl-lg absolute bottom-0 left-0" />
              <div className="w-5 h-5 border-b-2 border-r-2 border-white/75 rounded-br-lg absolute bottom-0 right-0" />
            </div>

            {/* TOP IN-CAMERA HUD */}
            <div className="absolute top-3 inset-x-3 z-30 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setShowSegmentModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-950/65 hover:bg-slate-950/85 backdrop-blur-md border border-white/15 text-white text-[11px] font-semibold shadow-md active:scale-95 transition-all cursor-pointer max-w-[65%]"
              >
                <Compass className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" />
                <span className="truncate">{currentSegmentObj.shortLabel}</span>
                <ChevronDown className="w-3 h-3 text-slate-300 flex-shrink-0" />
              </button>

              <div className="flex items-center gap-1.5">
                {isDetecting && (
                  <div className="hidden xs:flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-slate-950/65 backdrop-blur-md border border-white/15 text-[10px] font-mono text-emerald-400 font-bold">
                    <Activity className="w-3 h-3" />
                    <span>{telemetry.fps} FPS • {telemetry.latencyMs}ms</span>
                  </div>
                )}

                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-950/65 backdrop-blur-md border border-white/15 text-white text-[11px] font-mono shadow-md">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isDetecting ? 'bg-rose-500 animate-ping' : 'bg-slate-400'
                    }`}
                  />
                  <span className={`font-bold ${isDetecting ? 'text-rose-400' : 'text-slate-300'}`}>
                    {isDetecting ? 'LIVE AI' : 'STANDBY'}
                  </span>
                </div>
              </div>
            </div>

            {/* QUICK CONTROLS KANAN VIEWFINDER */}
            <div className="absolute right-3 top-14 z-30 flex flex-col gap-2">
              <button
                type="button"
                onClick={() =>
                  setCameraFacing((prev) => (prev === 'environment' ? 'user' : 'environment'))
                }
                className="p-2.5 rounded-full bg-slate-950/55 hover:bg-slate-950/80 backdrop-blur-md border border-white/15 text-white shadow-md active:scale-90 transition-all cursor-pointer"
                title="Ganti Kamera Depan / Belakang"
              >
                <SwitchCamera className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="p-2.5 rounded-full bg-slate-950/55 hover:bg-slate-950/80 backdrop-blur-md border border-white/15 text-white shadow-md active:scale-90 transition-all cursor-pointer"
                title={soundEnabled ? 'Matikan Suara Notifikasi' : 'Nyalakan Suara Notifikasi'}
              >
                {soundEnabled ? (
                  <Volume2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <VolumeX className="w-4 h-4 text-slate-400" />
                )}
              </button>
            </div>

            {/* BOTTOM IN-CAMERA HUD */}
            <div className="absolute bottom-3 inset-x-3 z-30 flex items-center justify-between gap-2 pointer-events-none text-white text-[10px] font-mono">
              <div className="bg-slate-950/65 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-white/15 text-slate-200 flex items-center gap-1.5">
                <Navigation className="w-3 h-3 text-sky-400" />
                <span>
                  {gpsCoords.lat.toFixed(5)}, {gpsCoords.lng.toFixed(5)}
                </span>
                <span className="text-slate-400 hidden sm:inline">
                  • {gpsCoords.speed} km/j
                </span>
              </div>

              <div className="bg-slate-950/65 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-white/15 text-sky-300 font-bold">
                Conf ≥ {(confThreshold * 100).toFixed(0)}% • {imgSize}px
              </div>
            </div>

            {/* Fallback Jika Kamera Belum Siap */}
            {!isCameraReady && (
              <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center p-6 text-center z-40 space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center">
                  <Camera className="w-7 h-7 text-blue-400 animate-pulse" />
                </div>
                <p className="text-sm font-bold text-white">Mengaktifkan Kamera Perangkat...</p>
                <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                  {cameraError ||
                    'Izinkan akses kamera dan lokasi GPS agar deteksi kerusakan jalan real-time dapat berjalan.'}
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleRequestPermissions}
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-lg active:scale-95 transition-all cursor-pointer"
                  >
                    Beri Izin Kamera & GPS
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPermissionGuide(!showPermissionGuide)}
                    className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl cursor-pointer"
                  >
                    Panduan
                  </button>
                </div>
              </div>
            )}
          </div>

          {showPermissionGuide && (
            <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-2xl text-xs text-blue-900 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold">Panduan Izin Kamera & Web Geolocation API:</span>
                <button
                  type="button"
                  onClick={() => setShowPermissionGuide(false)}
                  className="text-slate-400 hover:text-slate-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <ol className="list-decimal pl-4 space-y-1 text-[11px] text-slate-700">
                <li>Klik ikon Gembok / Pengaturan situs di address bar browser.</li>
                <li>Aktifkan izin <b>Kamera (Camera)</b> dan <b>Lokasi (Location)</b> ke <b>Izinkan (Allow)</b>.</li>
                <li>Gunakan koneksi HTTPS (atau `npm run dev:mobile`) bila membuka dari smartphone.</li>
              </ol>
            </div>
          )}

          {/* SHUTTER & ACTION CONTROLS DOCK */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-3 sm:p-4 flex items-center justify-between gap-3">
            {/* Tombol Snap Manual */}
            <button
              type="button"
              onClick={handleManualSnap}
              disabled={!isCameraReady}
              className="flex flex-col items-center gap-1 group active:scale-95 transition-all cursor-pointer disabled:opacity-40"
              title="Ambil Foto Bukti Saat Ini"
            >
              <div className="w-12 h-12 rounded-2xl bg-slate-100 group-hover:bg-blue-50 border border-slate-200 group-hover:border-blue-300 flex items-center justify-center text-slate-700 group-hover:text-blue-600 transition-colors">
                <Camera className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold text-slate-600">Snap Bukti</span>
            </button>

            {/* MAIN SHUTTER: MULAI / HENTIKAN REAL-TIME DETECTION */}
            <div className="flex-1 flex justify-center">
              {!isDetecting ? (
                <button
                  type="button"
                  onClick={handleStartDetection}
                  className="w-full max-w-xs py-3.5 px-6 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:brightness-110 active:scale-98 text-white font-extrabold text-sm flex items-center justify-center gap-2.5 shadow-lg shadow-blue-600/25 transition-all cursor-pointer"
                >
                  <Play className="w-5 h-5 fill-white" />
                  <span>Mulai Deteksi Real-Time</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleStopDetection}
                  className="w-full max-w-xs py-3.5 px-6 rounded-2xl bg-rose-600 hover:bg-rose-700 active:scale-98 text-white font-extrabold text-sm flex items-center justify-center gap-2.5 shadow-lg shadow-rose-600/25 transition-all cursor-pointer"
                >
                  <Square className="w-4 h-4 fill-white" />
                  <span>Hentikan Deteksi ({telemetry.framesProcessed} frame)</span>
                </button>
              )}
            </div>

            {/* Tombol Buka Peta GIS */}
            <button
              type="button"
              onClick={() => navigate('/map')}
              className="flex flex-col items-center gap-1 group active:scale-95 transition-all cursor-pointer"
              title="Lihat Hasil di Peta Web GIS"
            >
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 group-hover:bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700 relative transition-colors">
                <Map className="w-5 h-5" />
                {sessionLogs.length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-rose-600 text-white font-extrabold text-[10px] min-w-5 h-5 px-1 rounded-full flex items-center justify-center border-2 border-white shadow-xs">
                    {sessionLogs.length}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-bold text-slate-600">Peta GIS</span>
            </button>
          </div>
        </div>

        {/* KOLOM KANAN: PREVIEW BUKTI, RINGKASAN 4 KELAS, & LOG REAL-TIME */}
        <div className="lg:col-span-5 space-y-3.5">
          {/* Tab Switcher */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="grid grid-cols-3 p-1.5 bg-slate-100/90 border-b border-slate-200/70 text-xs font-bold text-slate-600">
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`py-2 px-2 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'preview'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Eye className="w-3.5 h-3.5 text-blue-600" />
                <span>Foto Bukti</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('summary')}
                className={`py-2 px-2 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'summary'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Radio className="w-3.5 h-3.5 text-purple-600" />
                <span>Ringkasan</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('history')}
                className={`py-2 px-2 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'history'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Clock className="w-3.5 h-3.5 text-emerald-600" />
                <span>Log ({sessionLogs.length})</span>
              </button>
            </div>

            {activeTab === 'preview' && (
              <div className="p-4 space-y-3">
                {previewWatermarkUrl ? (
                  <>
                    <div
                      onClick={() => setFullPhotoModalUrl(previewWatermarkUrl)}
                      className="relative aspect-video rounded-2xl overflow-hidden border border-slate-200 bg-slate-950 cursor-pointer group"
                    >
                      <img
                        src={previewWatermarkUrl}
                        alt="Foto Bukti Kerusakan Geotagged"
                        className="w-full h-full object-cover group-hover:scale-102 transition-transform"
                      />
                      <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1.5">
                        <Maximize2 className="w-4 h-4" />
                        <span>Perbesar Foto Bukti</span>
                      </div>
                    </div>

                    {lastSavedItem && (
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 text-xs space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Kelas Kerusakan:</span>
                          <Badge variant={lastSavedItem.type} showIcon>
                            {getDamageTypeConfig(lastSavedItem.type).label}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between font-mono text-[11px]">
                          <span className="text-slate-500">Koordinat GPS:</span>
                          <span className="font-bold text-slate-800">
                            {lastSavedItem.coordinates.lat.toFixed(5)},{' '}
                            {lastSavedItem.coordinates.lng.toFixed(5)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Status Database:</span>
                          <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full text-[10px]">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>
                              {lastSavedItem.savedToCloud
                                ? 'Tersimpan di Supabase'
                                : 'Tercatat Lokal'}
                            </span>
                          </span>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="aspect-video rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/70 flex flex-col items-center justify-center p-5 text-center">
                    <Camera className="w-8 h-8 text-slate-300 mb-2" />
                    <p className="text-xs font-bold text-slate-700">
                      Belum Ada Foto Bukti Terekam
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1 max-w-xs leading-relaxed">
                      Saat model YOLO mendeteksi salah satu dari 4 kelas kerusakan jalan secara real-time, foto bukti ber-watermark GPS otomatis tersimpan ke Supabase.
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'summary' && (
              <div className="p-3">
                <DetectionSummary
                  detections={sessionLogs}
                  className="border-none shadow-none p-1"
                />
              </div>
            )}

            {activeTab === 'history' && (
              <div className="p-2">
                <DetectionLog
                  logs={sessionLogs}
                  maxHeight="340px"
                  onSelectLog={(item) => item.imageUrl && setFullPhotoModalUrl(item.imageUrl)}
                  className="border-none shadow-none"
                />
              </div>
            )}
          </div>

          {/* Desktop Quick Legend 4 Kelas */}
          <div className="hidden lg:block bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4">
            <div className="text-xs font-bold text-slate-900 mb-2.5">
              4 Kelas Deteksi Resmi Skripsi
            </div>
            <div className="grid grid-cols-2 gap-2">
              {OFFICIAL_DAMAGE_TYPES.map((cls) => (
                <div
                  key={cls.id}
                  className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-100 text-xs"
                >
                  <span
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
                    style={{ backgroundColor: `${cls.color}18` }}
                  >
                    {cls.icon}
                  </span>
                  <div className="min-w-0">
                    <div className="font-bold text-slate-800 truncate">{cls.label}</div>
                    <div className="text-[10px] text-slate-400 truncate">{cls.englishLabel}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL PILIH SEGMEN RUTE JOMBANG - SURABAYA */}
      {showSegmentModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setShowSegmentModal(false)}
        >
          <div
            className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-5 space-y-3 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
              <div>
                <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                  <Compass className="w-4 h-4 text-blue-600" />
                  <span>Segmen Pengujian Rute Jombang – Surabaya</span>
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Satu arah sepanjang ±90 km (3 tahapan mingguan)
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowSegmentModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              {ROUTE_SEGMENTS.map((seg) => (
                <button
                  key={seg.value}
                  type="button"
                  onClick={() => {
                    setSelectedSegment(seg.value);
                    setActiveSessionId(null);
                    setShowSegmentModal(false);
                  }}
                  className={`w-full text-left p-3.5 rounded-2xl border text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                    selectedSegment === seg.value
                      ? 'bg-blue-50 border-blue-400 text-blue-900 shadow-2xs'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <MapPin
                      className={`w-4 h-4 flex-shrink-0 ${
                        selectedSegment === seg.value ? 'text-blue-600' : 'text-slate-400'
                      }`}
                    />
                    <div>
                      <div>{seg.label}</div>
                      <div className="text-[10px] font-medium text-slate-500 mt-0.5">
                        {seg.stage}
                      </div>
                    </div>
                  </div>
                  {selectedSegment === seg.value && (
                    <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL PENGATURAN SERVER YOLO & PARAMETER INFERENSI */}
      {showSettingsModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setShowSettingsModal(false)}
        >
          <div
            className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-5 space-y-4 shadow-2xl max-h-[88vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
              <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-blue-600" />
                <span>Pengaturan Deteksi Real-Time YOLO</span>
              </h4>
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* URL Server Python */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                URL Server Backend Python (FastAPI YOLO)
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={backendUrlInput}
                  onChange={(e) => setBackendUrlInput(e.target.value)}
                  placeholder="http://localhost:8000 atau https://xxxx.ngrok-free.app"
                  className="flex-1 px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={handleSaveBackendUrl}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Uji</span>
                </button>
              </div>
              <p className="text-[10px] text-slate-500">
                Status saat ini:{' '}
                <span className={backendConnected ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}>
                  {backendConnected ? `Terhubung (${activeModelName})` : 'Tidak Terhubung'}
                </span>
              </p>
            </div>

            {/* Confidence Threshold */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700">Confidence Threshold</span>
                <span className="font-mono font-bold text-blue-600">
                  {(confThreshold * 100).toFixed(0)}%
                </span>
              </div>
              <input
                type="range"
                min="0.15"
                max="0.75"
                step="0.05"
                value={confThreshold}
                onChange={(e) => setConfThreshold(parseFloat(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
            </div>

            {/* Resolusi Inferensi */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                Resolusi Input Inferensi (IMGSZ)
              </label>
              <div className="grid grid-cols-3 gap-2 text-xs">
                {[
                  { val: 640, label: '640 px', desc: 'FPS Tinggi' },
                  { val: 960, label: '960 px', desc: 'Seimbang' },
                  { val: 1280, label: '1280 px', desc: 'Retakan Tipis' },
                ].map((opt) => (
                  <button
                    key={opt.val}
                    type="button"
                    onClick={() => setImgSize(opt.val)}
                    className={`p-2 rounded-xl border text-center cursor-pointer transition-all ${
                      imgSize === opt.val
                        ? 'bg-blue-50 border-blue-500 text-blue-800 font-bold'
                        : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    <div>{opt.label}</div>
                    <div className="text-[10px] text-slate-400 font-normal">{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Kecepatan Polling / Jeda Frame */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                Jeda Pengiriman Frame Stream
              </label>
              <div className="grid grid-cols-3 gap-2 text-xs">
                {[
                  { val: 0, label: 'Kontinu', desc: 'Max FPS' },
                  { val: 250, label: '250 ms', desc: 'Optimal HP' },
                  { val: 1000, label: '1 Detik', desc: 'Hemat Suhu' },
                ].map((opt) => (
                  <button
                    key={opt.val}
                    type="button"
                    onClick={() => setStreamDelayMs(opt.val)}
                    className={`p-2 rounded-xl border text-center cursor-pointer transition-all ${
                      streamDelayMs === opt.val
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-800 font-bold'
                        : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    <div>{opt.label}</div>
                    <div className="text-[10px] text-slate-400 font-normal">{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Cooldown Auto-Save */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                Cooldown Penyimpanan Duplikat per Kelas
              </label>
              <div className="grid grid-cols-3 gap-2 text-xs">
                {[2, 3, 5].map((sec) => (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => setSaveCooldownSec(sec)}
                    className={`p-2 rounded-xl border text-center cursor-pointer transition-all ${
                      saveCooldownSec === sec
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800 font-bold'
                        : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    {sec} Detik
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL FULL RESOLUSI FOTO BUKTI */}
      {fullPhotoModalUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4"
          onClick={() => setFullPhotoModalUrl(null)}
        >
          <div className="w-full max-w-2xl flex justify-end mb-2">
            <button
              type="button"
              onClick={() => setFullPhotoModalUrl(null)}
              className="p-2 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div
            className="w-full max-w-2xl max-h-[82vh] overflow-hidden rounded-2xl border border-slate-700 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={fullPhotoModalUrl}
              alt="Foto Bukti Kerusakan Jalan"
              className="w-full h-full object-contain"
            />
          </div>
        </div>
      )}
    </PageContainer>
  );
};

export default DetectionPage;

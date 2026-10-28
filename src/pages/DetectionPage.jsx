import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Camera,
  Play,
  Pause,
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
  HelpCircle,
  Layers,
  ChevronDown,
  Sparkles,
  Radio,
  Clock,
  Zap,
  Maximize2,
  X,
  CheckCircle2,
} from 'lucide-react';
import PageContainer from '../components/layout/PageContainer';
import BoundingBoxCanvas from '../components/detection/BoundingBoxCanvas';
import Badge from '../components/common/Badge';
import ImageUploadMode from '../components/detection/ImageUploadMode';
import VideoUploadMode from '../components/detection/VideoUploadMode';
import { createWatermarkedImageBlob } from '../utils/watermark';
import { uploadDamageImage, saveDetection, processImageDetection } from '../services';
import { DAMAGE_TYPES } from '../utils/damageTypes';
import { ROUTE_SEGMENTS } from '../utils/constants';

// Titik acuan koridor Surabaya–Mojokerto–Jombang
const DEFAULT_CORRIDOR_GPS = { lat: -7.36152, lng: 112.62341, accuracy: 3.5, speed: '0' };

const DetectionPage = () => {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Mode Deteksi: 'image' (Uji Foto YOLO11m) | 'camera' (Kamera Lapangan) | 'video' (Unggah Video)
  const [detectionMode, setDetectionMode] = useState('image');

  // Status Kamera & Streaming
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [cameraFacing, setCameraFacing] = useState('environment'); // 'environment' (belakang) | 'user' (depan)
  const [cameraError, setCameraError] = useState('');

  // Status GPS Pengguna
  const [gpsCoords, setGpsCoords] = useState(DEFAULT_CORRIDOR_GPS);
  const [isGpsActive, setIsGpsActive] = useState(false);
  const [gpsStatusText, setGpsStatusText] = useState('Menghubungkan GPS...');
  const [showPermissionGuide, setShowPermissionGuide] = useState(false);

  // Pengaturan Survei
  const [selectedSegment, setSelectedSegment] = useState('Surabaya - Krian');
  const [showSegmentModal, setShowSegmentModal] = useState(false);
  const [detectionIntervalSec, setDetectionIntervalSec] = useState(3);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Hasil Deteksi & Visual Shutter
  const [currentDetections, setCurrentDetections] = useState([]);
  const [recentDetectionsLog, setRecentDetectionsLog] = useState([]);
  const [totalSavedCount, setTotalSavedCount] = useState(0);
  const [lastSavedItem, setLastSavedItem] = useState(null);
  const [previewWatermarkUrl, setPreviewWatermarkUrl] = useState(null);
  const [isProcessingFrame, setIsProcessingFrame] = useState(false);
  const [isFlashing, setIsFlashing] = useState(false);
  const [fullPhotoModalUrl, setFullPhotoModalUrl] = useState(null);

  // Tab Mobile Kontrol Bawah: 'preview' | 'corridor' | 'history'
  const [activeTab, setActiveTab] = useState('preview');

  // ==========================================
  // 1. INISIALISASI STREAM KAMERA HP
  // ==========================================
  const startCamera = useCallback(async () => {
    try {
      setCameraError('');
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      const constraints = {
        video: {
          facingMode: cameraFacing,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
          setIsCameraReady(true);
        };
      }
    } catch (err) {
      console.warn('Gagal membuka kamera perangkat:', err);
      setCameraError(
        'Izin kamera belum aktif atau diblokir oleh browser. Klik tombol izin untuk mengaktifkan.'
      );
      setIsCameraReady(false);
    }
  }, [cameraFacing]);

  useEffect(() => {
    if (detectionMode === 'camera') {
      startCamera();
    } else {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      setIsCameraReady(false);
      setIsDetecting(false);
    }

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [detectionMode, startCamera]);

  // Toggle Kamera Depan / Belakang
  const handleToggleCamera = () => {
    setCameraFacing((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  // ==========================================
  // 2. PELACAKAN LIVE GPS SMARTPHONE (Geolokasi)
  // ==========================================
  const startGpsWatch = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setGpsStatusText('GPS tidak didukung browser');
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setIsGpsActive(true);
        setGpsCoords({
          lat: Number(pos.coords.latitude.toFixed(6)),
          lng: Number(pos.coords.longitude.toFixed(6)),
          accuracy: Number((pos.coords.accuracy || 3.5).toFixed(1)),
          speed: pos.coords.speed ? (pos.coords.speed * 3.6).toFixed(1) : '0',
        });
        setGpsStatusText(`Terkunci (±${(pos.coords.accuracy || 0).toFixed(1)}m)`);
      },
      (err) => {
        console.warn('GPS error/permission denied:', err.message);
        setIsGpsActive(false);
        setGpsStatusText('Default Koridor');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );

    return watchId;
  }, []);

  useEffect(() => {
    const watchId = startGpsWatch();
    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, [startGpsWatch]);

  // Permintaan Izin Kamera & GPS Eksplisit
  const handleRequestAllPermissions = async () => {
    await startCamera();
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setIsGpsActive(true);
          setGpsCoords({
            lat: Number(pos.coords.latitude.toFixed(6)),
            lng: Number(pos.coords.longitude.toFixed(6)),
            accuracy: Number((pos.coords.accuracy || 3.5).toFixed(1)),
            speed: pos.coords.speed ? (pos.coords.speed * 3.6).toFixed(1) : '0',
          });
          setGpsStatusText(`Terkunci (±${(pos.coords.accuracy || 0).toFixed(1)}m)`);
        },
        () => {
          setIsGpsActive(false);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }
  };

  // Efek Suara Beep Deteksi
  const playDetectionAlert = useCallback(() => {
    if (!soundEnabled) return;
    try {
      if (navigator.vibrate) navigator.vibrate(150);
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.frequency.value = 880;
      gain.gain.value = 0.15;
      osc.start();
      setTimeout(() => {
        osc.stop();
        audioCtx.close();
      }, 150);
    } catch {
      // Audio context ignored
    }
  }, [soundEnabled]);

  // ==========================================
  // 3. FUNGSI WATERMARK, SNAP & AUTO-SAVE
  // ==========================================
  const captureAndSaveDamage = useCallback(
    async (damageItem) => {
      if (!videoRef.current) return;

      try {
        // Efek Flash Shutter Kamera
        setIsFlashing(true);
        setTimeout(() => setIsFlashing(false), 180);

        const videoEl = videoRef.current;
        const now = new Date();

        // 1. Generate Foto dengan Watermark Lengkap Geotagging
        const watermarkedBlob = await createWatermarkedImageBlob(videoEl, {
          damageType: damageItem.type,
          confidence: damageItem.confidence,
          lat: gpsCoords.lat,
          lng: gpsCoords.lng,
          gpsAccuracy: gpsCoords.accuracy,
          timestamp: now.toISOString(),
          routeSegment: selectedSegment,
          bbox: damageItem.bbox,
        });

        // Buat file untuk upload
        const fileName = `roadsick_${damageItem.type}_${Date.now()}.jpg`;
        const fileObj = new File([watermarkedBlob], fileName, { type: 'image/jpeg' });
        const previewUrl = URL.createObjectURL(watermarkedBlob);
        setPreviewWatermarkUrl(previewUrl);

        // 2. Upload Foto Ber-Watermark ke Supabase Storage
        let imageUrl = null;
        try {
          imageUrl = await uploadDamageImage(fileObj);
        } catch {
          imageUrl = previewUrl; // Fallback jika offline
        }

        // 3. Simpan Metadata Deteksi ke Supabase Database
        const payload = {
          type: damageItem.type,
          confidence: damageItem.confidence,
          severity: damageItem.severity || 'sedang',
          bbox: damageItem.bbox,
          imageUrl,
          capturedAt: now.toISOString(),
          latitude: gpsCoords.lat,
          longitude: gpsCoords.lng,
          roadName:
            selectedSegment === 'Luar Koridor / Rute Bebas'
              ? 'Rute Eksplorasi (Umum)'
              : `Koridor ${selectedSegment}`,
          routeSegment: selectedSegment,
        };

        const res = await saveDetection(payload);
        const savedId = res?.data?.id || `det-${Date.now()}`;

        playDetectionAlert();

        const logEntry = {
          id: savedId,
          type: damageItem.type,
          confidence: damageItem.confidence,
          coordinates: { lat: gpsCoords.lat, lng: gpsCoords.lng },
          timestamp: now.toISOString(),
          imageUrl,
        };

        setLastSavedItem(logEntry);
        setTotalSavedCount((prev) => prev + 1);
        setRecentDetectionsLog((prev) => [logEntry, ...prev.slice(0, 19)]);
      } catch (err) {
        console.error('Gagal memproses dan menyimpan deteksi:', err);
      }
    },
    [gpsCoords, selectedSegment, playDetectionAlert]
  );

  // ==========================================
  // 4. REAL-TIME DETECTION INFERENCE LOOP
  // ==========================================
  useEffect(() => {
    let timer = null;

    if (isDetecting && isCameraReady) {
      timer = setInterval(async () => {
        if (!videoRef.current || isProcessingFrame) return;

        setIsProcessingFrame(true);
        try {
          const videoEl = videoRef.current;
          const canvas = document.createElement('canvas');
          canvas.width = 640;
          canvas.height = 360;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(videoEl, 0, 0, 640, 360);

          canvas.toBlob(async (blob) => {
            if (!blob) {
              setIsProcessingFrame(false);
              return;
            }

            try {
              const res = await processImageDetection(blob);
              const foundDetections = res?.data?.detections || [];

              if (foundDetections.length > 0) {
                const primaryDetection = foundDetections[0];
                setCurrentDetections([primaryDetection]);
                await captureAndSaveDamage(primaryDetection);
              } else {
                setCurrentDetections([]);
              }
            } catch (err) {
              console.warn('Inference error:', err);
            } finally {
              setIsProcessingFrame(false);
            }
          }, 'image/jpeg', 0.85);
        } catch {
          setIsProcessingFrame(false);
        }
      }, detectionIntervalSec * 1000);
    } else {
      setCurrentDetections([]);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isDetecting, isCameraReady, isProcessingFrame, detectionIntervalSec, captureAndSaveDamage]);

  // Tombol Manual Snap & Geotag
  const handleManualCapture = async () => {
    if (!videoRef.current) return;
    const defaultDamage = {
      type: 'longitudinal_crack',
      confidence: 0.95,
      severity: 'sedang',
      bbox: { x: 200, y: 150, width: 240, height: 160 },
    };
    await captureAndSaveDamage(defaultDamage);
  };

  const isAllPermissionsGranted = isCameraReady && isGpsActive;

  return (
    <PageContainer
      title={
        detectionMode === 'image'
          ? 'Uji Model YOLO11m (Foto Citra Jalan)'
          : detectionMode === 'video'
          ? 'Deteksi Batch Video Dashcam'
          : 'Deteksi Real-Time & Pemetaan Jalan Rusak'
      }
      subtitle={
        detectionMode === 'image'
          ? 'Uji akurasi model YOLO11m hasil training Ultralytics dengan mengunggah foto jalan langsung dari laptop'
          : detectionMode === 'video'
          ? 'Analisis berkas video perjalanan koridor jalan raya untuk deteksi kerusakan massal'
          : 'Kamera smartphone mendeteksi kerusakan jalan secara langsung dan otomatis memetakan ke Web GIS dengan foto ber-watermark posisi'
      }
      hideHeaderOnMobile={true}
      className="p-2 sm:p-4 md:p-6 max-w-4xl mx-auto space-y-4"
    >
      {/* ========================================================= */}
      {/* SEGMENTED DETECTOR MODE TABS (NAVIGASI UTAMA FITUR DETEKSI) */}
      {/* ========================================================= */}
      <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-wrap sm:flex-nowrap gap-1.5 mb-2">
        <button
          type="button"
          onClick={() => setDetectionMode('image')}
          className={`flex-1 min-w-[150px] py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            detectionMode === 'image'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 scale-[1.01]'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
          }`}
        >
          <Camera className="w-4 h-4" />
          <span>Uji Foto YOLO11m</span>
          <span
            className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold ${
              detectionMode === 'image' ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-700'
            }`}
          >
            Indoor / Laptop
          </span>
        </button>

        <button
          type="button"
          onClick={() => setDetectionMode('camera')}
          className={`flex-1 min-w-[150px] py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            detectionMode === 'camera'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 scale-[1.01]'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
          }`}
        >
          <Radio className="w-4 h-4" />
          <span>Kamera Lapangan</span>
          <span
            className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold ${
              detectionMode === 'camera'
                ? 'bg-white/20 text-white'
                : 'bg-emerald-100 text-emerald-700'
            }`}
          >
            Live GPS
          </span>
        </button>

        <button
          type="button"
          onClick={() => setDetectionMode('video')}
          className={`flex-1 min-w-[130px] py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            detectionMode === 'video'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 scale-[1.01]'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Unggah Video</span>
        </button>
      </div>

      {/* MODE 1: IMAGE UPLOAD (TESTING MODEL INDOOR DARI LAPTOP) */}
      {detectionMode === 'image' && <ImageUploadMode />}

      {/* MODE 2: VIDEO DASHCAM */}
      {detectionMode === 'video' && <VideoUploadMode />}

      {/* MODE 3: KAMERA SMARTPHONE DENGAN GEOTAGGING REAL-TIME */}
      {detectionMode === 'camera' && (
        <div className="space-y-3 sm:space-y-4">
          {/* MOBILE TOP STATUS BAR: TELEMETRI & SENSOR PILL */}
          <div className="flex items-center justify-between gap-2 px-1 text-xs">
            {/* Status GPS Telemetri */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200/90 shadow-2xs">
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
              GPS: {isGpsActive ? `±${gpsCoords.accuracy}m` : 'Mencari...'}
            </span>
            <span className="text-slate-400 font-mono text-[10px] hidden xs:inline">
              ({gpsCoords.lat.toFixed(4)}, {gpsCoords.lng.toFixed(4)})
            </span>
          </div>

          {/* Quick Action Izin / Bantuan */}
          <div className="flex items-center gap-1.5">
            {!isAllPermissionsGranted ? (
              <button
                type="button"
                onClick={handleRequestAllPermissions}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-full shadow-xs active:scale-95 transition-all flex items-center gap-1 cursor-pointer text-[11px]"
              >
                <Zap className="w-3.5 h-3.5 fill-white" />
                <span>Aktifkan Sensor</span>
              </button>
            ) : (
              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[11px]">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Sensor Siap</span>
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowPermissionGuide(!showPermissionGuide)}
              className="p-1.5 rounded-full border border-slate-200 bg-white text-slate-500 hover:text-slate-800 shadow-2xs active:scale-95 transition-colors"
              title="Panduan Izin Browser"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Panduan Izin Jika Diperlukan */}
        {showPermissionGuide && (
          <div className="p-3.5 bg-blue-50/90 border border-blue-200 rounded-2xl text-xs text-blue-900 space-y-1.5 animate-in fade-in duration-200 shadow-xs">
            <div className="flex items-center justify-between">
              <h5 className="font-extrabold flex items-center gap-1.5 text-blue-950">
                <ShieldAlert className="w-4 h-4 text-blue-600" />
                <span>Izin Kamera & Lokasi Smartphone:</span>
              </h5>
              <button
                type="button"
                onClick={() => setShowPermissionGuide(false)}
                className="text-slate-400 hover:text-slate-700 p-0.5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <ol className="list-decimal pl-4 space-y-1 text-slate-700 text-[11px] leading-relaxed">
              <li>
                Di browser HP, klik ikon <b>Gembok (🔒)</b> di samping URL.
              </li>
              <li>
                Ubah izin <b>Kamera</b> dan <b>Lokasi</b> menjadi <b>"Izinkan" (Allow)</b>.
              </li>
              <li>Pastikan toggle GPS/Lokasi HP dalam keadaan menyala.</li>
            </ol>
          </div>
        )}

        {/* ========================================================= */}
        {/* KAMERA VIEWFINDER HERO (RESOLUSI 3:4 PADA MODE MOBILE) */}
        {/* ========================================================= */}
        <div className="relative w-full aspect-[3/4] sm:aspect-[4/3] lg:aspect-video bg-slate-950 rounded-[28px] overflow-hidden border border-slate-800/90 shadow-2xl flex items-center justify-center select-none">
          {/* Live Video Feed */}
          <video
            ref={videoRef}
            playsInline
            muted
            autoPlay
            className="w-full h-full object-cover z-0"
          />

          {/* Efek Visual Flash Shutter Saat Ambil Foto */}
          <div
            className={`absolute inset-0 bg-white pointer-events-none z-50 transition-opacity duration-150 ${
              isFlashing ? 'opacity-90' : 'opacity-0'
            }`}
          />

          {/* Bounding Box Overlay */}
          <BoundingBoxCanvas detections={currentDetections} />

          {/* Professional Viewfinder Brackets (Corners) */}
          <div className="absolute inset-4 sm:inset-6 pointer-events-none z-20">
            <div className="w-5 h-5 sm:w-6 sm:h-6 border-t-2 border-l-2 border-white/80 rounded-tl-lg absolute top-0 left-0" />
            <div className="w-5 h-5 sm:w-6 sm:h-6 border-t-2 border-r-2 border-white/80 rounded-tr-lg absolute top-0 right-0" />
            <div className="w-5 h-5 sm:w-6 sm:h-6 border-b-2 border-l-2 border-white/80 rounded-bl-lg absolute bottom-0 left-0" />
            <div className="w-5 h-5 sm:w-6 sm:h-6 border-b-2 border-r-2 border-white/80 rounded-br-lg absolute bottom-0 right-0" />

            {/* Crosshair Target Tengah Geodesi */}
            <div className="absolute inset-0 flex items-center justify-center opacity-35">
              <div className="w-8 h-0.5 bg-white shadow-xs" />
              <div className="w-0.5 h-8 bg-white absolute shadow-xs" />
              <div className="w-16 h-16 rounded-full border border-white/40 absolute" />
            </div>
          </div>

          {/* TOP IN-CAMERA HUD: Koridor & Status Scan */}
          <div className="absolute top-3.5 inset-x-3.5 z-30 flex items-center justify-between gap-2 pointer-events-auto">
            {/* Pemilih Koridor Cepat */}
            <button
              type="button"
              onClick={() => setShowSegmentModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-md border border-white/20 text-white text-[11px] font-semibold shadow-md active:scale-95 transition-all cursor-pointer"
            >
              <Compass className="w-3.5 h-3.5 text-sky-400" />
              <span className="truncate max-w-[130px] sm:max-w-none">{selectedSegment}</span>
              <ChevronDown className="w-3 h-3 text-slate-300" />
            </button>

            {/* Status Scanning AI */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-md border border-white/20 text-white text-[11px] font-mono shadow-md">
              <span
                className={`w-2 h-2 rounded-full ${
                  isDetecting ? 'bg-rose-500 animate-ping' : 'bg-slate-400'
                }`}
              />
              <span className={`font-bold ${isDetecting ? 'text-rose-400' : 'text-slate-300'}`}>
                {isDetecting ? 'LIVE REC' : 'STANDBY'}
              </span>
            </div>
          </div>

          {/* FLOATING IN-CAMERA QUICK CONTROLS (Sisi Kanan Viewfinder) */}
          <div className="absolute right-3.5 top-16 z-30 flex flex-col gap-2 pointer-events-auto">
            {/* Putar Kamera Depan / Belakang */}
            <button
              type="button"
              onClick={handleToggleCamera}
              className="p-2.5 rounded-full bg-black/45 hover:bg-black/65 backdrop-blur-md border border-white/20 text-white shadow-md active:scale-90 transition-all cursor-pointer"
              title="Putar Kamera"
            >
              <SwitchCamera className="w-4 h-4" />
            </button>

            {/* Suara On / Off */}
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-2.5 rounded-full bg-black/45 hover:bg-black/65 backdrop-blur-md border border-white/20 text-white shadow-md active:scale-90 transition-all cursor-pointer"
              title={soundEnabled ? 'Matikan Suara Beep' : 'Nyalakan Suara Beep'}
            >
              {soundEnabled ? (
                <Volume2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <VolumeX className="w-4 h-4 text-slate-400" />
              )}
            </button>
          </div>

          {/* BOTTOM IN-CAMERA HUD: Telemetri WGS84 Geotag */}
          <div className="absolute bottom-3.5 inset-x-3.5 z-30 flex items-center justify-between pointer-events-none text-white text-[11px]">
            <div className="bg-black/50 backdrop-blur-md px-2.5 py-1 rounded-xl border border-white/15 font-mono text-[10px] text-slate-200 flex items-center gap-1.5">
              <Navigation className="w-3 h-3 text-sky-400" />
              <span>
                {gpsCoords.lat.toFixed(5)}, {gpsCoords.lng.toFixed(5)}
              </span>
            </div>

            <div className="bg-black/50 backdrop-blur-md px-2.5 py-1 rounded-xl border border-white/15 font-mono text-[10px] text-emerald-400 font-bold">
              YOLOv8 GeoTag
            </div>
          </div>

          {/* Fallback Jika Kamera Belum Siap */}
          {!isCameraReady && (
            <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center p-6 text-center z-10 space-y-3">
              <Camera className="w-12 h-12 text-slate-600 animate-pulse" />
              <p className="text-sm font-bold text-white">Menghubungkan Kamera Smartphone...</p>
              <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                {cameraError ||
                  'Silakan izinkan akses kamera agar sistem dapat mendeteksi kerusakan jalan secara real-time.'}
              </p>
              <button
                type="button"
                onClick={handleRequestAllPermissions}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-full shadow-lg active:scale-95 transition-all cursor-pointer"
              >
                Beri Izin Kamera & GPS
              </button>
            </div>
          )}
        </div>

        {/* ========================================================= */}
        {/* NATIVE MOBILE SHUTTER & CONTROLS DOCK */}
        {/* ========================================================= */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-3 sm:p-4 flex items-center justify-around gap-2">
          {/* Tombol Snap Manual Geotag */}
          <button
            type="button"
            onClick={handleManualCapture}
            className="flex flex-col items-center gap-1 group active:scale-90 transition-all cursor-pointer"
            title="Ambil foto saat ini dan beri watermark geotag"
          >
            <div className="w-13 h-13 rounded-full bg-slate-100 group-hover:bg-blue-50 border border-slate-200 group-hover:border-blue-300 shadow-xs flex items-center justify-center text-slate-700 group-hover:text-blue-600 transition-colors">
              <Camera className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-slate-600">Snap</span>
          </button>

          {/* MAIN SHUTTER BUTTON (START / PAUSE SCAN) */}
          <div className="flex flex-col items-center gap-1">
            <div className="w-20 h-20 rounded-full border-4 border-rose-500/25 p-1 flex items-center justify-center bg-white shadow-xl">
              {!isDetecting ? (
                <button
                  type="button"
                  onClick={() => {
                    if (!isCameraReady) {
                      handleRequestAllPermissions();
                      return;
                    }
                    setIsDetecting(true);
                  }}
                  className="w-full h-full rounded-full bg-gradient-to-tr from-rose-600 to-red-500 hover:from-rose-700 hover:to-red-600 active:scale-95 text-white flex flex-col items-center justify-center shadow-md transition-all cursor-pointer"
                >
                  <Play className="w-6 h-6 fill-white ml-0.5" />
                  <span className="text-[9px] font-black uppercase tracking-wider">MULAI</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsDetecting(false)}
                  className="w-full h-full rounded-2xl bg-slate-900 border-2 border-rose-500 hover:bg-slate-950 active:scale-95 text-rose-400 flex flex-col items-center justify-center shadow-md transition-all cursor-pointer animate-pulse"
                >
                  <Pause className="w-6 h-6 fill-rose-400" />
                  <span className="text-[9px] font-black uppercase tracking-wider">JEDA</span>
                </button>
              )}
            </div>
            <span className="text-[10px] font-bold text-slate-700">
              {isDetecting ? 'Merekam...' : 'Deteksi AI'}
            </span>
          </div>

          {/* Tombol Menuju Peta Web GIS */}
          <button
            type="button"
            onClick={() => navigate('/map')}
            className="flex flex-col items-center gap-1 group active:scale-90 transition-all cursor-pointer"
            title="Buka Peta Web GIS"
          >
            <div className="w-13 h-13 rounded-full bg-emerald-50 group-hover:bg-emerald-100 border border-emerald-200 shadow-xs flex items-center justify-center text-emerald-700 relative transition-colors">
              <Map className="w-5 h-5" />
              {totalSavedCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-600 text-white font-extrabold text-[10px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-xs">
                  {totalSavedCount > 99 ? '99+' : totalSavedCount}
                </span>
              )}
            </div>
            <span className="text-[10px] font-bold text-slate-600">Peta GIS</span>
          </button>
        </div>

        {/* ========================================================= */}
        {/* SEGMENTED TABBED DRAWER: HASIL, KORIDOR, RIWAYAT */}
        {/* ========================================================= */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
          {/* Segmented Control Tabs */}
          <div className="grid grid-cols-3 p-1.5 bg-slate-100/90 border-b border-slate-200 text-xs font-bold text-slate-600">
            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={`py-2 px-1 rounded-2xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'preview'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'hover:text-slate-900 text-slate-500'
              }`}
            >
              <Eye className="w-3.5 h-3.5 text-purple-600" />
              <span className="truncate">Foto Geotag</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('corridor')}
              className={`py-2 px-1 rounded-2xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'corridor'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'hover:text-slate-900 text-slate-500'
              }`}
            >
              <Compass className="w-3.5 h-3.5 text-blue-600" />
              <span className="truncate">Rute Survei</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`py-2 px-1 rounded-2xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'history'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'hover:text-slate-900 text-slate-500'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-emerald-600" />
              <span className="truncate">Log ({recentDetectionsLog.length})</span>
            </button>
          </div>

          {/* TAB 1: PREVIEW FOTO WATERMARK TERAKHIR */}
          {activeTab === 'preview' && (
            <div className="p-3.5 sm:p-4 space-y-3">
              {previewWatermarkUrl ? (
                <div className="space-y-3">
                  <div
                    onClick={() => setFullPhotoModalUrl(previewWatermarkUrl)}
                    className="relative aspect-video rounded-2xl overflow-hidden border border-slate-200 bg-slate-950 shadow-xs cursor-pointer group"
                  >
                    <img
                      src={previewWatermarkUrl}
                      alt="Watermark Geotagged Result"
                      className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1">
                      <Maximize2 className="w-4 h-4" />
                      <span>Lihat Resolusi Penuh</span>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/70 text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Jenis Kerusakan:</span>
                      <span className="font-extrabold text-slate-900">
                        {DAMAGE_TYPES[lastSavedItem?.type]?.label || lastSavedItem?.type}
                      </span>
                    </div>
                    <div className="flex items-center justify-between font-mono text-[11px]">
                      <span className="text-slate-500">Koordinat Geotag:</span>
                      <span className="font-bold text-blue-700">
                        {lastSavedItem?.coordinates?.lat.toFixed(6)},{' '}
                        {lastSavedItem?.coordinates?.lng.toFixed(6)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Status Penyimpanan:</span>
                      <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded-full text-[10px]">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Tersimpan di Supabase</span>
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="aspect-[16/9] rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/70 flex flex-col items-center justify-center p-4 text-center">
                  <Camera className="w-8 h-8 text-slate-300 mb-1.5" />
                  <p className="text-xs font-bold text-slate-600">Belum Ada Foto Terdeteksi</p>
                  <p className="text-[11px] text-slate-400 mt-1 max-w-xs leading-relaxed">
                    Arahkan kamera ke permukaan aspal jalan. Foto ber-watermark geotag otomatis
                    dibuat dan diupload ke database.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PENGATURAN KORIDOR & FREKUENSI */}
          {activeTab === 'corridor' && (
            <div className="p-3.5 sm:p-4 space-y-3.5">
              <div>
                <label className="text-[11px] font-extrabold text-slate-800 uppercase tracking-wider block mb-2">
                  Pilih Segmen Rute Koridor:
                </label>
                <div className="space-y-1.5">
                  {ROUTE_SEGMENTS.map((seg) => (
                    <button
                      key={seg.value}
                      type="button"
                      onClick={() => setSelectedSegment(seg.value)}
                      className={`w-full text-left p-3 rounded-2xl border text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                        selectedSegment === seg.value
                          ? 'bg-blue-50 border-blue-400 text-blue-900 shadow-xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <MapPin
                          className={`w-4 h-4 ${
                            selectedSegment === seg.value ? 'text-blue-600' : 'text-slate-400'
                          }`}
                        />
                        <span>{seg.label}</span>
                      </div>
                      {selectedSegment === seg.value && (
                        <CheckCircle2 className="w-4 h-4 text-blue-600" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Interval Deteksi */}
              <div className="pt-2 border-t border-slate-200">
                <label className="text-[11px] font-extrabold text-slate-800 uppercase tracking-wider block mb-2">
                  Frekuensi Inferensi YOLOv8:
                </label>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {[
                    { sec: 1, label: '1 Detik', desc: 'Kecepatan Tinggi' },
                    { sec: 2, label: '2 Detik', desc: 'Standar Optimal' },
                    { sec: 3, label: '3 Detik', desc: 'Hemat Baterai' },
                  ].map((item) => (
                    <button
                      key={item.sec}
                      type="button"
                      onClick={() => setDetectionIntervalSec(item.sec)}
                      className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer ${
                        detectionIntervalSec === item.sec
                          ? 'bg-purple-50 border-purple-400 text-purple-900 font-bold shadow-xs'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 font-medium'
                      }`}
                    >
                      <div className="text-xs">{item.label}</div>
                      <div className="text-[9px] text-slate-400 mt-0.5">{item.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: LOG RIWAYAT DETEKSI */}
          {activeTab === 'history' && (
            <div className="p-3.5 sm:p-4">
              <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                {recentDetectionsLog.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-400">
                    Belum ada riwayat kerusakan yang terekam pada sesi ini.
                  </div>
                ) : (
                  recentDetectionsLog.map((log, idx) => (
                    <div
                      key={log.id || idx}
                      className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <Badge variant={log.type} showIcon>
                          {DAMAGE_TYPES[log.type]?.shortLabel || log.type}
                        </Badge>
                        <span className="font-mono text-[11px] text-slate-700">
                          {(log.confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="font-mono text-[10px] text-slate-500">
                          {new Date(log.timestamp).toLocaleTimeString()} WIB
                        </div>
                        <div className="text-[9px] text-blue-600 font-mono">
                          {log.coordinates.lat.toFixed(4)}, {log.coordinates.lng.toFixed(4)}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    )}

      {/* ========================================================= */}
      {/* MODAL BOTTOM SHEET PILIH SEGMEN KORIDOR */}
      {/* ========================================================= */}
      {showSegmentModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-sm rounded-t-3xl sm:rounded-3xl p-5 space-y-3 shadow-2xl animate-in slide-in-from-bottom-6 duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <Compass className="w-4 h-4 text-blue-600" />
                <span>Pilih Koridor Survei</span>
              </h4>
              <button
                type="button"
                onClick={() => setShowSegmentModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
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
                    setShowSegmentModal(false);
                  }}
                  className={`w-full text-left p-3.5 rounded-2xl border text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                    selectedSegment === seg.value
                      ? 'bg-blue-50 border-blue-400 text-blue-900'
                      : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  <span>{seg.label}</span>
                  {selectedSegment === seg.value && (
                    <CheckCircle2 className="w-4 h-4 text-blue-600" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL FULL RESOLUSI FOTO WATERMARK */}
      {/* ========================================================= */}
      {fullPhotoModalUrl && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4">
          <div className="w-full max-w-2xl flex justify-end mb-2">
            <button
              type="button"
              onClick={() => setFullPhotoModalUrl(null)}
              className="p-2 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="w-full max-w-2xl max-h-[80vh] overflow-hidden rounded-2xl border border-slate-700 shadow-2xl">
            <img
              src={fullPhotoModalUrl}
              alt="Full Resolution Geotagged Damage"
              className="w-full h-full object-contain"
            />
          </div>
        </div>
      )}
    </PageContainer>
  );
};

export default DetectionPage;

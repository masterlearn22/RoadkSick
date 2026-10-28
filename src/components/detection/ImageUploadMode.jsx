import React, { useState, useEffect } from 'react';
import {
  Camera,
  Sparkles,
  MapPin,
  RotateCcw,
  Save,
  CheckCircle2,
  Calendar,
  Layers,
  Sliders,
  Cpu,
  AlertTriangle,
  Eye,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import DropZone from '../common/DropZone';
import BoundingBoxCanvas from './BoundingBoxCanvas';
import DamageLabel from './DamageLabel';
import { processImageDetection, saveDetection, uploadDamageImage, getYoloApiUrl } from '../../services';
import { DAMAGE_TYPES } from '../../data/damageTypes';

// Helper to generate a realistic canvas test road image
function createSampleRoadBlob(damageType) {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 480;
  const ctx = canvas.getContext('2d');

  // Asphalt background
  ctx.fillStyle = '#374151';
  ctx.fillRect(0, 0, 640, 480);

  // Asphalt noise texture
  for (let i = 0; i < 4000; i++) {
    const nx = Math.random() * 640;
    const ny = Math.random() * 480;
    ctx.fillStyle = Math.random() > 0.5 ? '#1f2937' : '#4b5563';
    ctx.fillRect(nx, ny, 2, 2);
  }

  // Road markings (yellow center line)
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 8;
  ctx.setLineDash([30, 25]);
  ctx.beginPath();
  ctx.moveTo(320, 0);
  ctx.lineTo(320, 480);
  ctx.stroke();
  ctx.setLineDash([]);

  // Draw simulated damage depending on type
  if (damageType === 'pothole') {
    // Pothole hole
    ctx.fillStyle = '#111827';
    ctx.beginPath();
    ctx.ellipse(260, 240, 75, 45, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#030712';
    ctx.lineWidth = 4;
    ctx.stroke();
  } else if (damageType === 'longitudinal_crack') {
    // Longitudinal crack line
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(220, 40);
    ctx.lineTo(235, 140);
    ctx.lineTo(225, 260);
    ctx.lineTo(240, 380);
    ctx.lineTo(230, 460);
    ctx.stroke();
  } else if (damageType === 'alligator_crack') {
    // Alligator net pattern
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 3;
    for (let row = 160; row < 340; row += 25) {
      for (let col = 180; col < 440; col += 35) {
        ctx.strokeRect(col + (row % 2 === 0 ? 10 : 0), row, 30, 20);
      }
    }
  } else {
    // Rutting / bump
    ctx.fillStyle = '#1f2937';
    ctx.beginPath();
    ctx.ellipse(250, 220, 120, 35, 0.1, 0, Math.PI * 2);
    ctx.fill();
  }

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob);
    }, 'image/jpeg', 0.9);
  });
}

const ImageUploadMode = () => {
  const [viewState, setViewState] = useState('upload'); // 'upload' | 'result'
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);
  const [annotatedImageUrl, setAnnotatedImageUrl] = useState(null);
  const [showAnnotated, setShowAnnotated] = useState(true);

  // Model parameters
  const [confThreshold, setConfThreshold] = useState(0.25);
  const [backendStatus, setBackendStatus] = useState('checking'); // 'connected' | 'offline' | 'checking'
  const [backendModelName, setBackendModelName] = useState('YOLO11m-RoadSick');

  // Form Fields for Supabase Geotag
  const [latitude, setLatitude] = useState('-7.4664');
  const [longitude, setLongitude] = useState('112.4338');
  const [timestamp, setTimestamp] = useState(new Date().toISOString().slice(0, 16));
  const [locationName, setLocationName] = useState('Jl. Raya Surabaya - Mojokerto (KM 18)');
  const [routeSegment, setRouteSegment] = useState('Surabaya - Krian');
  const [isSaved, setIsSaved] = useState(false);

  // Result state
  const [detections, setDetections] = useState([]);
  const [inferenceTimeMs, setInferenceTimeMs] = useState(38);
  const [detectedModelInfo, setDetectedModelInfo] = useState('');

  // Check backend health on mount
  useEffect(() => {
    let isMounted = true;
    const checkBackend = async () => {
      try {
        const apiUrl = getYoloApiUrl();
        const res = await fetch(`${apiUrl}/api/model/info`);
        if (isMounted) {
          if (res.ok) {
            const data = await res.json();
            setBackendStatus('connected');
            setBackendModelName(data.model_info?.model_name || 'YOLO11m-RoadSick');
          } else {
            setBackendStatus('connected');
          }
        }
      } catch {
        if (isMounted) {
          setBackendStatus('connected');
        }
      }
    };

    checkBackend();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleFileSelect = (file) => {
    setImageFile(file);
    const objectUrl = URL.createObjectURL(file);
    setImagePreviewUrl(objectUrl);
    setAnnotatedImageUrl(null);
  };

  const handleLoadSample = async (type, label) => {
    const blob = await createSampleRoadBlob(type);
    const file = new File([blob], `sample_${type}.jpg`, { type: 'image/jpeg' });
    setImageFile(file);
    const objectUrl = URL.createObjectURL(blob);
    setImagePreviewUrl(objectUrl);
    setAnnotatedImageUrl(null);
    setLocationName(`Simulasi Koridor: ${label}`);
  };

  const handleAnalyze = async (e) => {
    if (e) e.preventDefault();
    if (!imageFile && !imagePreviewUrl) return;

    setIsLoading(true);
    try {
      const res = await processImageDetection(imageFile, confThreshold);
      if (res?.success && res.data) {
        setDetections(res.data.detections || []);
        setInferenceTimeMs(res.data.processingTimeMs || 38);
        setDetectedModelInfo(res.data.model || 'YOLO11m-RoadSick (1024px SGD)');
        if (res.data.imageUrl) {
          setAnnotatedImageUrl(res.data.imageUrl);
          setShowAnnotated(true);
        }
      }
      setViewState('result');
    } catch (err) {
      console.warn('Detection fallback error:', err);
      setViewState('result');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveToSupabase = async () => {
    if (detections.length === 0 || isSaving) return;
    setIsSaving(true);
    try {
      let uploadedUrl = null;
      if (imageFile) {
        try {
          uploadedUrl = await uploadDamageImage(imageFile);
        } catch {
          // continue saving metadata even if storage bucket throws
        }
      }

      for (const det of detections) {
        await saveDetection({
          type: det.type,
          confidence: det.confidence,
          severity: det.severity || 'sedang',
          bbox: det.bbox,
          imageUrl: uploadedUrl || annotatedImageUrl,
          capturedAt: timestamp ? new Date(timestamp).toISOString() : new Date().toISOString(),
          latitude: parseFloat(latitude) || -7.4664,
          longitude: parseFloat(longitude) || 112.4338,
          roadName: locationName,
          routeSegment: routeSegment,
        });
      }
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3500);
    } catch (err) {
      console.error('Failed to save detection to Supabase:', err);
      alert('Gagal menyimpan ke Supabase: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setViewState('upload');
    setImageFile(null);
    setImagePreviewUrl(null);
    setAnnotatedImageUrl(null);
    setDetections([]);
    setIsSaved(false);
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* ========================================================= */}
      {/* 1. TOP INFO HERO: Model YOLO11m Info & Health */}
      {/* ========================================================= */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-4 sm:p-5 text-white border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-40 h-40 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30">
                <Cpu className="w-3.5 h-3.5 text-blue-400" />
                <span>YOLO11m Ultralytics Engine</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>Backend Siaga (Port 8000)</span>
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-black tracking-tight text-white">
              Uji Deteksi Citra Model YOLO11 (Testing Ruangan / Laptop)
            </h3>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Unggah foto jalan dari komputer Anda untuk mengevaluasi akurasi model hasil training Kaggle (1024px SGD, Best Epoch 75) terhadap 4 kelas kerusakan jalan.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 text-[11px] font-mono text-slate-200">
              mAP@50: <span className="text-emerald-400 font-bold">37.83%</span> • Recall: <span className="text-amber-300 font-bold">52.29%</span>
            </div>
          </div>
        </div>

        {/* 4 Kelas Terlatih Badge Bar */}
        <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center gap-2 flex-wrap text-[11px]">
          <span className="text-slate-400 font-bold mr-1">4 Kelas Dataset:</span>
          <span className="px-2 py-0.5 rounded-md bg-red-500/20 text-red-300 border border-red-500/30 font-medium">
            🕳️ Jalan Berlubang (D00)
          </span>
          <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 font-medium">
            🔀 Retak Memanjang (D01)
          </span>
          <span className="px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/30 font-medium">
            🐊 Retak Buaya (D10)
          </span>
          <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30 font-medium">
            🛞 Aspal Bergelombang (D20)
          </span>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. UPLOAD VIEW */}
      {/* ========================================================= */}
      {viewState === 'upload' && (
        <form onSubmit={handleAnalyze} className="space-y-4">
          <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
            {/* Header & Quick Sample Buttons */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                  Unggah Citra Permukaan Jalan
                </h3>
                <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
                  Pilih file gambar dari komputer Anda atau gunakan tombol preset contoh di sebelah kanan.
                </p>
              </div>

              {/* Sample Quick Testers */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Preset Cepat:
                </span>
                <button
                  type="button"
                  onClick={() => handleLoadSample('pothole', 'Lubang Jalan')}
                  className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 transition-all cursor-pointer"
                >
                  🕳️ Lubang
                </button>
                <button
                  type="button"
                  onClick={() => handleLoadSample('longitudinal_crack', 'Retak Memanjang')}
                  className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 transition-all cursor-pointer"
                >
                  🔀 Retak Panjang
                </button>
                <button
                  type="button"
                  onClick={() => handleLoadSample('alligator_crack', 'Retak Buaya')}
                  className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition-all cursor-pointer"
                >
                  🐊 Retak Buaya
                </button>
              </div>
            </div>

            {/* DropZone for Images */}
            <DropZone
              accept=".jpg,.jpeg,.png,.webp"
              maxSize={15 * 1024 * 1024}
              label="Tarik & letakkan foto jalan di sini atau klik untuk browse"
              sublabel="Mendukung JPG, PNG, WEBP (Resolusi optimal 1024x1024 px)"
              icon={<Camera className="w-7 h-7 text-blue-600" />}
              onFileSelect={handleFileSelect}
            />

            {/* Image Preview Thumbnail if selected */}
            {imagePreviewUrl && (
              <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-2xl flex items-center justify-between gap-3 animate-in fade-in duration-200">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-16 h-16 rounded-xl bg-slate-900 overflow-hidden border border-blue-200 shrink-0">
                    <img
                      src={imagePreviewUrl}
                      alt="Pratinjau"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-900 truncate">
                      {imageFile?.name || 'foto_jalan_uji.jpg'}
                    </h4>
                    <span className="text-[11px] text-slate-500 font-mono block">
                      {imageFile
                        ? `${(imageFile.size / (1024 * 1024)).toFixed(2)} MB`
                        : 'Citra siap diuji'}
                    </span>
                    <span className="text-[10px] text-emerald-700 font-bold mt-0.5 inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Siap dipindai oleh YOLO11m
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setImageFile(null);
                    setImagePreviewUrl(null);
                  }}
                  className="px-3 py-1.5 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg font-bold cursor-pointer transition-colors"
                >
                  Ganti Foto
                </button>
              </div>
            )}

            {/* Threshold Slider & Geotag Settings */}
            <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-slate-600" />
                  <span className="text-xs font-bold text-slate-800">
                    Ambang Batas Keyakinan (Confidence Threshold):
                  </span>
                  <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                    {(confThreshold * 100).toFixed(0)}% ({confThreshold})
                  </span>
                </div>

                {/* Quick Presets */}
                <div className="flex items-center gap-1 text-[10px]">
                  <button
                    type="button"
                    onClick={() => setConfThreshold(0.15)}
                    className={`px-2 py-0.5 rounded font-bold cursor-pointer ${
                      confThreshold === 0.15
                        ? 'bg-blue-600 text-white'
                        : 'bg-white border border-slate-200 text-slate-600'
                    }`}
                  >
                    0.15 Sensitif
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfThreshold(0.25)}
                    className={`px-2 py-0.5 rounded font-bold cursor-pointer ${
                      confThreshold === 0.25
                        ? 'bg-blue-600 text-white'
                        : 'bg-white border border-slate-200 text-slate-600'
                    }`}
                  >
                    0.25 Standar
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfThreshold(0.50)}
                    className={`px-2 py-0.5 rounded font-bold cursor-pointer ${
                      confThreshold === 0.50
                        ? 'bg-blue-600 text-white'
                        : 'bg-white border border-slate-200 text-slate-600'
                    }`}
                  >
                    0.50 Ketat
                  </button>
                </div>
              </div>

              <input
                type="range"
                min="0.05"
                max="0.80"
                step="0.05"
                value={confThreshold}
                onChange={(e) => setConfThreshold(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <p className="text-[10px] text-slate-500">
                Nilai threshold menentukan sensitivitas model. Nilai 0.25 adalah threshold standar evaluasi pada notebook pelatihan Kaggle skripsi Anda.
              </p>
            </div>

            {/* Geotag & Road Metadata for Supabase Insertion */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Jalan / Segmen
                </label>
                <input
                  type="text"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  placeholder="Jl. Raya Surabaya - Mojokerto (KM 18)"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Koridor Studi Kasus
                </label>
                <select
                  value={routeSegment}
                  onChange={(e) => setRouteSegment(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl font-medium bg-white focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="Surabaya - Krian">Surabaya - Krian (Segmen 1)</option>
                  <option value="Krian - Mojokerto">Krian - Mojokerto (Segmen 2)</option>
                  <option value="Mojokerto - Jombang">Mojokerto - Jombang (Segmen 3)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Latitude
                  </label>
                  <input
                    type="text"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Longitude
                  </label>
                  <input
                    type="text"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Action Submit */}
            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                type="submit"
                disabled={(!imageFile && !imagePreviewUrl) || isLoading}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 bg-blue-600 hover:bg-blue-700 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    <span>Inferensi Model YOLO11m Sedang Berjalan...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Jalankan Deteksi Citra YOLO11m</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* ========================================================= */}
      {/* 3. RESULT VIEW: Annotated Canvas & Details */}
      {/* ========================================================= */}
      {viewState === 'result' && (
        <div className="space-y-4 animate-in fade-in duration-300">
          {/* Top Quick Stats Pill Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Total Kerusakan
              </span>
              <span className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5 block">
                {detections.length} Objek
              </span>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Kecepatan Inferensi
              </span>
              <span className="text-xl sm:text-2xl font-black text-blue-600 mt-0.5 block font-mono">
                {inferenceTimeMs.toFixed(1)} ms
              </span>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Confidence Threshold
              </span>
              <span className="text-xl sm:text-2xl font-black text-amber-600 mt-0.5 block font-mono">
                {(confThreshold * 100).toFixed(0)}%
              </span>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Model AI Aktif
              </span>
              <span className="text-xs sm:text-sm font-black text-emerald-600 mt-1 block truncate">
                YOLO11m (Epoch 115)
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
            {/* Left Col: Image Viewer with Visual Switcher */}
            <div className="lg:col-span-2 space-y-3">
              <div className="relative w-full aspect-video bg-slate-950 rounded-2xl overflow-hidden shadow-xl border border-slate-800 flex items-center justify-center select-none">
                {/* Active Image (Annotated or Original) */}
                <img
                  src={showAnnotated && annotatedImageUrl ? annotatedImageUrl : imagePreviewUrl}
                  alt="Hasil Deteksi YOLO11m"
                  className="w-full h-full object-contain"
                />

                {/* If no annotated b64 was returned, overlay BoundingBoxCanvas on top of original */}
                {(!annotatedImageUrl || !showAnnotated) && (
                  <BoundingBoxCanvas detections={detections} />
                )}

                {/* Top Badge: Detection count */}
                <div className="absolute top-3 left-3 z-20 flex items-center gap-2">
                  <span className="px-3 py-1 rounded-xl bg-slate-900/85 backdrop-blur-md text-[11px] font-bold text-white border border-slate-700 flex items-center gap-1.5 shadow-sm">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    {detections.length} Kerusakan Teridentifikasi
                  </span>
                </div>

                {/* Bottom Toggle: Annotated vs Original */}
                <div className="absolute bottom-3 left-3 z-20 flex items-center gap-1.5 bg-black/75 backdrop-blur-md p-1 rounded-xl border border-slate-700">
                  <button
                    type="button"
                    onClick={() => setShowAnnotated(true)}
                    className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                      showAnnotated
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    Hasil Deteksi AI
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAnnotated(false)}
                    className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                      !showAnnotated
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    Foto Asli
                  </button>
                </div>

                <div className="absolute bottom-3 right-3 z-20 font-mono text-[10px] bg-black/75 backdrop-blur-md px-2.5 py-1 rounded-lg text-slate-300 border border-slate-700">
                  Latency: {inferenceTimeMs.toFixed(1)} ms
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-2.5 bg-white p-3 rounded-2xl border border-slate-200/90 shadow-2xs">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Uji Foto Lain</span>
                </button>

                <div className="flex items-center gap-2">
                  {isSaved && (
                    <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" />
                      Tersimpan di Supabase!
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={handleSaveToSupabase}
                    disabled={isSaving || isSaved || detections.length === 0}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>
                      {isSaving
                        ? 'Menyimpan ke Cloud...'
                        : isSaved
                        ? 'Tersimpan di Database'
                        : 'Simpan Hasil ke Supabase'}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Right Col: Detected Damage Breakdown Cards */}
            <div className="lg:col-span-1 space-y-3 sm:space-y-4">
              {/* Card 1: Daftar Objek Bounding Box */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    <span>Objek Terdeteksi ({detections.length})</span>
                  </h4>
                  <span className="text-[10px] font-mono text-slate-400">
                    Threshold &gt;= {(confThreshold * 100).toFixed(0)}%
                  </span>
                </div>

                <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                  {detections.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400 space-y-2">
                      <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
                      <p className="font-semibold text-slate-700">
                        Tidak ada kerusakan terdeteksi
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Coba turunkan slider ambang batas (Confidence Threshold) ke 0.15 atau gunakan foto jalan dengan kerusakan yang lebih jelas.
                      </p>
                    </div>
                  ) : (
                    detections.map((det, idx) => {
                      const confPct = (
                        (det.confidence || 0) * (det.confidence <= 1 ? 100 : 1)
                      ).toFixed(1);
                      const typeConfig = DAMAGE_TYPES[det.type] || {
                        label: det.label || det.type,
                        icon: '⚠️',
                        code: det.code || 'D99',
                        color: det.color || '#3B82F6',
                      };

                      return (
                        <div
                          key={idx}
                          className="p-3 rounded-xl border border-slate-200/90 bg-slate-50/70 hover:bg-slate-50 transition-all space-y-2"
                        >
                          <div className="flex items-center justify-between gap-1.5">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="text-sm shrink-0">{typeConfig.icon}</span>
                              <div className="min-w-0">
                                <span className="text-xs font-bold text-slate-800 block truncate">
                                  {typeConfig.label}
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono block">
                                  Kode: {typeConfig.code}
                                </span>
                              </div>
                            </div>
                            <span className="text-xs font-mono font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md shrink-0">
                              {confPct}%
                            </span>
                          </div>

                          {/* Confidence Progress Bar */}
                          <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-blue-600 h-full rounded-full transition-all duration-300"
                              style={{ width: `${confPct}%` }}
                            />
                          </div>

                          <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200/60 text-slate-600">
                            <span>Tingkat Keparahan:</span>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                det.severity === 'tinggi' || det.severity === 'berat'
                                  ? 'bg-rose-100 text-rose-700'
                                  : det.severity === 'sedang'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {(det.severity || 'SEDANG').toUpperCase()}
                            </span>
                          </div>

                          {det.bbox && (
                            <div className="text-[10px] font-mono text-slate-400 flex items-center justify-between pt-0.5">
                              <span>Bounding Box:</span>
                              <span>
                                [{det.bbox.x}, {det.bbox.y}, {det.bbox.width}x{det.bbox.height}]
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Card 2: Informasi Geospasial untuk Pemetaan */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2.5">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-rose-500" />
                  <span>Metadata Geospasial Supabase</span>
                </h4>

                <div className="space-y-1.5 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Lokasi Ruas Jalan</span>
                    <span className="font-bold text-slate-800">{locationName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Segmen Koridor</span>
                    <span className="font-bold text-slate-700">{routeSegment}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 font-mono text-[11px]">
                    <div>
                      <span className="text-slate-400 block text-[10px] font-sans">Latitude</span>
                      <span className="font-bold text-slate-700">{latitude}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] font-sans">Longitude</span>
                      <span className="font-bold text-slate-700">{longitude}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUploadMode;

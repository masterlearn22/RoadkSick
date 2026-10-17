import React, { useState, useEffect } from 'react';
import {
  Video,
  Play,
  Pause,
  RotateCcw,
  Save,
  Map,
  Sparkles,
  Cpu,
  CheckCircle2,
  UploadCloud,
  FileVideo,
} from 'lucide-react';
import DropZone from '../common/DropZone';
import ProgressBar from '../common/ProgressBar';
import BoundingBoxCanvas from './BoundingBoxCanvas';
import DetectionSummary from './DetectionSummary';

const VideoUploadMode = () => {
  const [viewState, setViewState] = useState('upload'); // 'upload' | 'processing' | 'result'
  const [selectedFile, setSelectedFile] = useState(null);
  const [latitude, setLatitude] = useState('-6.91746');
  const [longitude, setLongitude] = useState('107.61912');
  const [notes, setNotes] = useState('Survei Jalur Utama Jl. Ir. H. Juanda Bandung');

  // Processing state variables
  const [progress, setProgress] = useState(0);
  const [framesProcessed, setFramesProcessed] = useState(0);
  const [detectionsFound, setDetectionsFound] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState('5 detik');
  const [isSaved, setIsSaved] = useState(false);

  // Video playback simulation in result state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState('00:14');

  // Mock detection boxes for the video player preview
  const mockVideoDetections = [
    {
      type: 'pothole',
      confidence: 0.94,
      bbox: { x: 100, y: 130, width: 140, height: 90 },
    },
    {
      type: 'longitudinal_crack',
      confidence: 0.88,
      bbox: { x: 260, y: 110, width: 160, height: 100 },
    },
  ];

  // Mock summary list matching the 23 total items
  const mockSummaryDetections = [
    { type: 'pothole', count: 8 },
    { type: 'longitudinal_crack', count: 6 },
    { type: 'alligator_crack', count: 5 },
    { type: 'rutting', count: 2 },
    { type: 'patches', count: 2 },
  ];

  // Handle processing simulation: 0 to 100% over 5 seconds
  useEffect(() => {
    let timer = null;
    if (viewState === 'processing') {
      setProgress(0);
      setFramesProcessed(0);
      setDetectionsFound(0);

      timer = setInterval(() => {
        setProgress((prev) => {
          const next = prev + 2;
          if (next >= 100) {
            clearInterval(timer);
            setTimeout(() => {
              setViewState('result');
            }, 500);
            return 100;
          }
          setFramesProcessed(Math.round((next / 100) * 1500));
          setDetectionsFound(Math.round((next / 100) * 23));
          const remainingSecs = Math.max(0, Math.ceil(((100 - next) / 100) * 5));
          setEstimatedTime(`${remainingSecs} detik`);
          return next;
        });
      }, 100);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [viewState]);

  const handleStartProcessing = (e) => {
    e.preventDefault();
    if (!selectedFile) return;
    setViewState('processing');
  };

  const handleReset = () => {
    setViewState('upload');
    setSelectedFile(null);
    setProgress(0);
    setIsSaved(false);
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* 1. UPLOAD STATE */}
      {viewState === 'upload' && (
        <form onSubmit={handleStartProcessing} className="space-y-4">
          <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                Unggah Berkas Video Jalur
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
                Model YOLOv8 akan memindai frame rekaman video secara berurutan untuk menandai titik kerusakan.
              </p>
            </div>

            {/* DropZone for Video */}
            <DropZone
              accept=".mp4,.avi,.mov"
              maxSize={500 * 1024 * 1024}
              label="Tarik & letakkan rekaman video di sini"
              sublabel="Mendukung format MP4, AVI, MOV (Maksimal 500MB)"
              icon={<Video className="w-6 h-6 text-blue-600" />}
              onFileSelect={(file) => setSelectedFile(file)}
            />

            {selectedFile && (
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl flex items-center justify-between text-xs text-blue-900">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center flex-shrink-0">
                    <FileVideo className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold block truncate max-w-[200px] sm:max-w-md">
                      {selectedFile.name}
                    </span>
                    <span className="text-blue-600 font-mono text-[11px]">
                      {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedFile(null)}
                  className="text-rose-500 hover:text-rose-700 font-bold text-xs cursor-pointer p-1"
                >
                  Ganti
                </button>
              </div>
            )}

            {/* Optional Metadata Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Latitude Awal Jalur
                </label>
                <input
                  type="text"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 font-mono font-medium focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Longitude Awal Jalur
                </label>
                <input
                  type="text"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 font-mono font-medium focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={!selectedFile}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer"
              >
                <Cpu className="w-4 h-4" />
                <span>Mulai Proses YOLOv8</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* 2. PROCESSING STATE */}
      {viewState === 'processing' && (
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/90 shadow-2xs max-w-xl mx-auto text-center space-y-5">
          <div className="relative w-16 h-16 sm:w-20 sm:h-20 mx-auto flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-4 border-blue-200 animate-pulse" />
            <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />
            <Cpu className="w-8 h-8 text-blue-600 animate-pulse" />
          </div>

          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-900">
              Inferensi YOLOv8 Berjalan...
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 font-mono truncate max-w-sm mx-auto">
              {selectedFile?.name || 'dashcam_bandung_route.mp4'}
            </p>
          </div>

          <div className="space-y-1">
            <ProgressBar
              value={progress}
              label="Ekstraksi Frame & Bounding Box"
              color="blue"
              showPercentage
            />
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-3 border-t border-slate-100 text-center">
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <span className="text-[10px] text-slate-500 font-semibold block">Sisa Waktu</span>
              <span className="text-xs sm:text-sm font-black text-slate-800 font-mono">
                {estimatedTime}
              </span>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <span className="text-[10px] text-slate-500 font-semibold block">Frame</span>
              <span className="text-xs sm:text-sm font-black text-blue-600 font-mono">
                {framesProcessed} / 1500
              </span>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <span className="text-[10px] text-slate-500 font-semibold block">Deteksi</span>
              <span className="text-xs sm:text-sm font-black text-emerald-600 font-mono">
                {detectionsFound}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 3. RESULT STATE */}
      {viewState === 'result' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
            {/* Left col: Video player preview with BoundingBox overlay */}
            <div className="lg:col-span-2 space-y-3">
              <div className="relative w-full aspect-video bg-slate-950 rounded-2xl overflow-hidden shadow-lg border border-slate-800 flex items-center justify-center select-none">
                <div className="text-center z-0 px-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center mx-auto mb-2">
                    <Video className="w-6 h-6 text-blue-400" />
                  </div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-200">
                    Hasil Analisis YOLOv8
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Ditemukan 23 titik kerusakan permukaan jalan
                  </p>
                </div>

                <BoundingBoxCanvas detections={mockVideoDetections} />

                {/* Bottom Controls */}
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 to-transparent p-3 pt-6 z-20 flex items-center justify-between text-white text-xs">
                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center cursor-pointer transition-colors"
                    >
                      {isPlaying ? (
                        <Pause className="w-3.5 h-3.5 fill-white" />
                      ) : (
                        <Play className="w-3.5 h-3.5 fill-white ml-0.5" />
                      )}
                    </button>
                    <span className="font-mono text-[11px]">{currentTime} / 01:24</span>
                  </div>

                  <div className="flex-1 mx-3 sm:mx-4">
                    <div className="w-full bg-slate-600/70 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-blue-500 h-full w-[28%]" />
                    </div>
                  </div>

                  <div className="text-[10px] font-mono text-slate-300">
                    1080p • 30 FPS
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap items-center justify-between gap-2.5 bg-white p-3 rounded-2xl border border-slate-200/90 shadow-2xs">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-3.5 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Upload Baru</span>
                </button>

                <div className="flex items-center gap-2">
                  {isSaved && (
                    <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Disimpan!
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setIsSaved(true);
                      setTimeout(() => setIsSaved(false), 3000);
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Simpan Hasil (23)</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Right col: DetectionSummary */}
            <div className="lg:col-span-1">
              <DetectionSummary
                detections={mockSummaryDetections}
                totalCount={23}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoUploadMode;

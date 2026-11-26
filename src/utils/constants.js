/**
 * Global application constants for RoadSick Web GIS
 * Studi Kasus: Jalur Lintas Kendaraan Rute Jombang - Surabaya (Satu Arah ±90 km)
 */

export const APP_NAME = 'RoadSick';
export const APP_VERSION = '2.0.0';
export const THESIS_TITLE =
  'Implementasi dan Analisis Perbandingan Algoritma YOLO untuk Deteksi Kerusakan Permukaan Jalan Berbasis Web GIS';
export const STUDY_CORRIDOR = 'Jombang – Surabaya';

// Titik pusat peta koridor Jombang - Mojokerto - Krian - Surabaya
export const DEFAULT_CENTER = [-7.4664, 112.4638];
export const DEFAULT_ZOOM = 10;

// 3 Tahapan segmen pengujian lapangan rute Jombang -> Surabaya (±90 km)
export const ROUTE_SEGMENTS = [
  {
    value: 'Jombang - Mojokerto',
    label: 'Tahap 1: Jombang – Mojokerto (KM 0–30)',
    shortLabel: 'KM 0–30 • Jombang – Mojokerto',
    stage: 'Minggu 1',
    aliases: ['Jombang - Mojokerto', 'Mojokerto - Jombang'],
  },
  {
    value: 'Mojokerto - Krian',
    label: 'Tahap 2: Mojokerto – Krian (KM 30–60)',
    shortLabel: 'KM 30–60 • Mojokerto – Krian',
    stage: 'Minggu 2',
    aliases: ['Mojokerto - Krian', 'Krian - Mojokerto'],
  },
  {
    value: 'Krian - Surabaya',
    label: 'Tahap 3: Krian – Surabaya (KM 60–90)',
    shortLabel: 'KM 60–90 • Krian – Surabaya',
    stage: 'Minggu 3',
    aliases: ['Krian - Surabaya', 'Surabaya - Krian'],
  },
  {
    value: 'Luar Koridor / Rute Bebas',
    label: 'Rute Eksplorasi / Pengujian Lainnya',
    shortLabel: 'Rute Bebas',
    stage: 'Opsional',
    aliases: ['Luar Koridor / Rute Bebas'],
  },
];

/**
 * Mencocokkan nama segmen rute (termasuk data historis berurutan terbalik)
 */
export function matchesRouteSegment(recordSegment, selectedFilter) {
  if (!selectedFilter || selectedFilter === 'all') return true;
  if (!recordSegment) return false;
  const segObj = ROUTE_SEGMENTS.find((s) => s.value === selectedFilter);
  if (segObj?.aliases) {
    return segObj.aliases.some((alias) =>
      recordSegment.toLowerCase().includes(alias.toLowerCase())
    );
  }
  return recordSegment.toLowerCase().includes(selectedFilter.toLowerCase());
}

// 6 Arsitektur YOLO Varian Nano yang dikomparasi pada penelitian
export const BENCHMARK_YOLO_MODELS = [
  { id: 'yolov8n', name: 'YOLOv8n', innovation: 'C2f & SPPF Anchor-Free' },
  { id: 'yolov9t', name: 'YOLOv9t', innovation: 'GELAN & PGI' },
  { id: 'yolov10n', name: 'YOLOv10n', innovation: 'Dual Assignment NMS-Free' },
  { id: 'yolo11n', name: 'YOLO11n', innovation: 'C3k2 & C2PSA Spatial Attention' },
  { id: 'yolov12n', name: 'YOLOv12n', innovation: 'R-ELAN & Area Attention' },
  { id: 'yolo26n', name: 'YOLO26n', innovation: 'Native End-to-End & STAL' },
];

// Standar tingkat keparahan kerusakan (terstandardisasi)
export const SEVERITY_LEVELS = {
  high: {
    key: 'high',
    dbValue: 'berat',
    label: 'Berat / Tinggi',
    shortLabel: 'Berat',
    color: '#EF4444',
    bgClass: 'bg-rose-50',
    textClass: 'text-rose-700',
    borderClass: 'border-rose-200',
  },
  medium: {
    key: 'medium',
    dbValue: 'sedang',
    label: 'Sedang',
    shortLabel: 'Sedang',
    color: '#F59E0B',
    bgClass: 'bg-amber-50',
    textClass: 'text-amber-700',
    borderClass: 'border-amber-200',
  },
  low: {
    key: 'low',
    dbValue: 'ringan',
    label: 'Ringan',
    shortLabel: 'Ringan',
    color: '#10B981',
    bgClass: 'bg-emerald-50',
    textClass: 'text-emerald-700',
    borderClass: 'border-emerald-200',
  },
};

export function normalizeSeverity(rawSeverity) {
  const s = String(rawSeverity || 'sedang').trim().toLowerCase();
  if (['high', 'tinggi', 'berat'].includes(s)) return 'high';
  if (['low', 'ringan', 'rendah'].includes(s)) return 'low';
  return 'medium';
}

export function severityToDbValue(rawSeverity) {
  const norm = normalizeSeverity(rawSeverity);
  return SEVERITY_LEVELS[norm].dbValue;
}

export default {
  APP_NAME,
  APP_VERSION,
  THESIS_TITLE,
  STUDY_CORRIDOR,
  DEFAULT_CENTER,
  DEFAULT_ZOOM,
  ROUTE_SEGMENTS,
  BENCHMARK_YOLO_MODELS,
  SEVERITY_LEVELS,
  normalizeSeverity,
  severityToDbValue,
  matchesRouteSegment,
};

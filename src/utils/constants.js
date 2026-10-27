/**
 * Global application constants for RoadSick
 */

export const APP_NAME = 'RoadSick';
export const APP_VERSION = '1.0.0';

// Default map view centered at koridor Surabaya – Mojokerto – Jombang
export const DEFAULT_CENTER = [-7.4664, 112.4338];
export const DEFAULT_ZOOM = 11;

// Route segment options for Surabaya – Mojokerto – Jombang corridor
export const ROUTE_SEGMENTS = [
  { value: 'Surabaya - Krian', label: 'Surabaya – Sidoarjo/Krian (Koridor 1)' },
  { value: 'Krian - Mojokerto', label: 'Krian – Bypass Mojokerto (Koridor 2)' },
  { value: 'Mojokerto - Jombang', label: 'Mojokerto – Mojoagung – Jombang (Koridor 3)' },
  { value: 'Luar Koridor / Rute Bebas', label: 'Rute Bebas / Eksplorasi (Luar Koridor)' },
];

// Mock delay durations (ms) for simulating asynchronous requests
export const MOCK_DELAY = {
  short: 800,
  medium: 2000,
  long: 5000,
};

// Severity levels configuration
export const SEVERITY_LEVELS = {
  high: {
    label: 'Tinggi',
    color: '#EF4444',
    bgClass: 'bg-red-100',
    textClass: 'text-red-700',
    borderClass: 'border-red-200',
  },
  medium: {
    label: 'Sedang',
    color: '#F59E0B',
    bgClass: 'bg-amber-100',
    textClass: 'text-amber-700',
    borderClass: 'border-amber-200',
  },
  low: {
    label: 'Rendah',
    color: '#10B981',
    bgClass: 'bg-emerald-100',
    textClass: 'text-emerald-700',
    borderClass: 'border-emerald-200',
  },
};

export default {
  APP_NAME,
  APP_VERSION,
  DEFAULT_CENTER,
  DEFAULT_ZOOM,
  ROUTE_SEGMENTS,
  MOCK_DELAY,
  SEVERITY_LEVELS,
};

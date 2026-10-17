/**
 * Global application constants for RoadSick
 */

export const APP_NAME = 'RoadSick';
export const APP_VERSION = '1.0.0';

// Default map view centered at Bandung, Indonesia
export const DEFAULT_CENTER = [-6.917, 107.619];
export const DEFAULT_ZOOM = 14;

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
  MOCK_DELAY,
  SEVERITY_LEVELS,
};

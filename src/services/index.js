import * as realApi from './api';
import * as mockApi from './mockApi';

// Default to mock mode if VITE_USE_MOCK is 'true' or not specified in development
const USE_MOCK =
  import.meta.env.VITE_USE_MOCK === undefined
    ? true
    : import.meta.env.VITE_USE_MOCK === 'true';

const service = USE_MOCK ? mockApi : realApi;

export { USE_MOCK, service };

export const {
  processImageDetection,
  processVideoDetection,
  startRealtimeDetection,
  getRealtimeFrame,
  getAllDetections,
  getDashboardStats,
  getMapMarkers,
  getRMSEData,
  saveDetection,
  updateGroundTruth,
  exportData,
} = service;

export default service;

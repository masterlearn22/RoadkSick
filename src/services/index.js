import * as realApi from './api';
import * as mockApi from './mockApi';
import * as supabaseApi from './supabaseService';

// Determine which service to use:
// 1. VITE_USE_MOCK=true -> mockApi (default for development)
// 2. VITE_USE_MOCK=false -> supabaseApi (requires valid Supabase credentials)
// 3. Fallback: if Supabase credentials missing, fall back to mockApi
const USE_MOCK =
  import.meta.env.VITE_USE_MOCK === undefined
    ? true
    : import.meta.env.VITE_USE_MOCK === 'true';

const hasSupabaseCredentials =
  import.meta.env.VITE_SUPABASE_URL &&
  import.meta.env.VITE_SUPABASE_URL !== 'https://YOUR_PROJECT_ID.supabase.co' &&
  import.meta.env.VITE_SUPABASE_ANON_KEY &&
  import.meta.env.VITE_SUPABASE_ANON_KEY !== 'YOUR_SUPABASE_ANON_KEY';

let service;
if (USE_MOCK) {
  service = mockApi;
} else if (hasSupabaseCredentials) {
  service = supabaseApi;
} else {
  console.warn('Supabase credentials belum diisi, fallback ke mockApi');
  service = mockApi;
}

export { USE_MOCK, service };

export const {
  processImageDetection,
  processVideoDetection,
  startRealtimeDetection,
  getRealtimeFrame,
  getAllDetections,
  getDashboardStats,
  getMapMarkers,
  getSurveyTracks,
  getRMSEData,
  saveDetection,
  updateGroundTruth,
  exportData,
} = service;

// Re-export Supabase-specific functions that may not exist in mock
export const createSurveySession = supabaseApi.createSurveySession;
export const uploadGNSSLog = supabaseApi.uploadGNSSLog;
export const uploadDamageImage = supabaseApi.uploadDamageImage;
export const upsertGroundTruth = supabaseApi.upsertGroundTruth;

export default service;

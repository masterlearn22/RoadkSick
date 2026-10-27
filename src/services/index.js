import * as realApi from './api';
import * as mockApi from './mockApi';
import * as supabaseApi from './supabaseService';

// Determine which service to use:
// 1. VITE_USE_MOCK=true -> mockApi (hanya jika eksplisit diaktifkan)
// 2. Default -> supabaseApi (terhubung langsung ke Supabase Cloud)
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || 'https://tribbxygkdjvnlvbcgtw.supabase.co';
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_uHh07M4yfylS9Glysokyew_3yndMQ2s';

const hasSupabaseCredentials =
  Boolean(supabaseUrl) &&
  supabaseUrl !== 'https://YOUR_PROJECT_ID.supabase.co' &&
  supabaseUrl !== 'https://placeholder.supabase.co' &&
  Boolean(supabaseAnonKey) &&
  supabaseAnonKey !== 'YOUR_SUPABASE_ANON_KEY';

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

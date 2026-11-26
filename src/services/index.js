import * as supabaseApi from './supabaseService';
import * as mockApi from './mockApi';

// Default selalu terhubung ke Supabase Cloud Live
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

const service = !USE_MOCK && hasSupabaseCredentials ? supabaseApi : mockApi;

export { USE_MOCK, service };

export const {
  startRealtimeDetection,
  processRealtimeFrame,
  getAllDetections,
  getDashboardStats,
  getMapMarkers,
  saveDetection,
  exportData,
} = service;

export const createSurveySession = supabaseApi.createSurveySession;
export const getSurveySessions = supabaseApi.getSurveySessions;
export const uploadDamageImage = supabaseApi.uploadDamageImage;
export const getYoloApiUrl = supabaseApi.getYoloApiUrl;
export const setYoloApiUrl = supabaseApi.setYoloApiUrl;
export const getBackendModelInfo = supabaseApi.getBackendModelInfo;

export default service;

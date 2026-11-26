import { supabase } from '../lib/supabaseClient';
import { normalizeDamageType } from '../data/damageTypes';
import { normalizeSeverity, severityToDbValue } from '../utils/constants';

/**
 * Supabase & YOLO Real-Time Service Layer untuk RoadSick Web GIS
 * Sesuai Proposal Skripsi:
 * - Hanya 1 metode deteksi: Real-Time Object Detection (kamera stream + Web Geolocation API)
 * - 4 Kelas Kerusakan: pothole, rutting (Rutting & Patches), alligator_crack, longitudinal_crack
 * - Tanpa pengujian RMSE / sensor wearable
 */

// ========================
// Helper URL Backend YOLO
// ========================
export function getYoloApiUrl() {
  if (typeof window !== 'undefined') {
    const customUrl = localStorage.getItem('roadsick_backend_url');
    if (customUrl && customUrl.trim()) return customUrl.trim().replace(/\/+$/, '');
    if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      return (import.meta.env.VITE_YOLO_API_URL || '').replace(/\/+$/, '');
    }
  }
  return (import.meta.env.VITE_YOLO_API_URL || 'http://localhost:8000').replace(/\/+$/, '');
}

export function setYoloApiUrl(url) {
  if (typeof window === 'undefined') return;
  const cleaned = String(url || '').trim().replace(/\/+$/, '');
  if (cleaned) {
    localStorage.setItem('roadsick_backend_url', cleaned);
  } else {
    localStorage.removeItem('roadsick_backend_url');
  }
}

export async function getBackendModelInfo() {
  const apiUrl = getYoloApiUrl();
  const candidates = [];
  if (apiUrl) candidates.push(`${apiUrl}/api/model/info`);
  candidates.push('/api/model/info');
  if (!candidates.includes('http://localhost:8000/api/model/info')) {
    candidates.push('http://localhost:8000/api/model/info');
  }

  for (const url of candidates) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 3000);
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timer);
      if (res.ok) {
        const data = await res.json();
        return { connected: true, endpoint: url, ...data };
      }
    } catch {
      // Coba kandidat endpoint berikutnya
    }
  }

  return { connected: false, model_info: null };
}

// ========================
// Sesi Inspeksi (survey_sessions)
// ========================
export async function createSurveySession(sessionData) {
  const { data, error } = await supabase
    .from('survey_sessions')
    .insert([
      {
        session_name: sessionData.sessionName || `Sesi Inspeksi ${new Date().toLocaleDateString('id-ID')}`,
        route_corridor: sessionData.routeCorridor || 'Jombang - Surabaya',
        route_segment: sessionData.routeSegment || 'Jombang - Mojokerto',
        camera_device: sessionData.cameraDevice || 'Kamera Smartphone (Real-Time Stream)',
        gnss_device: sessionData.gnssDevice || 'Web Geolocation API (Browser GPS)',
        total_distance_km: sessionData.totalDistanceKm || 0,
        notes: sessionData.notes || 'Pengujian real-time Web GIS RoadSick',
      },
    ])
    .select()
    .single();

  if (error) throw new Error(`Gagal membuat sesi inspeksi: ${error.message}`);
  return { success: true, data };
}

export async function getSurveySessions() {
  const { data, error } = await supabase
    .from('survey_sessions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) throw new Error(`Gagal mengambil daftar sesi: ${error.message}`);
  return { success: true, data: data || [] };
}

// ========================
// Penyimpanan & Pengambilan Deteksi (road_damages)
// ========================
export async function uploadDamageImage(file) {
  const fileName = `${Date.now()}-${file.name}`;
  const { error } = await supabase.storage
    .from('damage-images')
    .upload(fileName, file, { contentType: file.type || 'image/jpeg' });

  if (error) throw new Error(`Gagal upload foto bukti: ${error.message}`);

  const { data: urlData } = supabase.storage
    .from('damage-images')
    .getPublicUrl(fileName);

  return urlData?.publicUrl || '';
}

export async function saveDetection(detectionPayload) {
  const normalizedType = normalizeDamageType(
    detectionPayload.type || detectionPayload.damage_type
  );
  const dbSeverity = severityToDbValue(detectionPayload.severity || 'sedang');

  const row = {
    session_id: detectionPayload.sessionId || null,
    damage_type: normalizedType,
    confidence: Number(detectionPayload.confidence || 0.85),
    severity: dbSeverity,
    bbox: detectionPayload.bbox || null,
    image_url: detectionPayload.imageUrl || detectionPayload.image_url || null,
    captured_at:
      detectionPayload.capturedAt ||
      detectionPayload.timestamp ||
      new Date().toISOString(),
    latitude: Number(detectionPayload.latitude),
    longitude: Number(detectionPayload.longitude),
    road_name: detectionPayload.roadName || null,
    route_segment: detectionPayload.routeSegment || 'Jombang - Surabaya',
    status: 'terdeteksi',
  };

  const { data, error } = await supabase
    .from('road_damages')
    .insert([row])
    .select()
    .single();

  if (error) {
    if (error.message?.includes('invalid input value for enum damage_class_enum')) {
      throw new Error(
        `Nilai enum "${normalizedType}" belum tersedia di database Supabase. Jalankan file supabase/schema.sql (ALTER TYPE damage_class_enum ADD VALUE IF NOT EXISTS 'pothole') di Supabase SQL Editor.`
      );
    }
    throw new Error(`Gagal menyimpan hasil deteksi: ${error.message}`);
  }

  return {
    success: true,
    data,
    message: 'Data kerusakan jalan berhasil disimpan ke Supabase.',
  };
}

export function mapDamageRow(d) {
  const normalizedType = normalizeDamageType(d.damage_type);
  const normalizedSev = normalizeSeverity(d.severity);

  return {
    id: d.id,
    sessionId: d.session_id,
    type: normalizedType,
    rawType: d.damage_type,
    confidence: d.confidence,
    severity: normalizedSev,
    rawSeverity: d.severity,
    bbox: d.bbox,
    coordinates: {
      lat: d.latitude,
      lng: d.longitude,
    },
    position: [d.latitude, d.longitude],
    location: d.road_name || d.route_segment || 'Koridor Jombang – Surabaya',
    roadName: d.road_name,
    route_segment: d.route_segment || 'Jombang - Surabaya',
    timestamp: d.captured_at || d.created_at,
    imageUrl: d.image_url,
    status: d.status || 'terdeteksi',
    mode: 'realtime',
  };
}

export async function getAllDetections(filters = {}) {
  let query = supabase
    .from('road_damages')
    .select('*')
    .order('captured_at', { ascending: false });

  if (filters.dateRange?.start) {
    query = query.gte('captured_at', filters.dateRange.start);
  }
  if (filters.dateRange?.end) {
    query = query.lte('captured_at', filters.dateRange.end);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Gagal mengambil data deteksi: ${error.message}`);

  let mapped = (data || []).map(mapDamageRow);

  if (filters.type && filters.type !== 'all') {
    if (Array.isArray(filters.type)) {
      mapped = mapped.filter((m) => filters.type.includes(m.type));
    } else {
      mapped = mapped.filter((m) => m.type === filters.type);
    }
  }

  if (filters.severity && filters.severity !== 'all') {
    const targetSev = normalizeSeverity(filters.severity);
    mapped = mapped.filter((m) => m.severity === targetSev);
  }

  if (filters.route_segment && filters.route_segment !== 'all') {
    mapped = mapped.filter(
      (m) =>
        m.route_segment &&
        m.route_segment.toLowerCase().includes(filters.route_segment.toLowerCase())
    );
  }

  return { success: true, data: mapped, total: mapped.length };
}

// ========================
// Dashboard Analytics
// ========================
export async function getDashboardStats() {
  const { data: damages, error } = await supabase
    .from('road_damages')
    .select(
      'id, damage_type, severity, route_segment, road_name, latitude, longitude, confidence, image_url, created_at, captured_at'
    )
    .order('captured_at', { ascending: false });

  if (error) throw new Error(`Gagal mengambil statistik dashboard: ${error.message}`);

  const byType = {
    pothole: 0,
    rutting: 0,
    alligator_crack: 0,
    longitudinal_crack: 0,
  };
  const bySeverity = {
    high: 0,
    medium: 0,
    low: 0,
  };
  const bySegment = {};
  let confSum = 0;

  for (const d of damages || []) {
    const t = normalizeDamageType(d.damage_type);
    byType[t] = (byType[t] || 0) + 1;

    const s = normalizeSeverity(d.severity);
    bySeverity[s] = (bySeverity[s] || 0) + 1;

    if (d.route_segment) {
      bySegment[d.route_segment] = (bySegment[d.route_segment] || 0) + 1;
    }

    confSum += Number(d.confidence || 0);
  }

  // Tren 6 bulan terakhir
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
    'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des',
  ];
  const monthlyMap = {};
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const mName = months[d.getMonth()];
    monthlyMap[mName] = {
      month: mName,
      pothole: 0,
      rutting: 0,
      alligator_crack: 0,
      longitudinal_crack: 0,
      total: 0,
    };
  }

  for (const d of damages || []) {
    const date = new Date(d.captured_at || d.created_at || now);
    const mName = months[date.getMonth()];
    if (monthlyMap[mName]) {
      const type = normalizeDamageType(d.damage_type);
      monthlyMap[mName][type] = (monthlyMap[mName][type] || 0) + 1;
      monthlyMap[mName].total += 1;
    }
  }

  const totalCount = (damages || []).length;
  const averageConfidence = totalCount > 0 ? +(confSum / totalCount).toFixed(3) : 0;

  return {
    success: true,
    data: {
      totalDetections: totalCount,
      averageConfidence,
      byType,
      bySeverity,
      bySegment,
      monthlyTrend: Object.values(monthlyMap),
      recentDetections: (damages || []).slice(0, 10).map(mapDamageRow),
    },
  };
}

// ========================
// Web GIS Map Markers
// ========================
export async function getMapMarkers(filters = {}) {
  const result = await getAllDetections(filters);
  const markers = result.data.map((det) => ({
    ...det,
    title: det.location || det.roadName,
    locationName: det.location,
  }));

  return { success: true, data: markers };
}

// ========================
// Real-Time Object Detection Stream (YOLO Backend)
// ========================
export async function startRealtimeDetection() {
  const apiUrl = getYoloApiUrl();
  try {
    const res = await fetch(`${apiUrl}/api/detect/realtime/start`, { method: 'POST' });
    if (res.ok) {
      const data = await res.json();
      return { success: true, data };
    }
  } catch {
    // Tetap lanjutkan inisialisasi sesi lokal apabila backend startup endpoint opsional
  }

  return {
    success: true,
    data: {
      session_id: `rt-session-${Date.now()}`,
      status: 'active',
      startedAt: new Date().toISOString(),
    },
  };
}

/**
 * Mengirim 1 frame kamera (base64 JPEG) ke backend YOLO Real-Time Detection API.
 * Tidak melakukan fallback ke data deteksi palsu jika backend mati agar data penelitian tetap valid.
 *
 * @param {string} imageBase64 - Data URL / Base64 JPEG
 * @param {number} conf - Confidence threshold (0.1 - 0.9)
 * @param {number} imgsz - Ukuran input inferensi (default 640 atau 1280)
 * @returns {Promise<Object>}
 */
export async function processRealtimeFrame(imageBase64, conf = 0.25, imgsz = 640) {
  const apiUrl = getYoloApiUrl();
  const candidates = [];
  if (apiUrl) candidates.push(`${apiUrl}/api/detect/realtime/frame`);
  candidates.push('/api/detect/realtime/frame');
  if (!candidates.includes('http://localhost:8000/api/detect/realtime/frame')) {
    candidates.push('http://localhost:8000/api/detect/realtime/frame');
  }

  let lastError = null;
  for (const url of candidates) {
    try {
      const t0 = performance.now();
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_base64: imageBase64,
          conf,
          imgsz,
        }),
      });

      if (res.ok) {
        const result = await res.json();
        const roundTripMs = Math.round(performance.now() - t0);
        const procMs = result.processing_time_ms || roundTripMs;
        const detections = (result.detections || []).map((d) => ({
          ...d,
          type: normalizeDamageType(d.type || d.class || d.raw_class),
          severity: normalizeSeverity(d.severity),
        }));

        return {
          success: true,
          connected: true,
          data: {
            detections,
            processingTimeMs: procMs,
            roundTripMs,
            fps: procMs > 0 ? Number((1000 / procMs).toFixed(1)) : 30.0,
            imgWidth: result.img_width || 640,
            imgHeight: result.img_height || 360,
            model: result.model || 'YOLO Nano Best',
          },
        };
      }
      lastError = new Error(`Backend merespons status ${res.status}`);
    } catch (err) {
      lastError = err;
    }
  }

  return {
    success: false,
    connected: false,
    error: lastError?.message || 'Server YOLO Python tidak terjangkau.',
    data: {
      detections: [],
      processingTimeMs: 0,
      roundTripMs: 0,
      fps: 0,
    },
  };
}

// ========================
// Export Data Helper
// ========================
export async function exportData(format = 'csv') {
  return {
    success: true,
    data: {
      format,
      filename: `roadsick-jombang-surabaya-${Date.now()}.${format}`,
      exportedAt: new Date().toISOString(),
    },
    message: `Ekspor data format ${format.toUpperCase()} siap diunduh.`,
  };
}

import mockDetectionsData from '../data/mockDetections.json';
import mockDashboardData from '../data/mockDashboard.json';
import { normalizeDamageType } from '../data/damageTypes';
import { normalizeSeverity } from '../utils/constants';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

let detectionsStore = mockDetectionsData.map((d) => ({
  ...d,
  type: normalizeDamageType(d.type),
  severity: normalizeSeverity(d.severity),
  mode: 'realtime',
}));

const DAMAGE_KEYS = ['pothole', 'rutting', 'alligator_crack', 'longitudinal_crack'];
const SEVERITIES = ['high', 'medium', 'low'];

export async function startRealtimeDetection() {
  await delay(200);
  return {
    success: true,
    data: {
      session_id: `mock-rt-${Date.now()}`,
      status: 'active',
      startedAt: new Date().toISOString(),
    },
  };
}

export async function processRealtimeFrame() {
  await delay(120);
  const randomType = DAMAGE_KEYS[Math.floor(Math.random() * DAMAGE_KEYS.length)];
  const randomSeverity = SEVERITIES[Math.floor(Math.random() * SEVERITIES.length)];
  const confidence = +(0.78 + Math.random() * 0.2).toFixed(2);

  return {
    success: true,
    connected: true,
    data: {
      detections: [
        {
          id: `rt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          type: randomType,
          severity: randomSeverity,
          confidence,
          bbox: { x: 160, y: 120, width: 220, height: 140 },
        },
      ],
      processingTimeMs: 28,
      roundTripMs: 32,
      fps: 35.7,
      imgWidth: 640,
      imgHeight: 360,
      model: 'YOLO Nano (Simulasi Lokal)',
    },
  };
}

export async function getAllDetections(filters = {}) {
  await delay(300);
  let filtered = [...detectionsStore];

  if (filters.type && filters.type !== 'all') {
    if (Array.isArray(filters.type)) {
      filtered = filtered.filter((d) => filters.type.includes(d.type));
    } else {
      filtered = filtered.filter((d) => d.type === filters.type);
    }
  }

  if (filters.severity && filters.severity !== 'all') {
    filtered = filtered.filter((d) => d.severity === normalizeSeverity(filters.severity));
  }

  return {
    success: true,
    data: filtered,
    total: filtered.length,
  };
}

export async function getDashboardStats() {
  await delay(300);
  return {
    success: true,
    data: mockDashboardData,
  };
}

export async function getMapMarkers(filters = {}) {
  const result = await getAllDetections(filters);
  const markers = result.data.map((det) => ({
    ...det,
    position: det.coordinates?.system
      ? [det.coordinates.system.lat, det.coordinates.system.lng]
      : det.position || [-7.4664, 112.4638],
    title: det.location || det.roadName,
    locationName: det.location,
  }));

  return { success: true, data: markers };
}

export async function saveDetection(detection) {
  await delay(250);
  const newDetection = {
    ...detection,
    id: detection.id || `det-${Date.now()}`,
    type: normalizeDamageType(detection.type),
    severity: normalizeSeverity(detection.severity),
    timestamp: detection.timestamp || new Date().toISOString(),
    mode: 'realtime',
  };
  detectionsStore.unshift(newDetection);
  return {
    success: true,
    data: newDetection,
    message: 'Data kerusakan jalan berhasil disimpan.',
  };
}

export async function exportData(format = 'csv') {
  await delay(300);
  return {
    success: true,
    data: {
      format,
      filename: `roadsick-export-${Date.now()}.${format}`,
      exportedAt: new Date().toISOString(),
    },
    message: `Ekspor data format ${format.toUpperCase()} siap diunduh.`,
  };
}

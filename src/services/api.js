import apiClient from './apiClient';

/**
 * Real API Implementation for RoadSick Backend Services.
 */
export async function startRealtimeDetection() {
  return apiClient.post('/detect/realtime/start');
}

export async function processRealtimeFrame(imageBase64, conf = 0.25, imgsz = 640) {
  return apiClient.post('/detect/realtime/frame', {
    image_base64: imageBase64,
    conf,
    imgsz,
  });
}

export async function getAllDetections(filters = {}) {
  return apiClient.get('/detections', { params: filters });
}

export async function getDashboardStats() {
  return apiClient.get('/dashboard/stats');
}

export async function getMapMarkers(filters = {}) {
  return apiClient.get('/map/markers', { params: filters });
}

export async function saveDetection(detection) {
  return apiClient.post('/detections', detection);
}

export async function exportData(format = 'csv') {
  return apiClient.get('/export', { params: { format } });
}

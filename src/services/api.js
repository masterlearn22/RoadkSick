import apiClient from './apiClient';

/**
 * Real API Implementation for RoadSick Backend Services.
 * Mirrors mockApi.js signatures using apiClient Axios HTTP requests.
 */

/**
 * Upload and detect road damages from an image.
 * @param {File|Blob} file
 * @returns {Promise<Object>}
 */
export async function processImageDetection(file) {
  const formData = new FormData();
  formData.append('image', file);

  return apiClient.post('/detect/image', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}

/**
 * Upload and process video detection with progress tracking.
 * @param {File|Blob} file
 * @param {Function} [onProgress]
 * @returns {Promise<Object>}
 */
export async function processVideoDetection(file, onProgress) {
  const formData = new FormData();
  formData.append('video', file);

  return apiClient.post('/detect/video', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      if (progressEvent.total && onProgress) {
        const percent = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        onProgress(percent);
      }
    },
  });
}

/**
 * Initialize a realtime detection session with the backend/YOLOv8 pipeline.
 * @returns {Promise<Object>}
 */
export async function startRealtimeDetection() {
  return apiClient.post('/detect/realtime/start');
}

/**
 * Fetch the latest analyzed frame or detections from active realtime session.
 * @returns {Promise<Object>}
 */
export async function getRealtimeFrame() {
  return apiClient.get('/detect/realtime/frame');
}

/**
 * Retrieve road damage detections list with optional filters.
 * @param {Object} [filters] - { type, severity, mode, search, dateRange }
 * @returns {Promise<Object>}
 */
export async function getAllDetections(filters = {}) {
  return apiClient.get('/detections', {
    params: filters,
  });
}

/**
 * Retrieve dashboard analytics and metric aggregations.
 * @returns {Promise<Object>}
 */
export async function getDashboardStats() {
  return apiClient.get('/dashboard/stats');
}

/**
 * Retrieve detections formatted as GIS map markers.
 * @param {Object} [filters]
 * @returns {Promise<Object>}
 */
export async function getMapMarkers(filters = {}) {
  return apiClient.get('/map/markers', {
    params: filters,
  });
}

/**
 * Retrieve RMSE coordinate accuracy evaluation data.
 * @returns {Promise<Object>}
 */
export async function getRMSEData() {
  return apiClient.get('/rmse');
}

/**
 * Persist a detected road defect record.
 * @param {Object} detection
 * @returns {Promise<Object>}
 */
export async function saveDetection(detection) {
  return apiClient.post('/detections', detection);
}

/**
 * Update Ground Truth survey coordinates for RMSE testing.
 * @param {string|number} id
 * @param {Array<number>} groundTruth - [lat, lng]
 * @returns {Promise<Object>}
 */
export async function updateGroundTruth(id, groundTruth) {
  return apiClient.put(`/rmse/${id}`, { groundTruth });
}

/**
 * Export road damage GIS data.
 * @param {string} [format='csv']
 * @returns {Promise<Object>}
 */
export async function exportData(format = 'csv') {
  return apiClient.get('/export', {
    params: { format },
  });
}

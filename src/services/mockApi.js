import mockDetectionsData from '../data/mockDetections.json';
import mockDashboardData from '../data/mockDashboard.json';
import mockRMSEData from '../data/mockRMSE.json';

// Simulated delay helper
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// In-memory working copies for mutative mock operations
let detectionsStore = [...mockDetectionsData];
let rmseStore = JSON.parse(JSON.stringify(mockRMSEData));

const DAMAGE_TYPES = [
  'longitudinal_crack',
  'alligator_crack',
  'rutting',
  'patches',
];

const SEVERITIES = ['high', 'medium', 'low'];

// Surabaya - Mojokerto - Jombang corridor helper for random jitter
const getRandomCorridorCoordinate = () => {
  // Center roughly -7.4664, 112.4338
  const latJitter = (Math.random() - 0.5) * 0.3;
  const lngJitter = (Math.random() - 0.5) * 0.5;
  return [-7.4664 + latJitter, 112.4338 + lngJitter];
};

/**
 * Simulate image detection processing with YOLOv8.
 * @param {File|Blob|string} file
 * @returns {Promise<{success: boolean, data: {imageUrl: string, detections: Array}}>}
 */
export async function processImageDetection(file) {
  await delay(2000);

  const imageUrl =
    file instanceof File || file instanceof Blob
      ? URL.createObjectURL(file)
      : typeof file === 'string'
      ? file
      : 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=80';

  const mockDetectedItems = [
    {
      id: `det-${Date.now()}-1`,
      class: 'longitudinal_crack',
      type: 'longitudinal_crack',
      confidence: 0.94,
      severity: 'high',
      bbox: [120, 150, 240, 290],
      coordinates: [-7.3291, 112.7368],
      dimensions: { widthMeters: 0.85, lengthMeters: 1.1, depthCm: 2.0 },
      label: 'Retak Memanjang (Longitudinal Crack)',
    },
    {
      id: `det-${Date.now()}-2`,
      class: 'alligator_crack',
      type: 'alligator_crack',
      confidence: 0.87,
      severity: 'medium',
      bbox: [280, 210, 420, 390],
      coordinates: [-7.3615, 112.6234],
      dimensions: { widthMeters: 1.4, lengthMeters: 2.1, depthCm: 2.0 },
      label: 'Retak Buaya (Alligator Crack)',
    },
  ];

  return {
    success: true,
    data: {
      imageUrl,
      detections: mockDetectedItems,
      processingTimeMs: 142,
      model: 'YOLOv8x-RoadSick-v1',
    },
  };
}

/**
 * Simulate video detection processing with progress reporting over ~5 seconds.
 * @param {File|Blob|string} file
 * @param {Function} onProgress - Callback receiving progress percentage (0 - 100)
 * @returns {Promise<{success: boolean, data: Object}>}
 */
export async function processVideoDetection(file, onProgress) {
  const steps = 10;
  const interval = 500;

  for (let i = 1; i <= steps; i++) {
    await delay(interval);
    const progress = Math.min(100, Math.round((i / steps) * 100));
    if (typeof onProgress === 'function') {
      onProgress(progress);
    }
  }

  const videoUrl =
    file instanceof File || file instanceof Blob
      ? URL.createObjectURL(file)
      : typeof file === 'string'
      ? file
      : 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4';

  const detections = [
    {
      id: `vdet-${Date.now()}-1`,
      frameNumber: 45,
      timestampSeconds: 1.5,
      type: 'longitudinal_crack',
      confidence: 0.92,
      severity: 'high',
      bbox: [100, 120, 220, 260],
      coordinates: [-7.3291, 112.7368],
    },
    {
      id: `vdet-${Date.now()}-2`,
      frameNumber: 110,
      timestampSeconds: 3.6,
      type: 'alligator_crack',
      confidence: 0.85,
      severity: 'medium',
      bbox: [150, 180, 200, 420],
      coordinates: [-7.3615, 112.6234],
    },
    {
      id: `vdet-${Date.now()}-3`,
      frameNumber: 142,
      timestampSeconds: 4.7,
      type: 'rutting',
      confidence: 0.89,
      severity: 'high',
      bbox: [80, 160, 310, 390],
      coordinates: [-7.4729, 112.4411],
    },
  ];

  return {
    success: true,
    data: {
      videoUrl,
      totalFrames: 150,
      fps: 30,
      detections,
      summary: {
        totalDamageCount: detections.length,
        typesFound: ['longitudinal_crack', 'alligator_crack', 'rutting'],
        averageConfidence: 0.887,
      },
    },
  };
}

/**
 * Start a mock realtime streaming detection session.
 * @returns {Promise<{success: boolean, data: {sessionId: string, status: string}}>}
 */
export async function startRealtimeDetection() {
  await delay(300);
  const sessionId = `session-${Date.now()}`;
  return {
    success: true,
    data: {
      sessionId,
      status: 'active',
      startedAt: new Date().toISOString(),
      fps: 15,
      resolution: '1280x720',
    },
  };
}

/**
 * Fetch a single simulated realtime frame detection.
 * @returns {Promise<{detection: Object}>}
 */
export async function getRealtimeFrame() {
  await delay(500);

  const randomType =
    DAMAGE_TYPES[Math.floor(Math.random() * DAMAGE_TYPES.length)];
  const randomSeverity =
    SEVERITIES[Math.floor(Math.random() * SEVERITIES.length)];
  const randomConfidence = +(0.78 + Math.random() * 0.2).toFixed(2);
  const coordinates = getRandomCorridorCoordinate();

  const detection = {
    id: `rt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    type: randomType,
    severity: randomSeverity,
    confidence: randomConfidence,
    bbox: [
      Math.floor(80 + Math.random() * 100),
      Math.floor(100 + Math.random() * 150),
      Math.floor(220 + Math.random() * 120),
      Math.floor(300 + Math.random() * 150),
    ],
    coordinates,
    locationName: 'Koridor Surabaya - Mojokerto - Jombang',
    timestamp: new Date().toISOString(),
  };

  return {
    detection,
  };
}

/**
 * Fetch all detections with support for filters.
 * @param {Object} filters - { type, severity, mode, search, dateRange: { start, end } }
 * @returns {Promise<{success: boolean, data: Array, total: number}>}
 */
export async function getAllDetections(filters = {}) {
  await delay(800);

  let filtered = [...detectionsStore];

  if (filters.type && filters.type !== 'all') {
    if (Array.isArray(filters.type)) {
      filtered = filtered.filter((d) => filters.type.includes(d.type));
    } else {
      filtered = filtered.filter((d) => d.type === filters.type);
    }
  }

  if (filters.severity && filters.severity !== 'all') {
    filtered = filtered.filter((d) => d.severity === filters.severity);
  }

  if (filters.mode && filters.mode !== 'all') {
    filtered = filtered.filter((d) => d.mode === filters.mode);
  }

  if (filters.search) {
    const q = filters.search.toLowerCase().trim();
    filtered = filtered.filter(
      (d) =>
        d.location?.toLowerCase().includes(q) ||
        d.locationName?.toLowerCase().includes(q) ||
        d.roadName?.toLowerCase().includes(q) ||
        d.type?.toLowerCase().includes(q) ||
        d.description?.toLowerCase().includes(q)
    );
  }

  if (filters.dateRange?.start) {
    const startTime = new Date(filters.dateRange.start).getTime();
    filtered = filtered.filter(
      (d) => new Date(d.timestamp).getTime() >= startTime
    );
  }

  if (filters.dateRange?.end) {
    const endTime = new Date(filters.dateRange.end).getTime();
    filtered = filtered.filter(
      (d) => new Date(d.timestamp).getTime() <= endTime
    );
  }

  return {
    success: true,
    data: filtered,
    total: filtered.length,
  };
}

/**
 * Fetch dashboard statistics and analytics.
 * @returns {Promise<{success: boolean, data: Object}>}
 */
export async function getDashboardStats() {
  await delay(600);
  return {
    success: true,
    data: mockDashboardData,
  };
}

/**
 * Fetch detections formatted as map markers with filter support.
 * @param {Object} filters
 * @returns {Promise<{success: boolean, data: Array}>}
 */
export async function getMapMarkers(filters = {}) {
  await delay(500);

  const detectionsResult = await getAllDetections(filters);
  const detections = detectionsResult.data;

  const markers = detections.map((det) => ({
    id: det.id,
    type: det.type,
    severity: det.severity,
    confidence: det.confidence,
    position: det.coordinates,
    coordinates: det.coordinates,
    title: det.location || det.locationName || det.roadName,
    locationName: det.location || det.locationName,
    roadName: det.roadName,
    route_segment: det.route_segment,
    imageUrl: det.imageUrl,
    timestamp: det.timestamp,
    dimensions: det.dimensions,
    repairStatus: det.repairStatus,
  }));

  return {
    success: true,
    data: markers,
  };
}

/**
 * Fetch mock survey GNSS tracks.
 * @param {string} sessionId
 * @returns {Promise<{success: boolean, data: Array}>}
 */
export async function getSurveyTracks(sessionId) {
  await delay(500);
  // Generate a sample track along the corridor
  const basePoints = [
    [-7.2890, 112.7520],
    [-7.3100, 112.7300],
    [-7.3291, 112.7100],
    [-7.3500, 112.6800],
    [-7.3700, 112.6500],
    [-7.3900, 112.6200],
    [-7.4100, 112.5900],
    [-7.4300, 112.5600],
    [-7.4500, 112.5300],
    [-7.4664, 112.5000],
    [-7.4800, 112.4700],
    [-7.5000, 112.4400],
    [-7.5200, 112.4100],
    [-7.5400, 112.3800],
    [-7.5500, 112.3500],
  ];

  return {
    success: true,
    data: basePoints.map((p, i) => ({
      latitude: p[0],
      longitude: p[1],
      recorded_at: new Date(Date.now() - (basePoints.length - i) * 60000).toISOString(),
    })),
  };
}

/**
 * Fetch RMSE test data with calculated errors and statistics.
 * @returns {Promise<{success: boolean, data: Object}>}
 */
export async function getRMSEData() {
  await delay(700);
  return {
    success: true,
    data: rmseStore,
  };
}

/**
 * Simulate saving a detection record.
 * @param {Object} detection
 * @returns {Promise<{success: boolean, data: Object}>}
 */
export async function saveDetection(detection) {
  await delay(500);

  const newDetection = {
    ...detection,
    id: detection.id || `det-${Date.now()}`,
    timestamp: detection.timestamp || new Date().toISOString(),
    repairStatus: detection.repairStatus || 'unrepaired',
  };

  detectionsStore.unshift(newDetection);

  return {
    success: true,
    data: newDetection,
    message: 'Data kerusakan jalan berhasil disimpan.',
  };
}

/**
 * Update ground truth coordinates for a sample and recalculate RMSE.
 * @param {string} id
 * @param {Array<number>} groundTruth - [lat, lng]
 * @returns {Promise<{success: boolean, data: Object}>}
 */
export async function updateGroundTruth(id, groundTruth) {
  await delay(500);

  const sampleIndex = rmseStore.samples.findIndex((s) => s.id === id);

  if (sampleIndex === -1) {
    throw new Error(`Data sampel dengan ID ${id} tidak ditemukan.`);
  }

  const sample = rmseStore.samples[sampleIndex];
  sample.groundTruthCoordinates = groundTruth;

  // Recalculate deltas and Euclidean distance in meters
  const deltaLat = sample.predictedCoordinates[0] - groundTruth[0];
  const deltaLng = sample.predictedCoordinates[1] - groundTruth[1];
  const distMeters = Math.sqrt(
    Math.pow(deltaLat * 111139, 2) + Math.pow(deltaLng * 110332, 2)
  );

  sample.deltaLat = deltaLat;
  sample.deltaLng = deltaLng;
  sample.errorMeters = +distMeters.toFixed(3);

  // Recalculate overall RMSE
  const errorsSquaredSum = rmseStore.samples.reduce(
    (sum, s) => sum + Math.pow(s.errorMeters, 2),
    0
  );
  const overallRMSE = Math.sqrt(errorsSquaredSum / rmseStore.samples.length);
  rmseStore.summary.rmseDistanceMeters = +overallRMSE.toFixed(3);
  rmseStore.summary.overallRMSE = +overallRMSE.toFixed(3);

  return {
    success: true,
    data: sample,
    summary: rmseStore.summary,
    message: 'Titik ground truth berhasil diperbarui.',
  };
}

/**
 * Simulate data export into CSV, GeoJSON, or Excel formats.
 * @param {string} format - 'csv' | 'geojson' | 'xlsx'
 * @returns {Promise<{success: boolean, data: {downloadUrl: string, format: string, exportedAt: string}}>}
 */
export async function exportData(format = 'csv') {
  await delay(1000);

  return {
    success: true,
    data: {
      downloadUrl: '#',
      format,
      filename: `roadsick-export-${Date.now()}.${format}`,
      exportedAt: new Date().toISOString(),
    },
    message: `Ekspor data format ${format.toUpperCase()} berhasil disiapkan.`,
  };
}

import Papa from 'papaparse';
import { haversineDistance } from './coordinates';

/**
 * Parse file GPX dari Smartwatch Supercalla Onyx menjadi array titik GNSS terurut waktu
 * @param {string} gpxText - Raw GPX XML text
 * @returns {Array<Object>} Sorted array of GNSS track points
 */
export function parseGPXTrack(gpxText) {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(gpxText, 'text/xml');
  const trkpts = Array.from(xmlDoc.getElementsByTagName('trkpt'));

  const points = trkpts.map((pt) => {
    const lat = parseFloat(pt.getAttribute('lat'));
    const lng = parseFloat(pt.getAttribute('lon'));
    const eleNode = pt.getElementsByTagName('ele')[0];
    const timeNode = pt.getElementsByTagName('time')[0];
    const hdopNode = pt.getElementsByTagName('hdop')[0];

    const timestamp = timeNode ? new Date(timeNode.textContent).getTime() : null;
    return {
      latitude: lat,
      longitude: lng,
      altitude: eleNode ? parseFloat(eleNode.textContent) : null,
      hdop: hdopNode ? parseFloat(hdopNode.textContent) : null,
      recorded_at: timeNode ? timeNode.textContent : null,
      timestampMs: timestamp,
    };
  }).filter((p) => !isNaN(p.latitude) && !isNaN(p.longitude) && p.timestampMs !== null);

  return points.sort((a, b) => a.timestampMs - b.timestampMs);
}

/**
 * Parse file CSV log GNSS dari Smartwatch menjadi array titik GNSS terurut waktu
 * @param {string} csvText - Raw CSV text
 * @returns {Array<Object>} Sorted array of GNSS track points
 */
export function parseCSVTrack(csvText) {
  const result = Papa.parse(csvText, { header: true, skipEmptyLines: true });
  const points = result.data.map((row) => {
    const lat = parseFloat(row.latitude || row.lat || row.Latitude);
    const lng = parseFloat(row.longitude || row.lon || row.lng || row.Longitude);
    const timeStr = row.timestamp || row.time || row.recorded_at || row.Time;
    const timestampMs = timeStr ? new Date(timeStr).getTime() : null;

    return {
      latitude: lat,
      longitude: lng,
      altitude: parseFloat(row.altitude || row.ele || 0) || null,
      hdop: parseFloat(row.hdop || 0) || null,
      recorded_at: timeStr ? new Date(timestampMs).toISOString() : null,
      timestampMs,
    };
  }).filter((p) => !isNaN(p.latitude) && !isNaN(p.longitude) && p.timestampMs !== null);

  return points.sort((a, b) => a.timestampMs - b.timestampMs);
}

/**
 * Parse file track berdasarkan ekstensi (GPX atau CSV)
 * @param {string} text - File content as string
 * @param {string} filename - Original filename to detect format
 * @returns {Array<Object>} Sorted array of GNSS track points
 */
export function parseTrackFile(text, filename) {
  const ext = filename.toLowerCase().split('.').pop();
  if (ext === 'gpx') {
    return parseGPXTrack(text);
  } else if (ext === 'csv') {
    return parseCSVTrack(text);
  }
  throw new Error(`Format file tidak didukung: .${ext}. Gunakan .gpx atau .csv`);
}

/**
 * Mencocokkan timestamp frame visual kamera (YOLOv8) dengan koordinat GNSS Smartwatch
 * menggunakan Interpolasi Linear Spasial-Temporal
 *
 * @param {number} frameTimestampMs - Timestamp frame kamera dalam ms
 * @param {Array<Object>} trackPoints - Array GNSS points terurut waktu
 * @param {number} timeOffsetMs - Kalibrasi selisih waktu kamera vs smartwatch (ms)
 * @param {number} maxToleranceMs - Toleransi maksimum (ms) di luar range track
 * @returns {Object|null} Interpolated coordinate or null if out of range
 */
export function matchFrameToGNSS(frameTimestampMs, trackPoints, timeOffsetMs = 0, maxToleranceMs = 15000) {
  if (!trackPoints || trackPoints.length === 0) return null;

  const targetTime = frameTimestampMs + timeOffsetMs;

  if (targetTime < trackPoints[0].timestampMs - maxToleranceMs ||
      targetTime > trackPoints[trackPoints.length - 1].timestampMs + maxToleranceMs) {
    return null;
  }

  // Edge cases: before or at start
  if (targetTime <= trackPoints[0].timestampMs) {
    return {
      latitude: trackPoints[0].latitude,
      longitude: trackPoints[0].longitude,
      deltaMs: Math.abs(targetTime - trackPoints[0].timestampMs),
      method: 'nearest_edge',
    };
  }

  // Edge cases: at or after end
  if (targetTime >= trackPoints[trackPoints.length - 1].timestampMs) {
    const last = trackPoints[trackPoints.length - 1];
    return {
      latitude: last.latitude,
      longitude: last.longitude,
      deltaMs: Math.abs(targetTime - last.timestampMs),
      method: 'nearest_edge',
    };
  }

  // Binary search for exact match or bracketing points
  let low = 0;
  let high = trackPoints.length - 1;
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    if (trackPoints[mid].timestampMs === targetTime) {
      return {
        latitude: trackPoints[mid].latitude,
        longitude: trackPoints[mid].longitude,
        deltaMs: 0,
        method: 'exact',
      };
    } else if (trackPoints[mid].timestampMs < targetTime) {
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  // Linear interpolation between p1 (high) and p2 (low)
  const p1 = trackPoints[high];
  const p2 = trackPoints[low];
  const span = p2.timestampMs - p1.timestampMs;
  const ratio = span > 0 ? (targetTime - p1.timestampMs) / span : 0;

  return {
    latitude: p1.latitude + ratio * (p2.latitude - p1.latitude),
    longitude: p1.longitude + ratio * (p2.longitude - p1.longitude),
    deltaMs: Math.min(Math.abs(targetTime - p1.timestampMs), Math.abs(p2.timestampMs - targetTime)),
    method: 'linear_interpolation',
  };
}

/**
 * Menghitung total panjang lintasan survei (km) dari daftar titik GNSS
 * @param {Array<Object>} trackPoints - Array of track points with latitude & longitude
 * @returns {number} Total distance in km, rounded to 2 decimals
 */
export function calculateTrackDistanceKm(trackPoints) {
  if (!trackPoints || trackPoints.length < 2) return 0;
  let totalMeters = 0;
  for (let i = 1; i < trackPoints.length; i++) {
    totalMeters += haversineDistance(
      trackPoints[i - 1].latitude,
      trackPoints[i - 1].longitude,
      trackPoints[i].latitude,
      trackPoints[i].longitude
    );
  }
  return +(totalMeters / 1000).toFixed(2);
}

/**
 * Menghitung ringkasan statistik dari track GNSS
 * @param {Array<Object>} trackPoints - Parsed GNSS track points
 * @returns {Object} Summary stats
 */
export function getTrackSummary(trackPoints) {
  if (!trackPoints || trackPoints.length === 0) {
    return {
      totalPoints: 0,
      startTime: null,
      endTime: null,
      durationMinutes: 0,
      distanceKm: 0,
    };
  }

  const sorted = [...trackPoints].sort((a, b) => a.timestampMs - b.timestampMs);
  const startTime = new Date(sorted[0].timestampMs);
  const endTime = new Date(sorted[sorted.length - 1].timestampMs);
  const durationMs = endTime.getTime() - startTime.getTime();

  return {
    totalPoints: sorted.length,
    startTime: startTime.toISOString(),
    endTime: endTime.toISOString(),
    durationMinutes: +(durationMs / 60000).toFixed(1),
    distanceKm: calculateTrackDistanceKm(sorted),
  };
}

export default {
  parseGPXTrack,
  parseCSVTrack,
  parseTrackFile,
  matchFrameToGNSS,
  calculateTrackDistanceKm,
  getTrackSummary,
};

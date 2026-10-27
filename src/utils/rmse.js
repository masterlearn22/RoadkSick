import { haversineDistance } from './coordinates.js';

/**
 * RMSE (Root Mean Square Error) testing and evaluation utilities
 */

/**
 * Calculate distance in meters for a point comparison object
 * Supports:
 * - point: { sysLat, sysLng, gtLat, gtLng }
 * - point: { system: { lat, lng }, groundTruth: { lat, lng } }
 * @param {Object} point
 * @returns {number} distance in meters
 */
export const calculateDistance = (point) => {
  if (!point) return 0;

  let lat1, lng1, lat2, lng2;

  if (point.sysLat !== undefined && point.gtLat !== undefined) {
    lat1 = point.sysLat;
    lng1 = point.sysLng;
    lat2 = point.gtLat;
    lng2 = point.gtLng;
  } else if (point.system && point.groundTruth) {
    lat1 = point.system.lat;
    lng1 = point.system.lng;
    lat2 = point.groundTruth.lat;
    lng2 = point.groundTruth.lng;
  } else {
    return 0;
  }

  return haversineDistance(lat1, lng1, lat2, lng2);
};

/**
 * Calculate Root Mean Square Error (RMSE) across test points
 * Formula: sqrt( (1/N) * sum( (dist_i)^2 ) )
 * @param {Array<Object>} points - Array of test points
 * @returns {number} RMSE in meters
 */
export const calculateRMSE = (points = []) => {
  if (!Array.isArray(points) || points.length === 0) {
    return 0;
  }

  let sumSquaredErrors = 0;
  let validCount = 0;

  for (const point of points) {
    let dist;
    if (typeof point.distance === 'number') {
      dist = point.distance;
    } else {
      dist = calculateDistance(point);
    }

    if (!isNaN(dist)) {
      sumSquaredErrors += dist * dist;
      validCount += 1;
    }
  }

  if (validCount === 0) return 0;

  const meanSquareError = sumSquaredErrors / validCount;
  return Math.sqrt(meanSquareError);
};

/**
 * Generate mock RMSE test points with system and ground truth coordinates along Surabaya - Mojokerto - Jombang
 * @param {number} count
 * @param {number} baseLat
 * @param {number} baseLng
 * @returns {Array<Object>}
 */
export const generateMockRMSEData = (count = 10, baseLat = -7.4664, baseLng = 112.4338) => {
  const data = [];

  for (let i = 1; i <= count; i++) {
    // Generate system coordinate around Surabaya-Mojokerto corridor (+/- 0.02 deg)
    const sysLat = Number((baseLat + (Math.random() - 0.5) * 0.04).toFixed(6));
    const sysLng = Number((baseLng + (Math.random() - 0.5) * 0.04).toFixed(6));

    // Slight offset for ground truth (0.0001 - 0.0004 deg approx 10 - 45 meters, or smaller 2-5 meters: 0.00002 - 0.000045)
    // 0.000027 deg in latitude is ~ 3 meters
    const offsetLat = (Math.random() * 0.00003 + 0.000015) * (Math.random() > 0.5 ? 1 : -1);
    const offsetLng = (Math.random() * 0.00003 + 0.000015) * (Math.random() > 0.5 ? 1 : -1);

    const gtLat = Number((sysLat + offsetLat).toFixed(6));
    const gtLng = Number((sysLng + offsetLng).toFixed(6));

    const distance = Number(haversineDistance(sysLat, sysLng, gtLat, gtLng).toFixed(2));
    const distanceSquared = Number((distance * distance).toFixed(4));

    data.push({
      id: `RMSE-${String(i).padStart(3, '0')}`,
      detectionId: `DET-${String(i).padStart(3, '0')}`,
      sysLat,
      sysLng,
      gtLat,
      gtLng,
      system: { lat: sysLat, lng: sysLng },
      groundTruth: { lat: gtLat, lng: gtLng },
      distance,
      distanceSquared,
    });
  }

  return data;
};

export default {
  calculateDistance,
  calculateRMSE,
  generateMockRMSEData,
};

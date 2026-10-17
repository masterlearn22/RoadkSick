/**
 * Coordinate and distance calculation utilities
 */

/**
 * Convert degrees to radians
 * @param {number} degrees
 * @returns {number}
 */
export const toRad = (degrees) => {
  return (degrees * Math.PI) / 180;
};

/**
 * Calculate distance between two lat/lng coordinates in meters using the Haversine formula
 * @param {number} lat1
 * @param {number} lng1
 * @param {number} lat2
 * @param {number} lng2
 * @returns {number} distance in meters
 */
export const haversineDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371000; // Earth radius in meters
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Generate a random coordinate within a given radius (km) from center point
 * @param {number} centerLat
 * @param {number} centerLng
 * @param {number} radiusKm
 * @returns {{lat: number, lng: number}}
 */
export const generateRandomCoordinate = (centerLat = -6.917, centerLng = 107.619, radiusKm = 3) => {
  // Radius of earth in km
  const radiusEarth = 6371;

  // Generate random distance and angle
  const u = Math.random();
  const v = Math.random();
  const w = (radiusKm / radiusEarth) * Math.sqrt(u);
  const t = 2 * Math.PI * v;
  const x = w * Math.cos(t);
  const y = w * Math.sin(t);

  // Adjust for latitude shortening
  const xp = x / Math.cos(toRad(centerLat));

  const newLat = centerLat + (y * 180) / Math.PI;
  const newLng = centerLng + (xp * 180) / Math.PI;

  return {
    lat: Number(newLat.toFixed(6)),
    lng: Number(newLng.toFixed(6)),
  };
};

/**
 * Format lat and lng into readable string "lat, lng"
 * @param {number} lat
 * @param {number} lng
 * @param {number} decimals
 * @returns {string}
 */
export const formatLatLng = (lat, lng, decimals = 6) => {
  if (lat === null || lat === undefined || lng === null || lng === undefined) {
    return '-';
  }
  return `${Number(lat).toFixed(decimals)}, ${Number(lng).toFixed(decimals)}`;
};

export default {
  toRad,
  haversineDistance,
  generateRandomCoordinate,
  formatLatLng,
};

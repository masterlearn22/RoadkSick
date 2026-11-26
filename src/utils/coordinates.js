/**
 * Generate coordinate utilities (Haversine only for optional trip distance calculation)
 */

export const toRad = (degrees) => (degrees * Math.PI) / 180;

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

export const formatLatLng = (lat, lng, decimals = 6) => {
  if (lat === null || lat === undefined || lng === null || lng === undefined) {
    return '-';
  }
  return `${Number(lat).toFixed(decimals)}, ${Number(lng).toFixed(decimals)}`;
};

export default {
  toRad,
  haversineDistance,
  formatLatLng,
};

/**
 * Utility formatting functions for RoadSick application
 */

/**
 * Format coordinate number to fixed decimals string
 * @param {number|string} value
 * @param {number} decimals
 * @returns {string}
 */
export const formatCoordinate = (value, decimals = 6) => {
  if (value === null || value === undefined || isNaN(Number(value))) {
    return '-';
  }
  return Number(value).toFixed(decimals);
};

/**
 * Format confidence value (0-1 or 0-100) into a percentage string
 * @param {number|string} value
 * @returns {string}
 */
export const formatConfidence = (value) => {
  if (value === null || value === undefined || isNaN(Number(value))) {
    return '0.0%';
  }
  const num = Number(value);
  const percentage = num <= 1 ? num * 100 : num;
  return `${percentage.toFixed(1)}%`;
};

/**
 * Format ISO date string to 'DD MMM YYYY HH:mm'
 * Example: '12 Okt 2024 14:30'
 * @param {string|Date} isoString
 * @param {string} locale
 * @returns {string}
 */
export const formatTimestamp = (isoString, locale = 'id-ID') => {
  if (!isoString) return '-';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return '-';

  const day = String(date.getDate()).padStart(2, '0');
  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
    'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
  ];
  const month = monthNames[date.getMonth()];
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${day} ${month} ${year} ${hours}:${minutes}`;
};

/**
 * Format relative time (e.g. '2 menit yang lalu' / '2 min ago')
 * @param {string|Date} isoString
 * @param {boolean} inIndonesian
 * @returns {string}
 */
export const formatRelativeTime = (isoString, inIndonesian = true) => {
  if (!isoString) return '-';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return '-';

  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 0) {
    return inIndonesian ? 'baru saja' : 'just now';
  }

  if (diffInSeconds < 60) {
    return inIndonesian ? `${diffInSeconds} dtk lalu` : `${diffInSeconds}s ago`;
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return inIndonesian ? `${diffInMinutes} mnt lalu` : `${diffInMinutes}m ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return inIndonesian ? `${diffInHours} jam lalu` : `${diffInHours}h ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return inIndonesian ? `${diffInDays} hr lalu` : `${diffInDays}d ago`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return inIndonesian ? `${diffInMonths} bln lalu` : `${diffInMonths}mo ago`;
  }

  const diffInYears = Math.floor(diffInDays / 365);
  return inIndonesian ? `${diffInYears} thn lalu` : `${diffInYears}y ago`;
};

/**
 * Format distance in meters or kilometers
 * @param {number|string} meters
 * @returns {string}
 */
export const formatDistance = (meters) => {
  if (meters === null || meters === undefined || isNaN(Number(meters))) {
    return '0.00 m';
  }
  const m = Number(meters);
  if (m >= 1000) {
    return `${(m / 1000).toFixed(2)} km`;
  }
  return `${m.toFixed(2)} m`;
};

export default {
  formatCoordinate,
  formatConfidence,
  formatTimestamp,
  formatRelativeTime,
  formatDistance,
};

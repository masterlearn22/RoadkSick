import axios from 'axios';

/**
 * Axios instance configured for the RoadSick API.
 * Includes timeout, default JSON headers, token injection, and structured error handling.
 */
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Request interceptor: attach bearer token if available in storage
apiClient.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem('roadsick_token') ||
      localStorage.getItem('token') ||
      localStorage.getItem('auth_token');

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor: standard error handling and formatting
apiClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    // Standardize error message for frontend consumption
    let message = 'Terjadi kesalahan pada sistem.';

    if (error.response) {
      // Server responded with non-2xx status
      const data = error.response.data;
      message =
        data?.message ||
        data?.error ||
        `Permintaan gagal dengan status ${error.response.status}.`;
    } else if (error.request) {
      // No response received (timeout or network error)
      message = 'Tidak dapat terhubung ke server backend RoadSick. Periksa koneksi jaringan.';
    } else {
      message = error.message || 'Gagal memproses permintaan.';
    }

    const customError = new Error(message);
    customError.status = error.response?.status;
    customError.originalError = error;

    return Promise.reject(customError);
  }
);

export default apiClient;

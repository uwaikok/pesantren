import axios from 'axios';

// ============================================================
// KONFIGURASI URL API
// - Di browser web (dev): pakai proxy /api → localhost:5000
// - Di Android APK (Capacitor native): pakai URL Vercel langsung
//   karena APK tidak bisa pakai path relatif '/api'
// ============================================================
const isCapacitorNative = () => {
  if (typeof window !== 'undefined' && window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()) {
    return true;
  }
  if (typeof window !== 'undefined' && window.location) {
    const protocol = window.location.protocol;
    if (protocol === 'capacitor:' || protocol === 'file:') {
      return true;
    }
    const hostname = window.location.hostname;
    if ((protocol === 'https:' || protocol === 'http:') && hostname === 'localhost' && !import.meta.env.DEV) {
      return true;
    }
  }
  return false;
};

// URL backend Vercel production (untuk APK Android)
const VERCEL_API_URL = 'https://pesantren-chi.vercel.app/api';

// Tentukan baseURL:
// - Native (APK Android): pakai Vercel URL langsung
// - Browser web: pakai env var atau '/api' (di-proxy oleh Vite/Vercel)
const BASE_URL = isCapacitorNative()
  ? VERCEL_API_URL
  : (import.meta.env.VITE_API_URL || '/api');

console.log('[SIM Pesantren] API Base URL:', BASE_URL, '| Native:', isCapacitorNative());

// Konfigurasi base Axios
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
});

// Interceptor untuk menyisipkan token JWT di setiap request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('simesra_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Buat wrapper request API
const request = async (method, url, data = null, params = null, headers = null) => {
  try {
    const config = { method, url, data, params };
    if (headers) config.headers = headers;
    const response = await api(config);
    return response.data;
  } catch (error) {
    if (error.response) {
      // HTTP error dari server (4xx, 5xx)
      return Promise.reject(error.response.data || { message: 'Terjadi kesalahan pada server' });
    }
    // Network error — tidak bisa konek ke backend
    console.error('[SIM Pesantren] Gagal terhubung ke backend:', error.message);
    return Promise.reject({ message: 'Gagal terhubung ke server. Periksa koneksi internet Anda.' });
  }
};

export default {
  get: (url, config) => request('get', url, null, config?.params),
  post: (url, data, config) => request('post', url, data, null, config?.headers),
  put: (url, data, config) => request('put', url, data, null, config?.headers),
  delete: (url) => request('delete', url),
};

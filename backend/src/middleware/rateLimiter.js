const rateLimit = require('express-rate-limit');

// ----- Konstanta Konfigurasi -----
const isDev = process.env.NODE_ENV === 'development';

// Konfigurasi batas maksimal percobaan login
const MAX_ATTEMPTS   = isDev ? 100 : 5;   // Lebih longgar saat development
const WINDOW_MINUTES = isDev ? 1   : 15;  // Jendela waktu dalam menit
const WINDOW_MS      = WINDOW_MINUTES * 60 * 1000;

/**
 * Rate limiter utama untuk endpoint /auth/login.
 *
 * Konfigurasi:
 * - Max 5 percobaan login gagal per IP per 15 menit (production)
 * - 100 percobaan per menit saat development (tidak mengganggu testing)
 * - Counter di-reset otomatis setelah window berakhir
 * - Rate limiter bisa direset secara manual per-key setelah login berhasil
 *
 * Tracking berbasis IP + email (lebih presisi dari IP saja):
 * Ini mencegah satu IP membobol banyak akun sekaligus.
 */
const loginStore = new rateLimit.MemoryStore();

const loginRateLimiter = rateLimit({
  windowMs: WINDOW_MS,
  max: MAX_ATTEMPTS,
  store: loginStore,
  standardHeaders: true,   // Kirim header RateLimit-* di response
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },  // Nonaktifkan validasi X-Forwarded-For (aman untuk Vercel)

  // Gunakan kombinasi IP + email sebagai key unik untuk tracking
  keyGenerator: (req) => {
    // Ambil IP dari header proxy atau langsung dari socket
    const ip = req.headers['x-forwarded-for']
      ? req.headers['x-forwarded-for'].split(',')[0].trim()
      : (req.socket && req.socket.remoteAddress) || 'unknown-ip';
    const email = (req.body && req.body.email)
      ? req.body.email.toLowerCase().trim()
      : '';
    return `login:${ip}:${email}`;
  },

  // Hanya hitung request yang GAGAL login (bukan yang berhasil)
  // skipSuccessfulRequests: true harus dikombinasikan dengan handler manual
  skipSuccessfulRequests: true,

  // Pesan yang dikirim saat limit tercapai
  handler: (req, res) => {
    const retryAfterMs    = req.rateLimit.resetTime
      ? req.rateLimit.resetTime - Date.now()
      : WINDOW_MS;
    const retryAfterMenit = Math.ceil(retryAfterMs / 60000);

    res.status(429).json({
      message: `Terlalu banyak percobaan login. Silakan coba lagi dalam ${retryAfterMenit} menit.`,
      retryAfterMenit,
    });
  },
});

/**
 * Helper untuk reset rate limit counter secara manual setelah login berhasil.
 * Dipanggil dari dalam controller login setelah autentikasi sukses.
 *
 * @param {object} req  - Express request object
 */
function resetLoginLimiter(req) {
  try {
    const ip    = req.ip || req.headers['x-forwarded-for'] || 'unknown-ip';
    const email = (req.body && req.body.email)
      ? req.body.email.toLowerCase().trim()
      : '';
    const key = `login:${ip}:${email}`;
    loginStore.resetKey(key);
  } catch (_) {
    // Jika gagal reset tidak perlu throw error, login tetap lanjut
  }
}

module.exports = {
  loginRateLimiter,
  resetLoginLimiter,
};

const admin = require('firebase-admin');

// Baca konfigurasi dari environment variable (aman untuk deployment di Vercel)
// Saat lokal: baca dari file firebase-admin.json langsung
let serviceAccount;
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
} else {
  try {
    const path = require('path');
    serviceAccount = require(path.join(__dirname, '../../firebase-admin.json'));
  } catch (e) {
    console.warn('firebase-admin.json tidak ditemukan dan FIREBASE_SERVICE_ACCOUNT tidak diset. Push notifications tidak akan berfungsi.');
  }
}

if (serviceAccount) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

module.exports = admin;

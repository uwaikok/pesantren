const admin = require('firebase-admin');

// Baca konfigurasi dari environment variable (aman untuk deployment di Vercel)
// Saat lokal: baca dari file firebase-admin.json langsung
let serviceAccount;
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } catch (parseError) {
    console.error('Error parsing FIREBASE_SERVICE_ACCOUNT environment variable:', parseError);
  }
} else {
  try {
    const path = require('path');
    serviceAccount = require(path.join(__dirname, '../firebase-admin.json'));
  } catch (e) {
    console.warn('firebase-admin.json tidak ditemukan dan FIREBASE_SERVICE_ACCOUNT tidak diset. Push notifications tidak akan berfungsi.');
  }
}

if (serviceAccount) {
  try {
    admin.initializeApp({
      credential: admin.cert(serviceAccount)
    });
    console.log('Firebase Admin SDK initialized successfully.');
  } catch (initError) {
    console.error('Error initializing Firebase Admin SDK:', initError);
  }
}

module.exports = admin;

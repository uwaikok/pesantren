const admin = require('./src/firebase');

async function testFcm() {
  console.log('Memulai tes pengiriman FCM...');
  if (!admin) {
    console.error('Firebase Admin SDK tidak terinisialisasi! Cek file src/firebase.js.');
    process.exit(1);
  }

  try {
    const { getMessaging } = require('firebase-admin/messaging');
    const response = await getMessaging().send({
      topic: 'global_announcements',
      notification: {
        title: 'Tes Koneksi Firebase',
        body: 'Halo! Ini adalah tes pengiriman dari backend lokal Anda.'
      },
      data: {
        kategori: 'UMUM'
      }
    });
    console.log('BERHASIL! Pesan berhasil dikirim ke Firebase Cloud Messaging.');
    console.log('Response ID:', response);
  } catch (error) {
    console.error('GAGAL mengirim notifikasi!');
    console.error('Pesan Error:', error.message);
    console.error('Detail Error:', error);
  }
  process.exit(0);
}

testFcm();

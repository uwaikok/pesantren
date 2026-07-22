const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const { verifyToken, isAdmin } = require('../middleware/auth');
const authController = require('../controllers/authController');
const adminController = require('../controllers/adminController');
const akademikController = require('../controllers/akademikController');
const keamananController = require('../controllers/keamananController');
const keuanganController = require('../controllers/keuanganController');

// --- AUTENTIKASI ---
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.get('/auth/me', verifyToken, authController.getMe);
router.post('/auth/change-password', verifyToken, authController.changePassword);

// --- ADMIN / SERVER ---
router.get('/admin/stats', verifyToken, isAdmin, adminController.getStats);
router.get('/admin/santri', verifyToken, isAdmin, adminController.getSantriList);
router.get('/admin/users/pending', verifyToken, isAdmin, adminController.getPendingUsers);
router.put('/admin/users/:id/verify', verifyToken, isAdmin, adminController.verifyUser);
router.put('/admin/santri/:id', verifyToken, isAdmin, adminController.updateSantri);
router.delete('/admin/santri/:id', verifyToken, isAdmin, adminController.deleteSantri);

// --- UPLOAD FOTO PROFIL (Admin atau user sendiri) ---
router.put('/users/:id/foto-profil', verifyToken, adminController.upload.single('foto'), adminController.uploadFotoProfil);


// --- MODUL PENDIDIKAN (AKADEMIK) ---
router.post('/akademik', verifyToken, isAdmin, akademikController.createNilai);
router.put('/akademik/:id', verifyToken, isAdmin, akademikController.updateNilai);
router.delete('/akademik/:id', verifyToken, isAdmin, akademikController.deleteNilai);
router.get('/akademik/my', verifyToken, akademikController.getMyNilai);
router.get('/akademik/santri/:santriId', verifyToken, akademikController.getNilaiBySantri);

// --- MODUL KEAMANAN (SANKSI) ---
router.post('/keamanan', verifyToken, isAdmin, keamananController.createSanksi);
router.put('/keamanan/:id', verifyToken, isAdmin, keamananController.updateSanksi);
router.delete('/keamanan/:id', verifyToken, isAdmin, keamananController.deleteSanksi);
router.get('/keamanan/my', verifyToken, keamananController.getMySanksi);
router.get('/keamanan/santri/:santriId', verifyToken, keamananController.getSanksiBySantri);

// --- MODUL BENDAHARA (KEUANGAN) ---
router.post('/keuangan', verifyToken, isAdmin, keuanganController.createOrUpdatePembayaran);
router.get('/keuangan/my', verifyToken, keuanganController.getMyPembayaran);
router.get('/keuangan/santri/:santriId', verifyToken, keuanganController.getRiwayatPembayaran);

// --- AGGREGATE PROFILE ENDPOINT ---
// Dapat diakses oleh admin, atau oleh santri bersangkutan untuk melihat resume data dirinya
router.get('/users/:id/profile', verifyToken, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);

    // RBAC check: Santri hanya boleh melihat profilnya sendiri
    if (req.user.role !== 'ADMIN' && req.user.id !== userId) {
      return res.status(403).json({ message: 'Akses ditolak: Anda tidak berhak mengakses data profil ini' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        nama: true,
        email: true,
        noHp: true,
        alamat: true,
        namaWali: true,
        kelas: true,
        role: true,
        status: true,
        fotoProfil: true,
        createdAt: true,
      }
    });

    if (!user) {
      return res.status(404).json({ message: 'User tidak ditemukan' });
    }

    // Ambil Nilai Akademik
    const akademik = await prisma.nilai.findMany({
      where: { santriId: userId },
      orderBy: [{ tahunAjaran: 'desc' }, { semester: 'asc' }],
    });

    // Ambil Keamanan (Sanksi)
    const keamanan = await prisma.sanksi.findMany({
      where: { santriId: userId },
      orderBy: { tanggalPelanggaran: 'desc' },
    });

    // Ambil Keuangan (Pembayaran SPP tahun sekarang)
    const targetTahun = new Date().getFullYear();
    const databasePayments = await prisma.pembayaran.findMany({
      where: { santriId: userId, tahun: targetTahun },
    });

    const keuangan = [];
    let totalTunggakan = 0;
    const defaultAmount = 250000;

    for (let m = 1; m <= 12; m++) {
      const dbRecord = databasePayments.find(p => p.bulan === m);
      if (dbRecord) {
        keuangan.push(dbRecord);
        if (dbRecord.status !== 'LUNAS') {
          totalTunggakan += dbRecord.jumlah;
        }
      } else {
        keuangan.push({
          id: null,
          santriId: userId,
          bulan: m,
          tahun: targetTahun,
          status: 'BELUM_BAYAR',
          tanggalBayar: null,
          jumlah: defaultAmount,
        });
        totalTunggakan += defaultAmount;
      }
    }

    res.json({
      user,
      akademik,
      keamanan,
      keuangan: {
        tahun: targetTahun,
        totalTunggakan,
        payments: keuangan
      }
    });

  } catch (error) {
    console.error('Aggregate profile error:', error);
    res.status(500).json({ message: 'Gagal memuat profil lengkap santri' });
  }
});

module.exports = router;

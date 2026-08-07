const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const { verifyToken, isAdmin } = require('../middleware/auth');
const { sanitizeUserData } = require('../utils/sanitize');
const { loginRateLimiter, resetLoginLimiter } = require('../middleware/rateLimiter');
const authController = require('../controllers/authController');
const adminController = require('../controllers/adminController');
const akademikController = require('../controllers/akademikController');
const keamananController = require('../controllers/keamananController');
const keuanganController = require('../controllers/keuanganController');
const notificationController = require('../controllers/notificationController');

// --- AUTENTIKASI ---
router.post('/auth/login', loginRateLimiter, authController.login);
router.post('/auth/logout', authController.logout);
router.get('/auth/me', verifyToken, authController.getMe);
router.post('/auth/change-password', verifyToken, authController.changePassword);

// --- PROFIL ADMIN SENDIRI (bukan Santri) ---
router.get('/auth/profile', verifyToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, nama: true, email: true, noHp: true, alamat: true, fotoProfil: true, createdAt: true }
    });
    if (!user) return res.status(404).json({ message: 'Profil tidak ditemukan' });
    res.json({
      user: { ...user, role: 'ADMIN', status: 'ACTIVE', namaWali: null, kelas: null },
      akademik: [],
      keamanan: [],
      keuangan: { tahun: new Date().getFullYear(), totalTunggakan: 0, payments: [] }
    });
  } catch (error) {
    console.error('ERROR IN GET PROFILE:', error);
    res.status(500).json({ message: 'Gagal memuat profil admin' });
  }
});

// --- UPDATE PROFIL ADMIN SENDIRI ---
router.put('/auth/profile', verifyToken, async (req, res) => {
  try {
    const { nama, email, password, noHp, alamat } = req.body;
    const bcrypt = require('bcryptjs');
    const jwt = require('jsonwebtoken');

    // Check if email already taken
    if (email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email,
          NOT: { id: req.user.id }
        }
      });
      if (existingUser) {
        return res.status(400).json({ message: 'Email sudah terdaftar oleh pengguna lain' });
      }
    }

    const updateData = {};
    if (nama) updateData.nama = nama;
    if (email) updateData.email = email;
    if (noHp !== undefined) updateData.noHp = noHp;
    if (alamat !== undefined) updateData.alamat = alamat;
    
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: updateData,
      select: { id: true, nama: true, email: true, noHp: true, alamat: true, fotoProfil: true, createdAt: true }
    });

    // Generate token baru agar login otomatis dengan data/email/password baru tetap valid
    const token = jwt.sign(
      {
        id: updated.id,
        nama: updated.nama,
        email: updated.email,
        role: 'ADMIN',
        status: 'ACTIVE'
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ 
      message: 'Profil berhasil diperbarui', 
      token,
      user: { ...updated, role: 'ADMIN', status: 'ACTIVE' } 
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Gagal memperbarui profil admin' });
  }
});


// --- ADMIN / SERVER ---
router.get('/admin/stats', verifyToken, isAdmin, adminController.getStats);
router.get('/admin/santri', verifyToken, isAdmin, adminController.getSantriList);
router.post('/admin/santri', verifyToken, isAdmin, adminController.createSantri);
router.put('/admin/santri/promote/bulk', verifyToken, isAdmin, adminController.promoteBulk);
router.put('/admin/santri/:id', verifyToken, isAdmin, adminController.updateSantri);
router.delete('/admin/santri/:id', verifyToken, isAdmin, adminController.deleteSantri);

// --- UPLOAD FOTO PROFIL (Admin atau user sendiri) ---
router.put('/users/:id/foto-profil', verifyToken, adminController.upload.single('foto'), adminController.uploadFotoProfil);
router.delete('/users/:id/foto-profil', verifyToken, adminController.deleteFotoProfil);


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

// --- MODUL NOTIFIKASI ---
router.post('/notifications', verifyToken, isAdmin, notificationController.createNotification);
router.get('/notifications', verifyToken, notificationController.getNotifications);
router.put('/notifications/read', verifyToken, notificationController.markAsRead);
router.put('/notifications/:id', verifyToken, isAdmin, notificationController.updateNotification);
router.delete('/notifications/:id', verifyToken, isAdmin, notificationController.deleteNotification);

// --- AGGREGATE PROFILE ENDPOINT ---
// Dapat diakses oleh admin atau santri bersangkutan
router.get('/users/:id/profile', verifyToken, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);

    // RBAC check: Admin atau santri bersangkutan
    if (req.user.role !== 'ADMIN' && req.user.id !== userId) {
      return res.status(403).json({ message: 'Akses ditolak: Anda tidak berhak mengakses data profil ini' });
    }

    const santri = await prisma.santri.findUnique({
      where: { id: userId },
      select: {
        id: true,
        nama: true,
        email: true,
        noHp: true,
        alamat: true,
        namaWali: true,
        kelas: true,
        status: true,
        fotoProfil: true,
        isBeasiswa: true,
        tanggalMasuk: true,
        createdAt: true,
      }
    });

    if (!santri) {
      return res.status(404).json({ message: 'Santri tidak ditemukan' });
    }

    const user = {
      ...santri,
      role: 'SANTRI',
    };

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

    const routeGetStartMonth = (tanggalMasuk, targetTahun) => {
      if (!tanggalMasuk) return 1;
      const masuk = new Date(tanggalMasuk);
      const tahunMasuk = masuk.getFullYear();
      const bulanMasuk = masuk.getMonth() + 1;
      if (tahunMasuk > targetTahun) return 13;
      if (tahunMasuk === targetTahun) return bulanMasuk;
      return 1;
    };

    const routeIsMonthDue = (m, targetTahun) => {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;
      if (targetTahun < currentYear) return true;
      if (targetTahun === currentYear) return m <= currentMonth;
      return false;
    };

    const startMonth = routeGetStartMonth(santri.tanggalMasuk, targetTahun);
    const keuangan = [];
    let totalTunggakan = 0;
    let unpaidMonths = 0;
    const defaultAmount = 300000;

    for (let m = startMonth; m <= 12; m++) {
      const dbRecord = databasePayments.find(p => p.bulan === m);
      if (dbRecord) {
        keuangan.push(dbRecord);
        if (dbRecord.status !== 'LUNAS') {
          if (routeIsMonthDue(m, targetTahun)) {
            totalTunggakan += dbRecord.jumlah;
            unpaidMonths++;
          }
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
        if (routeIsMonthDue(m, targetTahun)) {
          totalTunggakan += defaultAmount;
          unpaidMonths++;
        }
      }
    }

    if (santri.isBeasiswa === true || santri.isBeasiswa === 'true') {
      totalTunggakan = 0;
      unpaidMonths = 0;
    }

    res.json({
      user,
      akademik,
      keamanan,
      keuangan: {
        tahun: targetTahun,
        totalTunggakan,
        unpaidMonths,
        payments: keuangan
      }
    });

  } catch (error) {
    console.error('Aggregate profile error:', error);
    res.status(500).json({ message: 'Gagal memuat profil lengkap santri' });
  }
});

// Update profil santri (dapat diakses oleh admin atau santri bersangkutan)
router.put('/users/:id/profile', verifyToken, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { nama, email, noHp, alamat, namaWali, password } = req.body;

    // RBAC check: Admin atau santri bersangkutan
    if (req.user.role !== 'ADMIN' && req.user.id !== userId) {
      return res.status(403).json({ message: 'Akses ditolak: Anda tidak berhak mengubah data profil ini' });
    }

    const santri = await prisma.santri.findUnique({ where: { id: userId } });
    if (!santri) {
      return res.status(404).json({ message: 'Santri tidak ditemukan' });
    }

    if (noHp) {
      const numericPhone = /^[0-9]+$/;
      if (!numericPhone.test(noHp)) {
        return res.status(400).json({ message: 'Nomor HP harus berupa angka' });
      }
    }

    if (email && email !== santri.email) {
      const existingUser = await prisma.user.findFirst({ where: { email } });
      const existingSantri = await prisma.santri.findFirst({
        where: {
          email,
          NOT: { id: userId }
        }
      });
      if (existingUser || existingSantri) {
        return res.status(400).json({ message: 'Email sudah terdaftar oleh pengguna lain' });
      }
    }

    const updateData = {
      nama: nama || santri.nama,
      noHp: noHp !== undefined ? noHp : santri.noHp,
      alamat: alamat !== undefined ? alamat : santri.alamat,
      namaWali: namaWali !== undefined ? namaWali : santri.namaWali,
    };

    // Hanya admin yang boleh mengubah kelas, status, dan beasiswa
    if (req.user.role === 'ADMIN') {
      if (req.body.kelas !== undefined) updateData.kelas = req.body.kelas;
      if (req.body.status !== undefined) updateData.status = req.body.status;
      if (req.body.isBeasiswa !== undefined) updateData.isBeasiswa = req.body.isBeasiswa === true || req.body.isBeasiswa === 'true';
    }

    if (email !== undefined) {
      updateData.email = email || null;
    }

    if (password) {
      const bcrypt = require('bcryptjs');
      updateData.password = await bcrypt.hash(password, 10);
    }

    const updated = await prisma.santri.update({
      where: { id: userId },
      data: updateData,
    });

    // Deteksi field yang diubah untuk notifikasi (kecuali password)
    const changedFields = [];
    if (nama && nama !== santri.nama) changedFields.push('Nama');
    if (alamat !== undefined && alamat !== santri.alamat) changedFields.push('Alamat');
    if (noHp !== undefined && noHp !== santri.noHp) changedFields.push('No HP');
    if (email !== undefined && email !== santri.email) changedFields.push('Email');
    if (namaWali !== undefined && namaWali !== santri.namaWali) changedFields.push('Wali');

    if (changedFields.length > 0 && req.user.role !== 'ADMIN') {
      // Notifikasi untuk santri yang bersangkutan (hanya dia yang melihat)
      await prisma.notification.create({
        data: {
          judul: 'Profil Anda Berhasil Diperbarui',
          isi: `Anda telah berhasil mengubah ${changedFields.join(', ')} pada profil Anda.`,
          kategori: 'UMUM',
          santriId: userId,
        }
      });

      // Notifikasi khusus admin (santriId: -1 sebagai penanda notifikasi admin-only)
      await prisma.notification.create({
        data: {
          judul: `Perubahan Profil Santri: ${santri.nama}`,
          isi: `Santri ${santri.nama} (Kelas: ${santri.kelas || '-'}) telah mengubah ${changedFields.join(', ')}.`,
          kategori: 'UMUM',
          santriId: -1,
        }
      });
    }

    const safeSantri = sanitizeUserData(updated);

    res.json({
      message: 'Profil berhasil diperbarui',
      user: safeSantri
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Gagal memperbarui profil' });
  }
});

module.exports = router;

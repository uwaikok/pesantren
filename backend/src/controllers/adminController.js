const { PrismaClient } = require('@prisma/client');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const prisma = new PrismaClient();

const { sanitizeUserData } = require('../utils/sanitize');

// ---- KONFIGURASI MULTER UPLOAD FOTO PROFIL ----
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extOk = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimeOk = allowedTypes.test(file.mimetype.split('/')[1]);
  if (extOk && mimeOk) {
    cb(null, true);
  } else {
    cb(new Error('Format file tidak didukung. Gunakan JPG, PNG, GIF, atau WEBP.'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // Max 5MB
});

const getSantriList = async (req, res) => {
  try {
    const { search, kelas } = req.query;

    const whereClause = {};

    if (search) {
      const keywords = search.trim().split(/\s+/).filter(Boolean);
      if (keywords.length > 0) {
        whereClause.AND = keywords.map(kw => ({
          OR: [
            { nama: { contains: kw, mode: 'insensitive' } },
            { kelas: { contains: kw, mode: 'insensitive' } },
            { namaWali: { contains: kw, mode: 'insensitive' } }
          ]
        }));
      }
    }

    if (kelas) {
      whereClause.kelas = kelas;
    }

    const santri = await prisma.santri.findMany({
      where: whereClause,
      orderBy: {
        nama: 'asc',
      },
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
        updatedAt: true
      }
    });

    // Map for frontend compatibility & sanitize
    const sanitized = sanitizeUserData(santri);
    const mapped = sanitized.map(s => ({
      ...s,
      email: s.email || '-',
    }));

    res.json(mapped);
  } catch (error) {
    console.error('Get santri error:', error);
    res.status(500).json({ message: 'Gagal mengambil data santri' });
  }
};

const createSantri = async (req, res) => {
  try {
    const { nama, email, password, noHp, alamat, namaWali, kelas, isBeasiswa, tanggalMasuk } = req.body;

    if (!nama) {
      return res.status(400).json({ message: 'Nama wajib diisi' });
    }

    if (!kelas || kelas.trim() === '') {
      return res.status(400).json({ message: 'Kelas/Rombel wajib diisi' });
    }

    if (noHp) {
      const numericPhone = /^[0-9]+$/;
      if (!numericPhone.test(noHp)) {
        return res.status(400).json({ message: 'Nomor HP harus berupa angka' });
      }
    }

    if (email) {
      const existingUser = await prisma.user.findFirst({ where: { email } });
      const existingSantri = await prisma.santri.findFirst({ where: { email } });
      if (existingUser || existingSantri) {
        return res.status(400).json({ message: 'Email sudah terdaftar oleh pengguna lain' });
      }
    }

    let hashedPassword = null;
    if (password) {
      const bcrypt = require('bcryptjs');
      hashedPassword = await bcrypt.hash(password, 10);
    }

    const newSantri = await prisma.santri.create({
      data: {
        nama,
        email: email || null,
        password: hashedPassword,
        noHp,
        alamat,
        namaWali,
        kelas,
        isBeasiswa: isBeasiswa === true || isBeasiswa === 'true',
        tanggalMasuk: tanggalMasuk ? new Date(tanggalMasuk) : new Date()
      }
    });

    const safeSantri = sanitizeUserData(newSantri);

    res.status(201).json({ 
      message: 'Santri berhasil ditambahkan.', 
      user: {
        ...safeSantri,
        email: safeSantri.email || '-',
        status: 'ACTIVE'
      } 
    });
  } catch (error) {
    console.error('Create santri error:', error);
    res.status(500).json({ message: 'Gagal menambahkan santri' });
  }
};

const updateSantri = async (req, res) => {
  try {
    const { id } = req.params;
    const { nama, email, password, noHp, alamat, namaWali, kelas, isBeasiswa, tanggalMasuk } = req.body;

    const santri = await prisma.santri.findUnique({ where: { id: parseInt(id) } });
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
          NOT: { id: parseInt(id) }
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
      kelas: kelas !== undefined ? kelas : santri.kelas,
      ...(req.body.status && { status: req.body.status }),
      ...(isBeasiswa !== undefined && { isBeasiswa: isBeasiswa === true || isBeasiswa === 'true' }),
      ...(tanggalMasuk !== undefined && { tanggalMasuk: tanggalMasuk ? new Date(tanggalMasuk) : santri.tanggalMasuk })
    };

    if (email !== undefined) {
      updateData.email = email || null;
    }

    if (password) {
      const bcrypt = require('bcryptjs');
      updateData.password = await bcrypt.hash(password, 10);
    }

    const updated = await prisma.santri.update({
      where: { id: parseInt(id) },
      data: updateData,
    });

    const safeSantri = sanitizeUserData(updated);

    res.json({ 
      message: 'Data santri berhasil diperbarui', 
      user: {
        ...safeSantri,
        email: safeSantri.email || '-',
      } 
    });
  } catch (error) {
    console.error('Update santri error:', error);
    res.status(500).json({ message: 'Gagal memperbarui data santri' });
  }
};

const deleteSantri = async (req, res) => {
  try {
    const { id } = req.params;
    const santri = await prisma.santri.findUnique({ where: { id: parseInt(id) } });

    if (!santri) {
      return res.status(404).json({ message: 'Santri tidak ditemukan' });
    }

    await prisma.santri.delete({ where: { id: parseInt(id) } });
    res.json({ message: 'Data santri dan seluruh riwayatnya berhasil dihapus' });
  } catch (error) {
    console.error('Delete santri error:', error);
    res.status(500).json({ message: 'Gagal menghapus data santri' });
  }
};

const getStats = async (req, res) => {
  try {
    const totalSantri = await prisma.santri.count();
    const activeSantri = await prisma.santri.count({ where: { status: 'ACTIVE' } });
    const inactiveSantri = totalSantri - activeSantri;
    const totalSanksi = await prisma.sanksi.count();
    const totalBeasiswa = await prisma.santri.count({ where: { isBeasiswa: true } });

    // Dapatkan data pembayaran SPP bulan ini (misal bulan sekarang)
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    const paidThisMonth = await prisma.pembayaran.count({
      where: {
        bulan: currentMonth,
        tahun: currentYear,
        status: 'LUNAS',
      },
    });

    const unpaidThisMonth = await prisma.pembayaran.count({
      where: {
        bulan: currentMonth,
        tahun: currentYear,
        status: 'BELUM_BAYAR',
      },
    });

    // Ambil data untuk chart statistik per kelas (hanya santri aktif)
    const classes = await prisma.santri.groupBy({
      where: { status: 'ACTIVE' },
      by: ['kelas'],
      _count: {
        id: true,
      },
    });

    res.json({
      totalSantri,
      activeSantri,
      inactiveSantri,
      totalSanksi,
      totalBeasiswa,
      sppStats: {
        bulan: currentMonth,
        tahun: currentYear,
        lunas: paidThisMonth,
        belumBayar: unpaidThisMonth,
      },
      classChart: classes.map(c => ({
        kelas: c.kelas || 'Belum Ditentukan',
        jumlah: c._count.id,
      })),
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Gagal memuat statistik dashboard' });
  }
};

const promoteBulk = async (req, res) => {
  try {
    const { studentIds, nextClass, status } = req.body;
    if (!studentIds || !Array.isArray(studentIds)) {
      return res.status(400).json({ message: 'studentIds harus berupa array' });
    }

    const updateData = {};
    if (nextClass !== undefined) updateData.kelas = nextClass;
    if (status !== undefined) updateData.status = status;

    await prisma.santri.updateMany({
      where: { id: { in: studentIds } },
      data: updateData,
    });

    res.json({ message: 'Kenaikan kelas massal berhasil diproses' });
  } catch (error) {
    console.error('Bulk promote error:', error);
    res.status(500).json({ message: 'Gagal memproses kenaikan kelas massal' });
  }
};

const batchUpdate = async (req, res) => {
  try {
    const { updates } = req.body;
    if (!updates || !Array.isArray(updates)) {
      return res.status(400).json({ message: 'updates harus berupa array' });
    }

    // Jalankan seluruh pembaruan dalam satu transaksi batch agar cepat dan konsisten
    await prisma.$transaction(
      updates.map(u => {
        const data = {};
        if (u.kelas !== undefined) data.kelas = u.kelas;
        if (u.status !== undefined) data.status = u.status;

        return prisma.santri.update({
          where: { id: parseInt(u.id) },
          data
        });
      })
    );

    res.json({ message: 'Pembaruan massal berhasil diproses' });
  } catch (error) {
    console.error('Batch update error:', error);
    res.status(500).json({ message: 'Gagal memproses pembaruan massal' });
  }
};

const uploadFotoProfil = async (req, res) => {
  try {
    const { id } = req.params;
    const targetId = parseInt(id);

    // RBAC check: Harus ADMIN atau Santri bersangkutan yang mengupdate fotonya sendiri
    if (req.user.role !== 'ADMIN' && (req.user.role !== 'SANTRI' || req.user.id !== targetId)) {
      return res.status(403).json({ message: 'Akses ditolak' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Tidak ada file yang diupload' });
    }

    // Convert file buffer ke Base64 data URL
    const fotoBase64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;

    // 1. Jika ADMIN mengedit foto profilnya sendiri (disimpan di tabel User)
    if (req.user.role === 'ADMIN' && targetId === req.user.id) {
      const updatedUser = await prisma.user.update({
        where: { id: targetId },
        data: { fotoProfil: fotoBase64 },
        select: { id: true, nama: true, fotoProfil: true }
      });
      return res.json({ 
        message: 'Foto profil admin berhasil diperbarui', 
        fotoProfil: fotoBase64,
        user: {
          ...updatedUser,
          role: 'ADMIN',
          status: 'ACTIVE'
        } 
      });
    }

    // 2. Selain itu, yang di-update adalah tabel Santri (admin edit santri, atau santri edit fotonya sendiri)
    const santri = await prisma.santri.findUnique({ where: { id: targetId } });
    if (!santri) {
      return res.status(404).json({ message: 'Santri tidak ditemukan' });
    }

    const updated = await prisma.santri.update({
      where: { id: targetId },
      data: { fotoProfil: fotoBase64 },
      select: { id: true, nama: true, email: true, fotoProfil: true }
    });

    res.json({ 
      message: 'Foto profil berhasil diperbarui', 
      fotoProfil: fotoBase64,
      user: {
        ...updated,
        email: updated.email || '-',
        role: 'SANTRI',
        status: santri.status
      } 
    });
  } catch (error) {
    console.error('Upload foto profil error:', error);
    res.status(500).json({ message: error.message || 'Gagal mengupload foto profil' });
  }
};

const deleteFotoProfil = async (req, res) => {
  try {
    const { id } = req.params;
    const targetId = parseInt(id);

    // RBAC check: Harus ADMIN atau Santri bersangkutan yang mengupdate fotonya sendiri
    if (req.user.role !== 'ADMIN' && (req.user.role !== 'SANTRI' || req.user.id !== targetId)) {
      return res.status(403).json({ message: 'Akses ditolak' });
    }

    // 1. Jika ADMIN menghapus foto profilnya sendiri (disimpan di tabel User)
    if (req.user.role === 'ADMIN' && targetId === req.user.id) {
      const updatedUser = await prisma.user.update({
        where: { id: targetId },
        data: { fotoProfil: null },
        select: { id: true, nama: true, fotoProfil: true }
      });
      return res.json({ 
        message: 'Foto profil admin berhasil dihapus', 
        fotoProfil: null,
        user: {
          ...updatedUser,
          role: 'ADMIN',
          status: 'ACTIVE'
        } 
      });
    }

    // 2. Selain itu, yang di-update adalah tabel Santri (admin edit santri, atau santri edit fotonya sendiri)
    const santri = await prisma.santri.findUnique({ where: { id: targetId } });
    if (!santri) {
      return res.status(404).json({ message: 'Santri tidak ditemukan' });
    }

    const updated = await prisma.santri.update({
      where: { id: targetId },
      data: { fotoProfil: null },
      select: { id: true, nama: true, email: true, fotoProfil: true }
    });

    res.json({ 
      message: 'Foto profil berhasil dihapus', 
      fotoProfil: null,
      user: {
        ...updated,
        email: updated.email || '-',
        role: 'SANTRI',
        status: santri.status
      } 
    });
  } catch (error) {
    console.error('Hapus foto profil error:', error);
    res.status(500).json({ message: error.message || 'Gagal menghapus foto profil' });
  }
};

module.exports = {
  getSantriList,
  createSantri,
  updateSantri,
  deleteSantri,
  getStats,
  promoteBulk,
  batchUpdate,
  uploadFotoProfil,
  deleteFotoProfil,
  upload,
};

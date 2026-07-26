const { PrismaClient } = require('@prisma/client');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const prisma = new PrismaClient();

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
      whereClause.OR = [
        { nama: { contains: search, mode: 'insensitive' } },
        { kelas: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (kelas) {
      whereClause.kelas = kelas;
    }

    const santri = await prisma.santri.findMany({
      where: whereClause,
      orderBy: {
        nama: 'asc',
      },
    });

    // Map for frontend compatibility
    const mapped = santri.map(s => ({
      ...s,
      email: '-',
    }));

    res.json(mapped);
  } catch (error) {
    console.error('Get santri error:', error);
    res.status(500).json({ message: 'Gagal mengambil data santri' });
  }
};

const createSantri = async (req, res) => {
  try {
    const { nama, noHp, alamat, namaWali, kelas } = req.body;

    if (!nama) {
      return res.status(400).json({ message: 'Nama wajib diisi' });
    }

    if (noHp) {
      const numericPhone = /^[0-9]+$/;
      if (!numericPhone.test(noHp)) {
        return res.status(400).json({ message: 'Nomor HP harus berupa angka' });
      }
    }

    const newSantri = await prisma.santri.create({
      data: {
        nama,
        noHp,
        alamat,
        namaWali,
        kelas
      }
    });

    res.status(201).json({ 
      message: 'Santri berhasil ditambahkan.', 
      user: {
        ...newSantri,
        email: '-',
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
    const { nama, noHp, alamat, namaWali, kelas } = req.body;

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

    const updated = await prisma.santri.update({
      where: { id: parseInt(id) },
      data: {
        nama: nama || santri.nama,
        noHp: noHp !== undefined ? noHp : santri.noHp,
        alamat: alamat !== undefined ? alamat : santri.alamat,
        namaWali: namaWali !== undefined ? namaWali : santri.namaWali,
        kelas: kelas !== undefined ? kelas : santri.kelas,
        ...(req.body.status && { status: req.body.status }),
      },
    });

    res.json({ 
      message: 'Data santri berhasil diperbarui', 
      user: {
        ...updated,
        email: '-',
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

const uploadFotoProfil = async (req, res) => {
  try {
    const { id } = req.params;
    const targetId = parseInt(id);

    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Akses ditolak' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Tidak ada file yang diupload' });
    }

    // Convert file buffer ke Base64 data URL
    const fotoBase64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;

    // Cek apakah targetId adalah admin yang sedang login
    if (targetId === req.user.id) {
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

    const santri = await prisma.santri.findUnique({ where: { id: targetId } });
    if (!santri) {
      return res.status(404).json({ message: 'Santri tidak ditemukan' });
    }

    const updated = await prisma.santri.update({
      where: { id: targetId },
      data: { fotoProfil: fotoBase64 },
      select: { id: true, nama: true, fotoProfil: true }
    });

    res.json({ 
      message: 'Foto profil berhasil diperbarui', 
      fotoProfil: fotoBase64,
      user: {
        ...updated,
        email: '-',
      } 
    });
  } catch (error) {
    console.error('Upload foto profil error:', error);
    res.status(500).json({ message: error.message || 'Gagal mengupload foto profil' });
  }
};

module.exports = {
  getSantriList,
  createSantri,
  updateSantri,
  deleteSantri,
  getStats,
  uploadFotoProfil,
  upload,
};

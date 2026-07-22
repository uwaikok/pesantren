const { PrismaClient } = require('@prisma/client');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const prisma = new PrismaClient();

// ---- KONFIGURASI MULTER UPLOAD FOTO PROFIL ----
const uploadDir = path.join(__dirname, '../../uploads/foto-profil');
// Buat folder jika belum ada
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Format: user-{id}-{timestamp}{ext}
    const ext = path.extname(file.originalname).toLowerCase();
    const filename = `user-${req.params.id}-${Date.now()}${ext}`;
    cb(null, filename);
  }
});

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

exports.upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // Max 5MB
});

const getSantriList = async (req, res) => {
  try {
    const { search, kelas } = req.query;

    const whereClause = {
      role: 'SANTRI',
    };

    if (search) {
      whereClause.OR = [
        { nama: { contains: search } },
        { kelas: { contains: search } }
      ];
    }

    if (kelas) {
      whereClause.kelas = kelas;
    }

    const santri = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        nama: true,
        email: true,
        noHp: true,
        alamat: true,
        namaWali: true,
        kelas: true,
        status: true,
        createdAt: true,
      },
      orderBy: {
        nama: 'asc',
      },
    });

    res.json(santri);
  } catch (error) {
    console.error('Get santri error:', error);
    res.status(500).json({ message: 'Gagal mengambil data santri' });
  }
};

const getPendingUsers = async (req, res) => {
  try {
    const pendingUsers = await prisma.user.findMany({
      where: { status: 'PENDING' },
      select: {
        id: true,
        nama: true,
        email: true,
        noHp: true,
        alamat: true,
        namaWali: true,
        kelas: true,
        role: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    res.json(pendingUsers);
  } catch (error) {
    console.error('Get pending error:', error);
    res.status(500).json({ message: 'Gagal mengambil data pendaftaran tertunda' });
  }
};

const verifyUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({ where: { id: parseInt(id) } });

    if (!user) {
      return res.status(404).json({ message: 'User tidak ditemukan' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: parseInt(id) },
      data: { status: 'ACTIVE' },
    });

    res.json({ message: `Akun ${updatedUser.nama} berhasil diaktifkan.`, user: updatedUser });
  } catch (error) {
    console.error('Verify user error:', error);
    res.status(500).json({ message: 'Gagal memverifikasi user' });
  }
};

const updateSantri = async (req, res) => {
  try {
    const { id } = req.params;
    const { nama, email, noHp, alamat, namaWali, kelas, status } = req.body;

    const user = await prisma.user.findUnique({ where: { id: parseInt(id) } });
    if (!user) {
      return res.status(404).json({ message: 'Santri tidak ditemukan' });
    }

    if (noHp) {
      const numericPhone = /^[0-9]+$/;
      if (!numericPhone.test(noHp)) {
        return res.status(400).json({ message: 'Nomor HP harus berupa angka' });
      }
    }

    const updated = await prisma.user.update({
      where: { id: parseInt(id) },
      data: {
        nama: nama || user.nama,
        email: email || user.email,
        noHp: noHp || user.noHp,
        alamat: alamat || user.alamat,
        namaWali: namaWali !== undefined ? namaWali : user.namaWali,
        kelas: kelas !== undefined ? kelas : user.kelas,
        status: status || user.status,
      },
    });

    res.json({ message: 'Data santri berhasil diperbarui', user: updated });
  } catch (error) {
    console.error('Update santri error:', error);
    res.status(500).json({ message: 'Gagal memperbarui data santri' });
  }
};

const deleteSantri = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({ where: { id: parseInt(id) } });

    if (!user) {
      return res.status(404).json({ message: 'Santri tidak ditemukan' });
    }

    await prisma.user.delete({ where: { id: parseInt(id) } });
    res.json({ message: 'Data santri dan seluruh riwayatnya berhasil dihapus' });
  } catch (error) {
    console.error('Delete santri error:', error);
    res.status(500).json({ message: 'Gagal menghapus data santri' });
  }
};

const getStats = async (req, res) => {
  try {
    const totalSantri = await prisma.user.count({ where: { role: 'SANTRI' } });
    const activeSantri = await prisma.user.count({ where: { role: 'SANTRI', status: 'ACTIVE' } });
    const pendingSantri = await prisma.user.count({ where: { role: 'SANTRI', status: 'PENDING' } });
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

    // Ambil data untuk chart statistik per kelas
    const classes = await prisma.user.groupBy({
      by: ['kelas'],
      where: { role: 'SANTRI', status: 'ACTIVE' },
      _count: {
        id: true,
      },
    });

    res.json({
      totalSantri,
      activeSantri,
      pendingSantri,
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
    const userId = parseInt(id);

    // Hanya admin atau user sendiri yang boleh mengupload
    if (req.user.role !== 'ADMIN' && req.user.id !== userId) {
      return res.status(403).json({ message: 'Akses ditolak' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Tidak ada file yang diupload' });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ message: 'User tidak ditemukan' });
    }

    // Hapus foto lama jika ada
    if (user.fotoProfil) {
      const oldPath = path.join(__dirname, '../../', user.fotoProfil);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    // Simpan path relatif foto baru
    const fotoPath = `uploads/foto-profil/${req.file.filename}`;

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { fotoProfil: fotoPath },
      select: { id: true, nama: true, fotoProfil: true }
    });

    res.json({ 
      message: 'Foto profil berhasil diperbarui', 
      fotoProfil: fotoPath,
      user: updated 
    });
  } catch (error) {
    console.error('Upload foto profil error:', error);
    res.status(500).json({ message: error.message || 'Gagal mengupload foto profil' });
  }
};

module.exports = {
  getSantriList,
  getPendingUsers,
  verifyUser,
  updateSantri,
  deleteSantri,
  getStats,
  uploadFotoProfil,
};

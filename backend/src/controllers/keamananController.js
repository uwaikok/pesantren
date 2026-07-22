const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const createSanksi = async (req, res) => {
  try {
    const { santriId, tanggalPelanggaran, tahun, deskripsi, kategori } = req.body;

    if (!santriId || !tanggalPelanggaran || !tahun || !deskripsi || !kategori) {
      return res.status(400).json({ message: 'Semua field sanksi wajib diisi' });
    }

    const santri = await prisma.user.findUnique({ where: { id: parseInt(santriId) } });
    if (!santri || santri.role !== 'SANTRI') {
      return res.status(404).json({ message: 'Data santri tidak ditemukan' });
    }

    const newSanksi = await prisma.sanksi.create({
      data: {
        santriId: parseInt(santriId),
        tanggalPelanggaran: new Date(tanggalPelanggaran),
        tahun,
        deskripsi,
        kategori,
      },
    });

    res.status(201).json({ message: 'Pelanggaran berhasil dicatat', data: newSanksi });
  } catch (error) {
    console.error('Create sanksi error:', error);
    res.status(500).json({ message: 'Gagal mencatat pelanggaran' });
  }
};

const updateSanksi = async (req, res) => {
  try {
    const { id } = req.params;
    const { tanggalPelanggaran, tahun, deskripsi, kategori } = req.body;

    const sanksi = await prisma.sanksi.findUnique({ where: { id: parseInt(id) } });
    if (!sanksi) {
      return res.status(404).json({ message: 'Data sanksi tidak ditemukan' });
    }

    const updated = await prisma.sanksi.update({
      where: { id: parseInt(id) },
      data: {
        tanggalPelanggaran: tanggalPelanggaran ? new Date(tanggalPelanggaran) : sanksi.tanggalPelanggaran,
        tahun: tahun || sanksi.tahun,
        deskripsi: deskripsi || sanksi.deskripsi,
        kategori: kategori || sanksi.kategori,
      },
    });

    res.json({ message: 'Sanksi berhasil diperbarui', data: updated });
  } catch (error) {
    console.error('Update sanksi error:', error);
    res.status(500).json({ message: 'Gagal memperbarui sanksi' });
  }
};

const deleteSanksi = async (req, res) => {
  try {
    const { id } = req.params;
    const sanksi = await prisma.sanksi.findUnique({ where: { id: parseInt(id) } });

    if (!sanksi) {
      return res.status(404).json({ message: 'Data sanksi tidak ditemukan' });
    }

    await prisma.sanksi.delete({ where: { id: parseInt(id) } });
    res.json({ message: 'Data sanksi berhasil dihapus' });
  } catch (error) {
    console.error('Delete sanksi error:', error);
    res.status(500).json({ message: 'Gagal menghapus sanksi' });
  }
};

const getSanksiBySantri = async (req, res) => {
  try {
    const { santriId } = req.params;
    const { kategori, tahun } = req.query;

    if (req.user.role !== 'ADMIN' && req.user.id !== parseInt(santriId)) {
      return res.status(403).json({ message: 'Akses ditolak: Anda tidak memiliki wewenang melihat data ini' });
    }

    const whereClause = { santriId: parseInt(santriId) };
    if (kategori) whereClause.kategori = kategori;
    if (tahun) whereClause.tahun = tahun;

    const riwayatSanksi = await prisma.sanksi.findMany({
      where: whereClause,
      orderBy: { tanggalPelanggaran: 'desc' },
    });

    res.json(riwayatSanksi);
  } catch (error) {
    console.error('Get sanksi by santri error:', error);
    res.status(500).json({ message: 'Gagal memuat riwayat sanksi' });
  }
};

const getMySanksi = async (req, res) => {
  try {
    const { kategori, tahun } = req.query;

    const whereClause = { santriId: req.user.id };
    if (kategori) whereClause.kategori = kategori;
    if (tahun) whereClause.tahun = tahun;

    const riwayatSanksi = await prisma.sanksi.findMany({
      where: whereClause,
      orderBy: { tanggalPelanggaran: 'desc' },
    });

    res.json(riwayatSanksi);
  } catch (error) {
    console.error('Get my sanksi error:', error);
    res.status(500).json({ message: 'Gagal memuat riwayat sanksi Anda' });
  }
};

module.exports = {
  createSanksi,
  updateSanksi,
  deleteSanksi,
  getSanksiBySantri,
  getMySanksi,
};

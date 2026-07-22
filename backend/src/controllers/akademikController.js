const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const createNilai = async (req, res) => {
  try {
    const { santriId, mataPelajaran, nilaiUts, nilaiUas, semester, tahunAjaran } = req.body;

    if (!santriId || !mataPelajaran || nilaiUts === undefined || nilaiUas === undefined || !semester || !tahunAjaran) {
      return res.status(400).json({ message: 'Semua field akademik wajib diisi' });
    }

    // Pastikan santri ada
    const santri = await prisma.user.findUnique({ where: { id: parseInt(santriId) } });
    if (!santri || santri.role !== 'SANTRI') {
      return res.status(404).json({ message: 'Data santri tidak ditemukan' });
    }

    const newNilai = await prisma.nilai.create({
      data: {
        santriId: parseInt(santriId),
        mataPelajaran,
        nilaiUts: parseFloat(nilaiUts),
        nilaiUas: parseFloat(nilaiUas),
        semester,
        tahunAjaran,
      },
    });

    res.status(201).json({ message: 'Nilai berhasil diinput', data: newNilai });
  } catch (error) {
    console.error('Create nilai error:', error);
    res.status(500).json({ message: 'Gagal menginput nilai akademik' });
  }
};

const updateNilai = async (req, res) => {
  try {
    const { id } = req.params;
    const { mataPelajaran, nilaiUts, nilaiUas, semester, tahunAjaran } = req.body;

    const nilai = await prisma.nilai.findUnique({ where: { id: parseInt(id) } });
    if (!nilai) {
      return res.status(404).json({ message: 'Data nilai tidak ditemukan' });
    }

    const updated = await prisma.nilai.update({
      where: { id: parseInt(id) },
      data: {
        mataPelajaran: mataPelajaran || nilai.mataPelajaran,
        nilaiUts: nilaiUts !== undefined ? parseFloat(nilaiUts) : nilai.nilaiUts,
        nilaiUas: nilaiUas !== undefined ? parseFloat(nilaiUas) : nilai.nilaiUas,
        semester: semester || nilai.semester,
        tahunAjaran: tahunAjaran || nilai.tahunAjaran,
      },
    });

    res.json({ message: 'Nilai berhasil diperbarui', data: updated });
  } catch (error) {
    console.error('Update nilai error:', error);
    res.status(500).json({ message: 'Gagal memperbarui nilai akademik' });
  }
};

const deleteNilai = async (req, res) => {
  try {
    const { id } = req.params;
    const nilai = await prisma.nilai.findUnique({ where: { id: parseInt(id) } });

    if (!nilai) {
      return res.status(404).json({ message: 'Data nilai tidak ditemukan' });
    }

    await prisma.nilai.delete({ where: { id: parseInt(id) } });
    res.json({ message: 'Data nilai berhasil dihapus' });
  } catch (error) {
    console.error('Delete nilai error:', error);
    res.status(500).json({ message: 'Gagal menghapus nilai akademik' });
  }
};

const getNilaiBySantri = async (req, res) => {
  try {
    const { santriId } = req.params;
    const { tahunAjaran, semester } = req.query;

    // RBAC check: Jika bukan admin, hanya boleh akses nilai sendiri
    if (req.user.role !== 'ADMIN' && req.user.id !== parseInt(santriId)) {
      return res.status(403).json({ message: 'Akses ditolak: Anda tidak memiliki wewenang melihat data ini' });
    }

    const whereClause = { santriId: parseInt(santriId) };
    if (tahunAjaran) whereClause.tahunAjaran = tahunAjaran;
    if (semester) whereClause.semester = semester;

    const riwayatNilai = await prisma.nilai.findMany({
      where: whereClause,
      orderBy: { mataPelajaran: 'asc' },
    });

    res.json(riwayatNilai);
  } catch (error) {
    console.error('Get nilai by santri error:', error);
    res.status(500).json({ message: 'Gagal memuat riwayat nilai' });
  }
};

const getMyNilai = async (req, res) => {
  try {
    const { tahunAjaran, semester } = req.query;
    const whereClause = { santriId: req.user.id };
    if (tahunAjaran) whereClause.tahunAjaran = tahunAjaran;
    if (semester) whereClause.semester = semester;

    const riwayatNilai = await prisma.nilai.findMany({
      where: whereClause,
      orderBy: { mataPelajaran: 'asc' },
    });

    res.json(riwayatNilai);
  } catch (error) {
    console.error('Get my nilai error:', error);
    res.status(500).json({ message: 'Gagal memuat riwayat nilai Anda' });
  }
};

module.exports = {
  createNilai,
  updateNilai,
  deleteNilai,
  getNilaiBySantri,
  getMyNilai,
};

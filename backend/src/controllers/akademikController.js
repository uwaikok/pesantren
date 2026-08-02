const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Helper: normalisasi pemisah desimal (koma → titik) sebelum parseFloat
// Ini memastikan nilai "85,5" yang dikirim frontend dapat dibaca dengan benar
const normalizeNilai = (val) => {
  if (val === null || val === undefined || val === '') return null;
  const str = String(val).replace(',', '.').trim();
  const num = parseFloat(str);
  return isNaN(num) ? null : Math.min(100, Math.max(0, num));
};

const createNilai = async (req, res) => {
  try {
    const { santriId, mataPelajaran, nilaiUts, nilaiUas, semester, tahunAjaran } = req.body;

    if (!santriId || !mataPelajaran || !semester || !tahunAjaran) {
      return res.status(400).json({ message: 'Field santriId, mataPelajaran, semester, dan tahunAjaran wajib diisi' });
    }
    if (nilaiUts === undefined && nilaiUas === undefined) {
      return res.status(400).json({ message: 'Minimal salah satu nilai (UTS atau UAS) harus diisi' });
    }

    // Normalisasi koma → titik untuk mendukung input desimal dari frontend
    const utsValue = normalizeNilai(nilaiUts);
    const uasValue = normalizeNilai(nilaiUas);

    // Pastikan santri ada
    const santri = await prisma.santri.findUnique({ where: { id: parseInt(santriId) } });
    if (!santri) {
      return res.status(404).json({ message: 'Data santri tidak ditemukan' });
    }

    // ⭐ UPSERT CONCURRENCY-SAFE: Cek apakah mapel ini sudah ada untuk santri+semester+tahun yang sama
    // Jika 2 admin menginput bersamaan, keduanya akan diarahkan ke entri yang sama (merge) — tidak ada bentrok
    const existing = await prisma.nilai.findFirst({
      where: {
        santriId: parseInt(santriId),
        mataPelajaran: { equals: mataPelajaran, mode: 'insensitive' },
        semester,
        tahunAjaran,
      },
    });

    if (existing) {
      // Sudah ada → gabungkan nilai (pakai nilai baru, kalau null pertahankan lama)
      // Aman untuk 2 admin sekaligus: operasi ini idempotent
      const merged = await prisma.nilai.update({
        where: { id: existing.id },
        data: {
          nilaiUts: utsValue !== null ? utsValue : existing.nilaiUts,
          nilaiUas: uasValue !== null ? uasValue : existing.nilaiUas,
        },
      });
      return res.status(200).json({ message: 'Nilai digabungkan ke entri yang sudah ada', data: merged });
    }

    // Belum ada → buat entri baru
    // Jika 2 admin submit hampir bersamaan → salah satu akan mendapatkan unique conflict dan diarahkan ke upsert di atas
    const newNilai = await prisma.nilai.create({
      data: {
        santriId: parseInt(santriId),
        mataPelajaran,
        nilaiUts: utsValue,
        nilaiUas: uasValue,
        semester,
        tahunAjaran,
      },
    });

    res.status(201).json({ message: 'Nilai berhasil diinput', data: newNilai });
  } catch (error) {
    // Tangani race condition: jika 2 admin submit tepat bersamaan dan create duplicate terjadi,
    // retry dengan upsert (merge ke entri yang sudah ada)
    if (error.code === 'P2002') {
      try {
        const { santriId, mataPelajaran, nilaiUts, nilaiUas, semester, tahunAjaran } = req.body;
        const utsValue = normalizeNilai(nilaiUts);
        const uasValue = normalizeNilai(nilaiUas);
        const existing = await prisma.nilai.findFirst({
          where: { santriId: parseInt(santriId), mataPelajaran: { equals: mataPelajaran, mode: 'insensitive' }, semester, tahunAjaran },
        });
        if (existing) {
          const merged = await prisma.nilai.update({
            where: { id: existing.id },
            data: {
              nilaiUts: utsValue !== null ? utsValue : existing.nilaiUts,
              nilaiUas: uasValue !== null ? uasValue : existing.nilaiUas,
            },
          });
          return res.status(200).json({ message: 'Nilai digabungkan (race condition handled)', data: merged });
        }
      } catch (retryErr) {
        console.error('Retry upsert error:', retryErr);
      }
    }
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

    // Jika field dikirim (termasuk null), gunakan nilai baru; jika tidak dikirim (undefined), pakai yang lama
    const utsValue = nilaiUts !== undefined
      ? (nilaiUts !== null ? parseFloat(nilaiUts) : null)
      : nilai.nilaiUts;
    const uasValue = nilaiUas !== undefined
      ? (nilaiUas !== null ? parseFloat(nilaiUas) : null)
      : nilai.nilaiUas;

    const updated = await prisma.nilai.update({
      where: { id: parseInt(id) },
      data: {
        mataPelajaran: mataPelajaran || nilai.mataPelajaran,
        nilaiUts: utsValue,
        nilaiUas: uasValue,
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

    // RBAC check: Hanya boleh diakses oleh admin
    if (req.user.role !== 'ADMIN') {
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
    const santriId = req.user.id;
    const { tahunAjaran, semester } = req.query;

    const whereClause = { santriId };
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

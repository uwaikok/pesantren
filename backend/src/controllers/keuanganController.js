const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const DEFAULT_SPP_AMOUNT = 350000; // Rp 350.000 per bulan sebagai default SPP

const createOrUpdatePembayaran = async (req, res) => {
  try {
    const { santriId, bulan, tahun, status, jumlah, tanggalBayar } = req.body;

    if (!santriId || !bulan || !tahun || !status) {
      return res.status(400).json({ message: 'Field santriId, bulan, tahun, dan status wajib diisi' });
    }

    const m = parseInt(bulan);
    if (m < 1 || m > 12) {
      return res.status(400).json({ message: 'Bulan harus bernilai antara 1 sampai 12' });
    }

    const santri = await prisma.santri.findUnique({ where: { id: parseInt(santriId) } });
    if (!santri) {
      return res.status(404).json({ message: 'Data santri tidak ditemukan' });
    }

    const finalJumlah = jumlah !== undefined ? parseFloat(jumlah) : DEFAULT_SPP_AMOUNT;
    const finalTanggal = status === 'LUNAS' ? (tanggalBayar ? new Date(tanggalBayar) : new Date()) : null;

    const payment = await prisma.pembayaran.upsert({
      where: {
        santriId_bulan_tahun: {
          santriId: parseInt(santriId),
          bulan: m,
          tahun: parseInt(tahun),
        },
      },
      update: {
        status,
        jumlah: finalJumlah,
        tanggalBayar: finalTanggal,
      },
      create: {
        santriId: parseInt(santriId),
        bulan: m,
        tahun: parseInt(tahun),
        status,
        jumlah: finalJumlah,
        tanggalBayar: finalTanggal,
      },
    });

    res.json({ message: 'Pembayaran SPP berhasil disimpan', data: payment });
  } catch (error) {
    console.error('Save pembayaran error:', error);
    res.status(500).json({ message: 'Gagal memproses pembayaran SPP' });
  }
};

const getRiwayatPembayaran = async (req, res) => {
  try {
    const { santriId } = req.params;
    const { tahun } = req.query;

    const targetTahun = tahun ? parseInt(tahun) : new Date().getFullYear();

    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Akses ditolak: Anda tidak memiliki wewenang melihat data ini' });
    }

    // Ambil semua data pembayaran yang terdaftar di DB untuk tahun tersebut
    const databasePayments = await prisma.pembayaran.findMany({
      where: {
        santriId: parseInt(santriId),
        tahun: targetTahun,
      },
    });

    // Peta kan 1 sampai 12 bulan
    const paymentsList = [];
    let totalTunggakan = 0;
    let totalTerbayar = 0;

    for (let m = 1; m <= 12; m++) {
      const dbRecord = databasePayments.find(p => p.bulan === m);
      if (dbRecord) {
        paymentsList.push(dbRecord);
        if (dbRecord.status === 'LUNAS') {
          totalTerbayar += dbRecord.jumlah;
        } else {
          totalTunggakan += dbRecord.jumlah;
        }
      } else {
        // Jika belum ada di DB, asumsikan BELUM_BAYAR
        paymentsList.push({
          id: null,
          santriId: parseInt(santriId),
          bulan: m,
          tahun: targetTahun,
          status: 'BELUM_BAYAR',
          tanggalBayar: null,
          jumlah: DEFAULT_SPP_AMOUNT,
        });
        totalTunggakan += DEFAULT_SPP_AMOUNT;
      }
    }

    res.json({
      santriId: parseInt(santriId),
      tahun: targetTahun,
      totalTunggakan,
      totalTerbayar,
      payments: paymentsList,
    });
  } catch (error) {
    console.error('Get riwayat pembayaran error:', error);
    res.status(500).json({ message: 'Gagal memuat riwayat pembayaran' });
  }
};

const getMyPembayaran = async (req, res) => {
  return res.status(403).json({ message: 'Fitur santri dinonaktifkan pada versi server local' });
};

module.exports = {
  createOrUpdatePembayaran,
  getRiwayatPembayaran,
  getMyPembayaran,
};

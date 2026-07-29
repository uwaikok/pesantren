const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const DEFAULT_SPP_AMOUNT = 300000; // Rp 300.000 per bulan sebagai default SPP

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

// Helper: tentukan bulan awal berdasarkan tanggalMasuk dan tahun yang diminta
const getStartMonth = (tanggalMasuk, targetTahun) => {
  if (!tanggalMasuk) return 1; // Default: mulai dari Januari
  const masuk = new Date(tanggalMasuk);
  const tahunMasuk = masuk.getFullYear();
  const bulanMasuk = masuk.getMonth() + 1; // 1-12

  if (tahunMasuk > targetTahun) {
    // Santri belum masuk di tahun ini, tidak ada bulan yang perlu ditampilkan
    return 13; // Nilai sentinel: tidak ada bulan
  } else if (tahunMasuk === targetTahun) {
    // Mulai dari bulan masuk
    return bulanMasuk;
  } else {
    // Santri sudah masuk sebelum tahun ini, mulai dari Januari
    return 1;
  }
};

// Helper: cek apakah suatu bulan dalam target tahun sudah jatuh tempo (due) dibanding waktu saat ini
const isMonthDue = (m, targetTahun) => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-12

  if (targetTahun < currentYear) {
    return true; // Tahun-tahun sebelumnya sudah jatuh tempo semua
  } else if (targetTahun === currentYear) {
    return m <= currentMonth; // Tahun berjalan jatuh tempo hanya sampai bulan berjalan saat ini
  } else {
    return false; // Tahun masa depan belum jatuh tempo sama sekali
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

    const santri = await prisma.santri.findUnique({ where: { id: parseInt(santriId) } });
    if (!santri) {
      return res.status(404).json({ message: 'Data santri tidak ditemukan' });
    }

    // Ambil semua data pembayaran yang terdaftar di DB untuk tahun tersebut
    const databasePayments = await prisma.pembayaran.findMany({
      where: {
        santriId: parseInt(santriId),
        tahun: targetTahun,
      },
    });

    const startMonth = getStartMonth(santri.tanggalMasuk, targetTahun);

    // Peta kan bulan mulai dari bulan masuk santri
    const paymentsList = [];
    let totalTunggakan = 0;
    let totalTerbayar = 0;

    for (let m = startMonth; m <= 12; m++) {
      const dbRecord = databasePayments.find(p => p.bulan === m);
      if (dbRecord) {
        paymentsList.push(dbRecord);
        if (dbRecord.status === 'LUNAS') {
          totalTerbayar += dbRecord.jumlah;
        } else {
          // Hanya hitung ke tunggakan jika bulan sudah jatuh tempo
          if (isMonthDue(m, targetTahun)) {
            totalTunggakan += dbRecord.jumlah;
          }
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
        // Hanya hitung ke tunggakan jika bulan sudah jatuh tempo
        if (isMonthDue(m, targetTahun)) {
          totalTunggakan += DEFAULT_SPP_AMOUNT;
        }
      }
    }

    // Penerima beasiswa bebas biaya syariah (tunggakan = 0)
    if (santri.isBeasiswa === true || santri.isBeasiswa === 'true') {
      totalTunggakan = 0;
    }

    res.json({
      santriId: parseInt(santriId),
      tahun: targetTahun,
      tanggalMasuk: santri.tanggalMasuk,
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
  try {
    const santriId = req.user.id;
    const { tahun } = req.query;

    const targetTahun = tahun ? parseInt(tahun) : new Date().getFullYear();

    const santri = await prisma.santri.findUnique({ where: { id: parseInt(santriId) } });

    // Ambil semua data pembayaran yang terdaftar di DB untuk tahun tersebut
    const databasePayments = await prisma.pembayaran.findMany({
      where: {
        santriId: parseInt(santriId),
        tahun: targetTahun,
      },
    });

    const startMonth = santri ? getStartMonth(santri.tanggalMasuk, targetTahun) : 1;

    // Peta kan bulan mulai dari bulan masuk santri
    const paymentsList = [];
    let totalTunggakan = 0;
    let totalTerbayar = 0;

    for (let m = startMonth; m <= 12; m++) {
      const dbRecord = databasePayments.find(p => p.bulan === m);
      if (dbRecord) {
        paymentsList.push(dbRecord);
        if (dbRecord.status === 'LUNAS') {
          totalTerbayar += dbRecord.jumlah;
        } else {
          // Hanya hitung ke tunggakan jika bulan sudah jatuh tempo
          if (isMonthDue(m, targetTahun)) {
            totalTunggakan += dbRecord.jumlah;
          }
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
        // Hanya hitung ke tunggakan jika bulan sudah jatuh tempo
        if (isMonthDue(m, targetTahun)) {
          totalTunggakan += DEFAULT_SPP_AMOUNT;
        }
      }
    }

    // Penerima beasiswa bebas biaya syariah (tunggakan = 0)
    if (santri && (santri.isBeasiswa === true || santri.isBeasiswa === 'true')) {
      totalTunggakan = 0;
    }

    res.json({
      santriId: parseInt(santriId),
      tahun: targetTahun,
      tanggalMasuk: santri ? santri.tanggalMasuk : null,
      totalTunggakan,
      totalTerbayar,
      payments: paymentsList,
    });
  } catch (error) {
    console.error('Get my pembayaran error:', error);
    res.status(500).json({ message: 'Gagal memuat riwayat pembayaran Anda' });
  }
};

module.exports = {
  createOrUpdatePembayaran,
  getRiwayatPembayaran,
  getMyPembayaran,
};

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  console.log('Memulai seeding database...');

  // Hapus data lama jika ada (urutan child dulu baru parent)
  await prisma.nilai.deleteMany({});
  await prisma.sanksi.deleteMany({});
  await prisma.pembayaran.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.santri.deleteMany({});

  // Hash password
  const adminPassword = await bcrypt.hash('adminpassword', 10);
  const adminPassword2 = await bcrypt.hash('admin2password', 10);

  // 1. Buat User Admin
  const admin = await prisma.user.create({
    data: {
      nama: 'RIFKI AHMAD DZULFIKRI',
      email: 'admin@pesantren.com',
      password: adminPassword,
      noHp: '081234567890',
      alamat: 'Komplek Pesantren Miftahul Huda As-Syadzili No. 1',
    },
  });

  const admin2 = await prisma.user.create({
    data: {
      nama: 'ADMIN KEDUA',
      email: 'admin2@pesantren.com',
      password: adminPassword2,
      noHp: '081234567891',
      alamat: 'Komplek Pesantren Miftahul Huda As-Syadzili No. 2',
    },
  });
  console.log('Admin dibuat: admin@pesantren.com / adminpassword');
  console.log('Admin kedua dibuat: admin2@pesantren.com / admin2password');

  // 2. Buat Santri
  const santri1 = await prisma.santri.create({
    data: {
      nama: 'Ahmad Fauzi',
      noHp: '081223344556',
      alamat: 'Jl. Melati No. 12, Kebayoran Baru, Jakarta Selatan',
      namaWali: 'Bp. Slamet Fauzi',
      kelas: 'Tsanawi 3',
    },
  });

  const santri2 = await prisma.santri.create({
    data: {
      nama: 'Siti Aisyah',
      noHp: '085778899001',
      alamat: 'Jl. Mawar Gg. Masjid No. 4, Ujungberung, Bandung',
      namaWali: 'Ibu Hajah Aminah',
      kelas: 'Ibtida 3',
    },
  });

  const santri3 = await prisma.santri.create({
    data: {
      nama: 'Muhammad Yusuf',
      noHp: '089911223344',
      alamat: 'Dusun Sukamaju RT 02 RW 05, Ciamis',
      namaWali: 'Bp. H. Abdul Ghofur',
      kelas: 'Imdad Putra',
    },
  });

  const santri4 = await prisma.santri.create({
    data: {
      nama: 'Fatimah Azzahra',
      noHp: '081399887766',
      alamat: 'Perum Permata Indah Blok C/10, Sleman, Yogyakarta',
      namaWali: 'Bp. Rahmat Hadi',
      kelas: 'Imdad Putri',
    },
  });
  console.log('Santri dibuat: Ahmad Fauzi, Siti Aisyah, Muhammad Yusuf, Fatimah Azzahra');

  // 4. Seeding Nilai Akademik
  // Ahmad Fauzi - Semester Ganjil 2025/2026
  await prisma.nilai.createMany({
    data: [
      { santriId: santri1.id, mataPelajaran: 'Al-Qur\'an & Tajwid', nilaiUts: 85, nilaiUas: 90, semester: 'GANJIL', tahunAjaran: '2025/2026' },
      { santriId: santri1.id, mataPelajaran: 'Fiqih Ibadah', nilaiUts: 80, nilaiUas: 88, semester: 'GANJIL', tahunAjaran: '2025/2026' },
      { santriId: santri1.id, mataPelajaran: 'Bahasa Arab (Nahwu)', nilaiUts: 72, nilaiUas: 78, semester: 'GANJIL', tahunAjaran: '2025/2026' },
      { santriId: santri1.id, mataPelajaran: 'Aqidah Akhlak', nilaiUts: 90, nilaiUas: 92, semester: 'GANJIL', tahunAjaran: '2025/2026' },
    ],
  });

  // Ahmad Fauzi - Semester Genap 2025/2026
  await prisma.nilai.createMany({
    data: [
      { santriId: santri1.id, mataPelajaran: 'Al-Qur\'an & Tajwid', nilaiUts: 88, nilaiUas: 92, semester: 'GENAP', tahunAjaran: '2025/2026' },
      { santriId: santri1.id, mataPelajaran: 'Fiqih Ibadah', nilaiUts: 82, nilaiUas: 85, semester: 'GENAP', tahunAjaran: '2025/2026' },
      { santriId: santri1.id, mataPelajaran: 'Bahasa Arab (Nahwu)', nilaiUts: 78, nilaiUas: 82, semester: 'GENAP', tahunAjaran: '2025/2026' },
      { santriId: santri1.id, mataPelajaran: 'Aqidah Akhlak', nilaiUts: 88, nilaiUas: 90, semester: 'GENAP', tahunAjaran: '2025/2026' },
    ],
  });

  // Siti Aisyah - Semester Ganjil 2025/2026
  await prisma.nilai.createMany({
    data: [
      { santriId: santri2.id, mataPelajaran: 'Al-Qur\'an & Tajwid', nilaiUts: 95, nilaiUas: 96, semester: 'GANJIL', tahunAjaran: '2025/2026' },
      { santriId: santri2.id, mataPelajaran: 'Fiqih Ibadah', nilaiUts: 88, nilaiUas: 92, semester: 'GANJIL', tahunAjaran: '2025/2026' },
      { santriId: santri2.id, mataPelajaran: 'Bahasa Arab (Nahwu)', nilaiUts: 85, nilaiUas: 90, semester: 'GANJIL', tahunAjaran: '2025/2026' },
      { santriId: santri2.id, mataPelajaran: 'Aqidah Akhlak', nilaiUts: 92, nilaiUas: 95, semester: 'GANJIL', tahunAjaran: '2025/2026' },
    ],
  });
  console.log('Seeding nilai akademik berhasil.');

  // 5. Seeding Keamanan (Sanksi)
  await prisma.sanksi.create({
    data: {
      santriId: santri1.id,
      tanggalPelanggaran: new Date('2026-02-14'),
      tahun: '2025/2026',
      deskripsi: 'Terlambat shalat jamaah Subuh di masjid sebanyak 3 kali berturut-turut.',
      kategori: 'RINGAN',
    },
  });

  await prisma.sanksi.create({
    data: {
      santriId: santri1.id,
      tanggalPelanggaran: new Date('2026-04-10'),
      tahun: '2025/2026',
      deskripsi: 'Kedapatan menyimpan handphone pribadi tanpa surat izin tertulis dari pengasuh.',
      kategori: 'SEDANG',
    },
  });

  await prisma.sanksi.create({
    data: {
      santriId: santri2.id,
      tanggalPelanggaran: new Date('2026-05-20'),
      tahun: '2025/2026',
      deskripsi: 'Keluar komplek pesantren putri tanpa jilbab / melebihi batas waktu izin keluar (terlambat 2 jam).',
      kategori: 'SEDANG',
    },
  });
  console.log('Seeding data sanksi keamanan berhasil.');

  // 6. Seeding Keuangan (Pembayaran SPP tahun 2026)
  // Ahmad Fauzi (Jan-Feb Lunas, Mar Belum Bayar, Apr Lunas, Mei-Des Belum Bayar)
  await prisma.pembayaran.createMany({
    data: [
      { santriId: santri1.id, bulan: 1, tahun: 2026, status: 'LUNAS', tanggalBayar: new Date('2026-01-05'), jumlah: 300000 },
      { santriId: santri1.id, bulan: 2, tahun: 2026, status: 'LUNAS', tanggalBayar: new Date('2026-02-04'), jumlah: 300000 },
      { santriId: santri1.id, bulan: 3, tahun: 2026, status: 'BELUM_BAYAR', tanggalBayar: null, jumlah: 300000 },
      { santriId: santri1.id, bulan: 4, tahun: 2026, status: 'LUNAS', tanggalBayar: new Date('2026-04-06'), jumlah: 300000 },
    ],
  });

  // Siti Aisyah (Jan-Mei Lunas, Sisanya belum)
  await prisma.pembayaran.createMany({
    data: [
      { santriId: santri2.id, bulan: 1, tahun: 2026, status: 'LUNAS', tanggalBayar: new Date('2026-01-08'), jumlah: 300000 },
      { santriId: santri2.id, bulan: 2, tahun: 2026, status: 'LUNAS', tanggalBayar: new Date('2026-02-07'), jumlah: 300000 },
      { santriId: santri2.id, bulan: 3, tahun: 2026, status: 'LUNAS', tanggalBayar: new Date('2026-03-05'), jumlah: 300000 },
      { santriId: santri2.id, bulan: 4, tahun: 2026, status: 'LUNAS', tanggalBayar: new Date('2026-04-04'), jumlah: 300000 },
      { santriId: santri2.id, bulan: 5, tahun: 2026, status: 'LUNAS', tanggalBayar: new Date('2026-05-02'), jumlah: 300000 },
    ],
  });
  console.log('Seeding data keuangan SPP berhasil.');

  // 7. Seeding Data Notifikasi Awal
  await prisma.notification.create({
    data: {
      judul: 'Pengumuman Ujian Semester Genap',
      isi: 'Ujian Akhir Semester Genap dijadwalkan mulai tanggal 10 Agustus 2026. Harap seluruh santri mempersiapkan administrasi dan kartu ujian.',
      kategori: 'UJIAN',
      santriId: null,
      isRead: false
    }
  });
  console.log('Seeding data notifikasi awal berhasil.');

  console.log('Database seeding selesai dengan sukses!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

/**
 * Script ini HANYA mengecek jumlah data dan menambahkan admin jika belum ada.
 * TIDAK AKAN MENGHAPUS data santri yang sudah ada.
 */
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  console.log('=== CEK DATABASE ===');
  
  // Hitung semua data
  const santriCount = await prisma.santri.count();
  const userCount = await prisma.user.count();
  const nilaiCount = await prisma.nilai.count();
  const sanksiCount = await prisma.sanksi.count();
  const pembayaranCount = await prisma.pembayaran.count();
  
  console.log('Santri:', santriCount);
  console.log('User (Admin):', userCount);
  console.log('Nilai:', nilaiCount);
  console.log('Sanksi:', sanksiCount);
  console.log('Pembayaran:', pembayaranCount);
  
  if (santriCount === 0) {
    console.log('\n❌ DATABASE KOSONG - restore belum berhasil!');
    return;
  }
  
  console.log('\n✅ Data santri ditemukan!');
  
  // Cek apakah admin sudah ada
  const adminExist = await prisma.user.findFirst({
    where: { email: 'admin@pesantren.com' }
  });
  
  if (adminExist) {
    console.log('✅ Admin sudah ada:', adminExist.email);
  } else {
    console.log('⚠️  Admin belum ada, membuat admin baru...');
    const hashedPassword = await bcrypt.hash('adminpassword', 10);
    const newAdmin = await prisma.user.create({
      data: {
        nama: 'RIFKI AHMAD DZULFIKRI',
        email: 'admin@pesantren.com',
        password: hashedPassword,
        noHp: '081234567890',
        alamat: 'Komplek Pesantren Miftahul Huda As-Syadzili No. 1',
      }
    });
    console.log('✅ Admin berhasil dibuat:', newAdmin.email);
  }
  
  // Tampilkan 3 santri pertama sebagai sample
  const samples = await prisma.santri.findMany({ take: 3 });
  console.log('\nSample santri:');
  samples.forEach(s => console.log(' -', s.nama, '| Kelas:', s.kelas || '-'));
}

main()
  .catch(e => console.error('ERROR:', e.message))
  .finally(() => prisma.$disconnect());

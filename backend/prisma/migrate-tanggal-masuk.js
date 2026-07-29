// Script untuk mengisi tanggalMasuk dari createdAt untuk santri yang sudah ada
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrateExistingSantri() {
  console.log('Memperbarui tanggalMasuk untuk santri yang sudah ada...');
  
  const santriList = await prisma.santri.findMany({
    where: { tanggalMasuk: null }
  });
  
  console.log(`Ditemukan ${santriList.length} santri tanpa tanggalMasuk.`);
  
  for (const santri of santriList) {
    await prisma.santri.update({
      where: { id: santri.id },
      data: { tanggalMasuk: santri.createdAt }
    });
    console.log(`✓ Updated: ${santri.nama} → tanggalMasuk: ${santri.createdAt.toISOString().split('T')[0]}`);
  }
  
  console.log('Selesai!');
  await prisma.$disconnect();
}

migrateExistingSantri().catch(console.error);

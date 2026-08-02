const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Memulai konversi nilai dari skala 100 ke skala 10...');
  
  const allNilai = await prisma.nilai.findMany();
  console.log(`Menemukan ${allNilai.length} entri nilai.`);

  let updatedCount = 0;

  for (const n of allNilai) {
    let needsUpdate = false;
    let newUts = n.nilaiUts;
    let newUas = n.nilaiUas;

    // Jika nilai UTS > 10, bagi dengan 10
    if (n.nilaiUts !== null && n.nilaiUts > 10) {
      newUts = parseFloat((n.nilaiUts / 10).toFixed(2));
      needsUpdate = true;
    }

    // Jika nilai UAS > 10, bagi dengan 10
    if (n.nilaiUas !== null && n.nilaiUas > 10) {
      newUas = parseFloat((n.nilaiUas / 10).toFixed(2));
      needsUpdate = true;
    }

    if (needsUpdate) {
      await prisma.nilai.update({
        where: { id: n.id },
        data: {
          nilaiUts: newUts,
          nilaiUas: newUas
        }
      });
      updatedCount++;
    }
  }

  console.log(`Konversi selesai! ${updatedCount} entri nilai telah disesuaikan menjadi skala 10.`);
}

main()
  .catch((e) => {
    console.error('Error saat konversi:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

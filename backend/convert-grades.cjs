// Script konversi nilai dari skala 100 ke skala 10
// Jalankan dari folder backend: node convert-grades.cjs
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

    // Jika nilai UTS > 10, berarti masih di skala 100 → bagi 10
    if (n.nilaiUts !== null && n.nilaiUts > 10) {
      newUts = parseFloat((n.nilaiUts / 10).toFixed(2));
      needsUpdate = true;
      console.log(`  [ID ${n.id}] UTS: ${n.nilaiUts} → ${newUts}`);
    }

    // Jika nilai UAS > 10, berarti masih di skala 100 → bagi 10
    if (n.nilaiUas !== null && n.nilaiUas > 10) {
      newUas = parseFloat((n.nilaiUas / 10).toFixed(2));
      needsUpdate = true;
      console.log(`  [ID ${n.id}] UAS: ${n.nilaiUas} → ${newUas}`);
    }

    if (needsUpdate) {
      await prisma.nilai.update({
        where: { id: n.id },
        data: { nilaiUts: newUts, nilaiUas: newUas }
      });
      updatedCount++;
    }
  }

  console.log(`\nKonversi selesai! ${updatedCount} dari ${allNilai.length} entri nilai disesuaikan ke skala 10.`);
}

main()
  .catch((e) => {
    console.error('Error saat konversi:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

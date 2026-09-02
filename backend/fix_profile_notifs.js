const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Lihat notif perubahan profil yang belum ada ID:
  const profilNotifs = await prisma.notification.findMany({
    where: {
      judul: { startsWith: 'Perubahan Profil Santri:' },
      santriId: -1
    },
    select: { id: true, judul: true, isi: true }
  });
  
  console.log('=== Notif Perubahan Profil ===');
  console.log(JSON.stringify(profilNotifs, null, 2));

  // Fix notif yang tidak punya ID: di isinya
  const allSantri = await prisma.santri.findMany({
    select: { id: true, nama: true }
  });

  let fixedCount = 0;
  for (const notif of profilNotifs) {
    // Cek apakah sudah ada ID:
    const hasId = /ID:\s*\d+/i.test(notif.isi);
    if (!hasId) {
      // Ekstrak nama dari judul "Perubahan Profil Santri: [Nama]"
      const namaMatch = notif.judul.match(/^Perubahan Profil Santri:\s*(.+)$/i);
      if (namaMatch) {
        const namaFromJudul = namaMatch[1].trim();
        // Cari santri berdasarkan nama
        const matchedSantri = allSantri.find(s => 
          s.nama.toLowerCase().trim() === namaFromJudul.toLowerCase().trim()
        );
        if (matchedSantri) {
          // Update isi notif agar menyertakan ID
          const newIsi = notif.isi.replace(
            `Santri ${matchedSantri.nama}`,
            `Santri ${matchedSantri.nama} (ID: ${matchedSantri.id})`
          );
          await prisma.notification.update({
            where: { id: notif.id },
            data: { isi: newIsi }
          });
          console.log(`Fixed notif ${notif.id}: added ID ${matchedSantri.id} for "${matchedSantri.nama}"`);
          fixedCount++;
        } else {
          console.log(`Could not find santri for notif ${notif.id}: "${namaFromJudul}"`);
        }
      }
    } else {
      console.log(`Notif ${notif.id} already has ID, skipping`);
    }
  }
  console.log(`\nTotal fixed: ${fixedCount}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

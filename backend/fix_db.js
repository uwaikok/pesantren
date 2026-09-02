const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const fixes = [
    { id: 98, santriId: 387, nama: "Muhamad Rifki Rabani" },
    { id: 70, santriId: 374, nama: "Qisti Teri yaltaqiyani" },
    { id: 76, santriId: 399, nama: "Muhammad Rizqy Mubarok" },
    { id: 80, santriId: 406, nama: "Muhammad Wafa AL-siraji" },
    { id: 92, santriId: 386, nama: "Muhammad Restu al-fazri" },
  ];

  for (const f of fixes) {
    const notif = await prisma.notification.findUnique({ where: { id: f.id } });
    if (notif) {
      await prisma.notification.update({
        where: { id: f.id },
        data: {
          judul: `Perubahan Profil Santri: ${f.nama}`,
          isi: `Santri ${f.nama} (ID: ${f.santriId}) telah mengubah profil.`
        }
      });
      console.log(`Explicitly updated notif ${f.id} to ${f.nama} (ID: ${f.santriId})`);
    }
  }

  // Print all notifs
  const all = await prisma.notification.findMany({
    where: { OR: [{ santriId: null }, { santriId: -1 }] },
    orderBy: { createdAt: 'desc' }
  });
  console.log('=== ALL ADMIN NOTIFS NOW ===');
  for (const n of all) {
    console.log(`[${n.id}] ${n.judul} -> ${n.isi}`);
  }
}

main().finally(() => prisma.$disconnect());

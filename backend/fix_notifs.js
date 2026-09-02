const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Cek notif yang seharusnya hanya untuk santri, tapi santriId-nya null atau -1 (terlihat di admin)
  const wrongNotifs = await prisma.notification.findMany({
    where: {
      AND: [
        {
          OR: [
            { santriId: null },
            { santriId: -1 }
          ]
        },
        {
          OR: [
            { judul: { contains: 'Akun Anda Berhasil' } },
            { judul: { contains: 'Profil Anda Berhasil' } }
          ]
        }
      ]
    },
    select: { id: true, judul: true, santriId: true, isi: true, createdAt: true }
  });

  console.log('=== Notifikasi Bermasalah (User-notif muncul di Admin) ===');
  console.log(JSON.stringify(wrongNotifs, null, 2));
  console.log('Total:', wrongNotifs.length);

  if (wrongNotifs.length > 0) {
    // Hapus semua notifikasi bermasalah ini dari database
    const ids = wrongNotifs.map(n => n.id);
    const deleted = await prisma.notification.deleteMany({
      where: { id: { in: ids } }
    });
    console.log('\nBerhasil dihapus:', deleted.count, 'notifikasi');
  } else {
    console.log('\nTidak ada notifikasi bermasalah yang perlu dihapus.');
  }

  // Tampilkan semua notif yang ada sekarang untuk verifikasi
  const allNotifs = await prisma.notification.findMany({
    select: { id: true, judul: true, santriId: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
    take: 20
  });
  console.log('\n=== 20 Notifikasi Terbaru di Database ===');
  console.log(JSON.stringify(allNotifs, null, 2));
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());

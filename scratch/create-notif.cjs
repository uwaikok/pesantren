const { PrismaClient } = require('../backend/node_modules/@prisma/client');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

const prisma = new PrismaClient();

async function main() {
  const newNotification = await prisma.notification.create({
    data: {
      judul: "Pengumuman Uji Coba Pertama",
      isi: "Ini adalah pengumuman uji coba dari backend script untuk memverifikasi penyimpanan database.",
      kategori: "UMUM",
      isRead: false
    }
  });
  console.log('Successfully created:', newNotification);
}

main()
  .catch(e => {
    console.error('Error creating notification:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

const { PrismaClient } = require('./backend/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const santri = await prisma.santri.findMany({
      select: { id: true, nama: true, kelas: true, status: true, createdAt: true }
    });
    console.log('=== DATA SANTRI DI NEON ===');
    console.log('TOTAL SANTRI:', santri.length);
    console.log(JSON.stringify(santri, null, 2));

    const user = await prisma.user.findMany({
      select: { id: true, nama: true, email: true, createdAt: true }
    });
    console.log('\n=== DATA USER/ADMIN DI NEON ===');
    console.log('TOTAL USER:', user.length);
    console.log(JSON.stringify(user, null, 2));
  } catch (e) {
    console.error('DB ERROR:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();

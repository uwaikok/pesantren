const { PrismaClient } = require('@prisma/client');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

const prisma = new PrismaClient();

async function main() {
  const notifications = await prisma.notification.findMany({
    orderBy: { createdAt: 'desc' }
  });
  console.log('--- NOTIFICATIONS ---');
  console.log(JSON.stringify(notifications, null, 2));
  
  const santriCount = await prisma.santri.count();
  console.log('\n--- SANTRI COUNT ---');
  console.log('Total Santri:', santriCount);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

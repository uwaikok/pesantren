const { PrismaClient } = require('../backend/node_modules/@prisma/client');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

const prisma = new PrismaClient();

async function main() {
  const userId = 2;
  
  const dbNotifications = await prisma.notification.findMany({
    where: {
      OR: [
        { santriId: null },
        { santriId: userId }
      ]
    },
    orderBy: { createdAt: 'desc' }
  });

  console.log('Result for OR query:', dbNotifications);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

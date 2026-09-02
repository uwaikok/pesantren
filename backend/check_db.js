const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const notifs = await prisma.notification.findMany({
    where: {
      OR: [{ santriId: null }, { santriId: -1 }]
    },
    orderBy: { createdAt: 'desc' },
    take: 20
  });
  console.log('=== NOTIFICATIONS VISIBLE TO ADMIN ===');
  console.log(JSON.stringify(notifs, null, 2));
}

main().finally(() => prisma.$disconnect());

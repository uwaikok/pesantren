const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  try {
    const users = await p.user.findMany();
    console.log('USERS:', JSON.stringify(users, null, 2));
  } catch (e) {
    console.error('DB ERROR:', e.message);
  } finally {
    await p.$disconnect();
  }
}

main();

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const p = new PrismaClient();

async function main() {
  try {
    const newPassword = 'adminpassword';
    const hashed = await bcrypt.hash(newPassword, 10);
    
    const updated = await p.user.update({
      where: { email: 'admin@pesantren.com' },
      data: { password: hashed }
    });
    
    console.log('Password berhasil direset!');
    console.log('Email   :', updated.email);
    console.log('Password: adminpassword');
  } catch (e) {
    console.error('ERROR:', e.message);
  } finally {
    await p.$disconnect();
  }
}

main();

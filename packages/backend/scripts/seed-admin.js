const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('admin123', 10);
  await prisma.user.upsert({
    where: { email: 'admin@digitalshowroom.com' },
    update: {},
    create: {
      email: 'admin@digitalshowroom.com',
      password_hash: hash,
      role: 'admin',
    },
  });
  console.log('Admin user created');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

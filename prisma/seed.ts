import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();


async function main() {
  const email = (process.env.ADMIN_EMAIL || 'admin@example.com').toLowerCase();
  const password = process.env.ADMIN_PASSWORD || 'admin123';

  await prisma.settings.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } });

  const admin = await prisma.user.upsert({
    where: { email },
    update: { role: 'ADMIN' },
    create: {
      email,
      name: 'Store Owner',
      role: 'ADMIN',
      passwordHash: await bcrypt.hash(password, 10),
    },
  });
  console.log(`Admin ready: ${admin.email}`);

}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

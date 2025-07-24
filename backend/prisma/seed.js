import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding ...');

  // Hash a dummy password
  const hashedPassword = await bcrypt.hash('password123', 10);

  // Create a Manufacturer User
  await prisma.user.create({
    data: {
      email: 'manufacturer@test.com',
      password: hashedPassword,
      companyName: 'Test Pharma Inc.',
      role: 'MANUFACTURER',
    },
  });

  // Create a DVA User
  await prisma.user.create({
    data: {
      email: 'dva@test.gov',
      password: hashedPassword,
      role: 'DVA',
    },
  });

  // Create an Admin User
  await prisma.user.create({
    data: {
      email: 'admin@sealit.com',
      password: hashedPassword,
      role: 'ADMIN',
    },
  });

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 
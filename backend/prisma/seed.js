// backend/prisma/seed.js
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv'; // <-- THIS IS THE FIX (LINE 1)

dotenv.config(); // <-- THIS IS THE FIX (LINE 2)

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  // 1. Create the main Admin user (if it doesn't exist)
  const adminEmail = 'admin@criterionmark.com';
  let admin = await prisma.user.findUnique({ where: { email: adminEmail } });

  if (!admin) {
    const hashedPassword = await bcrypt.hash('password123', 10);
    admin = await prisma.user.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        companyName: 'Main Administrator',
        role: 'ADMIN',
        isActive: true,
        approvedBy: 1, // Self-approved for initial seed
        approvedAt: new Date(),
      },
    });
    console.log('Created main admin user:', admin);
  } else {
    console.log('Main admin user already exists.');
  }

  // 2. Create the system setting for the admin creation code (if it doesn't exist)
  const settingKey = 'admin_creation_code';
  let adminCodeSetting = await prisma.systemSetting.findUnique({ where: { key: settingKey } });

  if (!adminCodeSetting) {
    // We will hash the code just like a password for security.
    // The initial code is "1000".
    const hashedCode = await bcrypt.hash('1000', 10);
    adminCodeSetting = await prisma.systemSetting.create({
      data: {
        key: settingKey,
        value: hashedCode,
      },
    });
    console.log('Created admin creation code setting.');
  } else {
    console.log('Admin creation code setting already exists.');
  }

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
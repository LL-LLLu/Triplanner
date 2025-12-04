import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL || 'file:./dev.db'
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const adminPassword = await bcrypt.hash('admin', 10);
  const testPassword = await bcrypt.hash('password123', 10);
  
  // 1. Admin Account
  const admin = await prisma.user.upsert({
    where: { email: 'admin@tripgenius.com' },
    update: {},
    create: {
      email: 'admin@tripgenius.com',
      password: adminPassword,
      role: 'ADMIN',
      status: 'ACTIVE',
    },
  });
  console.log('Created Admin:', admin.email);

  // 2. Five Test Accounts
  for (let i = 1; i <= 5; i++) {
      const email = `user${i}@tripgenius.com`;
      const user = await prisma.user.upsert({
        where: { email },
        update: {},
        create: {
          email,
          password: testPassword,
          role: 'USER',
          status: 'ACTIVE',
        },
      });
      console.log(`Created Test User ${i}:`, user.email);
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

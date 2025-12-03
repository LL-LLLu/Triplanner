import { PrismaClient } from './src/generated/client/client.js';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import dotenv from 'dotenv';

dotenv.config();

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL || 'file:./dev.db'
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Checking users in database...');
  try {
      const users = await prisma.user.findMany();
      console.log('Users found:', users);
  } catch (e) {
      console.error('Error fetching users:', e);
  }
}

main();

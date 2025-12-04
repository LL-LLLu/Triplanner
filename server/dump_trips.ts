import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import dotenv from 'dotenv';

dotenv.config();

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL || 'file:./dev.db'
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Dumping trips...');
  const trips = await prisma.trip.findMany();
  trips.forEach(t => {
      console.log(`Trip ID: ${t.id}`);
      console.log('Itinerary Raw:', t.itinerary);
      console.log('--------------------------------');
  });
}

main();

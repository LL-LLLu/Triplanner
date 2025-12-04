import { createRequire } from 'module';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import dotenv from 'dotenv';

const require = createRequire(import.meta.url);
const { PrismaClient } = require('@prisma/client');

dotenv.config();

async function main() {
  const url = process.env.PROD_DATABASE_URL || process.env.DATABASE_URL;
  
  if (!url || !url.startsWith('postgres')) {
      console.error("Error: Please set DATABASE_URL to your Postgres connection string.");
      return;
  }

  console.log("Connecting to:", url.replace(/:[^:@]+@/, ':****@')); // Mask password

  const pool = new pg.Pool({ connectionString: url });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
      console.log("Checking Users...");
      const users = await prisma.user.findMany();
      console.log(`Found ${users.length} users.`);
      console.log(users);
  } catch (e: any) {
      console.error("Error querying database:", e.message);
      if (e.message.includes('does not exist')) {
          console.error("HINT: Tables are missing. Run 'npx prisma db push'");
      }
  } finally {
      await pool.end();
  }
}

main();

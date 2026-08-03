import fs from 'fs';
import path from 'path';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

export async function clearAllData() {
  console.log('🧹 Clearing local JSON data files...');
  const DATA_DIR = path.join(process.cwd(), 'data');

  const jsonFilesToEmpty = [
    'bookings.json',
    'manual_bookings.json',
    'pending_bookings.json',
    'waiver_agreements.json',
    'users.json'
  ];

  for (const file of jsonFilesToEmpty) {
    const filePath = path.join(DATA_DIR, file);
    fs.writeFileSync(filePath, JSON.stringify([], null, 2));
    console.log(`  - Emptied ${file}`);
  }

  const dbUrl = process.env.DATABASE_URL?.trim();
  if (dbUrl && !dbUrl.includes('<YOUR_PASSWORD>') && !dbUrl.includes('<password>')) {
    const isLocalHost = dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1');
    const pool = new Pool({
      connectionString: dbUrl,
      ssl: isLocalHost ? false : { rejectUnauthorized: false }
    });

    try {
      console.log('🧹 Connecting to PostgreSQL / NeonDB to clear database tables...');
      await pool.query('SELECT 1');

      await pool.query('TRUNCATE TABLE bookings CASCADE');
      console.log('  - Truncated table: bookings');

      await pool.query('TRUNCATE TABLE waiver_agreements CASCADE');
      console.log('  - Truncated table: waiver_agreements');

      await pool.query('TRUNCATE TABLE sheet_sync_queue CASCADE');
      console.log('  - Truncated table: sheet_sync_queue');

      await pool.query('TRUNCATE TABLE sheet_sync_logs CASCADE');
      console.log('  - Truncated table: sheet_sync_logs');

      await pool.query('TRUNCATE TABLE users CASCADE');
      console.log('  - Truncated table: users');

      console.log('✨ Successfully cleared all test data and history from NeonDB!');
    } catch (err: any) {
      console.error('❌ Database clear error:', err.message);
    } finally {
      await pool.end();
    }
  } else {
    console.log('⚠️ DATABASE_URL not configured. Skipped PostgreSQL table cleanup.');
  }

  console.log('🎉 All test data and history cleared completely!');
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('clear.ts')) {
  clearAllData();
}

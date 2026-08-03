import fs from 'fs';
import path from 'path';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

export const EXPECTED_BOOKING_COLUMNS = [
  'id',
  'booking_id',
  'first_name',
  'last_name',
  'phone',
  'email',
  'date',
  'time',
  'guests',
  'activities',
  'special_request',
  'total_amount',
  'advance_paid',
  'balance_paid',
  'remaining_due',
  'payment_status',
  'ticket_status',
  'advance_payment_mode',
  'balance_payment_mode',
  'source',
  'booking_source',
  'created_by',
  'agent_name',
  'notes',
  'is_deleted',
  'created_at'
];

export async function verifyDatabaseSchema(poolInstance: pg.Pool): Promise<void> {
  const { rows } = await poolInstance.query(`
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'bookings'
  `);

  const existingColumns = new Set(rows.map((r: any) => r.column_name.toLowerCase()));

  for (const col of EXPECTED_BOOKING_COLUMNS) {
    if (!existingColumns.has(col.toLowerCase())) {
      const errorMsg = `Migration incomplete: missing column '${col}' in table 'bookings'. Run \`npm run db:migrate\` and restart.`;
      console.error(`❌ ${errorMsg}`);
      throw new Error(errorMsg);
    }
  }

  console.log('✅ Schema check passed: All expected columns exist in "bookings" table (including booking_source and booking_id).');
}

export async function runMigrations(): Promise<void> {
  const dbUrl = process.env.DATABASE_URL?.trim();

  if (!dbUrl || dbUrl.includes('<YOUR_PASSWORD>') || dbUrl.includes('<password>')) {
    console.error('❌ DATABASE_URL is not configured in .env file.');
    process.exit(1);
  }

  const isLocalHost = dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1');

  const pool = new Pool({
    connectionString: dbUrl,
    ssl: isLocalHost ? false : { rejectUnauthorized: false }
  });

  try {
    console.log(`🔌 [Migration] Connecting to database...`);
    await pool.query('SELECT 1');

    const shouldReset = process.env.RESET_DB === 'true' || process.argv.includes('--reset');

    if (shouldReset) {
      console.log('🔥 RESET_DB requested: Dropping existing tables...');
      await pool.query(`
        DROP TABLE IF EXISTS users, bookings, manual_bookings, coupons, admin_config, admin_users, waiver_agreements, sheet_sync_queue, sheet_sync_logs CASCADE;
      `);
      console.log('✅ Tables dropped successfully.');
    }

    const schemaPath = path.join(process.cwd(), 'src', 'db', 'schema.sql');
    const sqlScript = fs.readFileSync(schemaPath, 'utf-8');

    console.log('📜 Executing schema definition SQL from src/db/schema.sql...');
    await pool.query(sqlScript);

    // Verify schema
    await verifyDatabaseSchema(pool);

    console.log('🚀 Database migration completed successfully!');
  } catch (err: any) {
    console.error('❌ Database migration failed:', err.message);
    if (dbUrl.includes('neon.tech')) {
      console.error('❌ Cannot reach remote Neon database. If running locally, make sure PostgreSQL is installed and running, and DATABASE_URL in .env points to localhost.');
    }
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run directly when called via CLI script
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('migrate.ts')) {
  runMigrations();
}

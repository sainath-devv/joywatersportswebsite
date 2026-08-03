import fs from 'fs';
import path from 'path';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

function safeReadJson(filePath: string, defaultValue: any): any {
  try {
    if (!fs.existsSync(filePath)) return defaultValue;
    const content = fs.readFileSync(filePath, 'utf-8').trim();
    if (!content) return defaultValue;
    return JSON.parse(content);
  } catch {
    return defaultValue;
  }
}

export async function runSeed(): Promise<void> {
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
    console.log('🌱 Starting database seed script...');
    await pool.query('SELECT 1');

    const DATA_DIR = path.join(process.cwd(), 'data');

    // Seed Bookings
    const bookingsFile = path.join(DATA_DIR, 'bookings.json');
    const bookings = safeReadJson(bookingsFile, []);

    let seededBookingsCount = 0;
    for (const b of bookings) {
      const actStr = typeof b.activities === 'string' ? b.activities : JSON.stringify(b.activities || []);
      const sourceVal = b.source || b.booking_source || 'online';
      const createdByVal = b.createdBy || b.agentName || null;
      const agentNameVal = b.agentName || b.createdBy || null;

      await pool.query(`
        INSERT INTO bookings (
          id, booking_id, first_name, last_name, phone, email, date, time, guests, activities, 
          special_request, total_amount, advance_paid, balance_paid, remaining_due, 
          payment_status, ticket_status, advance_payment_mode, balance_payment_mode,
          source, booking_source, created_by, agent_name, notes, is_deleted, created_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26
        )
        ON CONFLICT (id) DO UPDATE SET
          booking_id = EXCLUDED.booking_id,
          first_name = EXCLUDED.first_name,
          last_name = EXCLUDED.last_name,
          phone = EXCLUDED.phone,
          email = EXCLUDED.email,
          date = EXCLUDED.date,
          time = EXCLUDED.time,
          guests = EXCLUDED.guests,
          activities = EXCLUDED.activities,
          special_request = EXCLUDED.special_request,
          total_amount = EXCLUDED.total_amount,
          advance_paid = EXCLUDED.advance_paid,
          balance_paid = EXCLUDED.balance_paid,
          remaining_due = EXCLUDED.remaining_due,
          payment_status = EXCLUDED.payment_status,
          ticket_status = EXCLUDED.ticket_status,
          advance_payment_mode = EXCLUDED.advance_payment_mode,
          balance_payment_mode = EXCLUDED.balance_payment_mode,
          source = EXCLUDED.source,
          booking_source = EXCLUDED.booking_source,
          created_by = EXCLUDED.created_by,
          agent_name = EXCLUDED.agent_name,
          notes = EXCLUDED.notes,
          is_deleted = EXCLUDED.is_deleted
      `, [
        b.id || '',
        b.id || '',
        b.firstName || '',
        b.lastName || '',
        b.phone || '',
        b.email || '',
        b.date || '',
        b.time || '',
        Number(b.guests) || 1,
        actStr,
        b.specialRequest || '',
        Number(b.totalAmount) || 0,
        Number(b.advancePaid) || 0,
        Number(b.balancePaid) || 0,
        Number(b.remainingDue) || 0,
        b.paymentStatus || 'Pending',
        b.ticketStatus || 'Pending',
        b.advancePaymentMode || 'Online',
        b.balancePaymentMode || 'Cash',
        sourceVal,
        sourceVal,
        createdByVal,
        agentNameVal,
        b.notes || null,
        b.isDeleted || false,
        b.createdAt || new Date().toISOString()
      ]);
      seededBookingsCount++;
    }

    // Seed Coupons
    const couponsFile = path.join(DATA_DIR, 'coupons.json');
    const coupons = safeReadJson(couponsFile, []);
    let seededCouponsCount = 0;

    for (const c of coupons) {
      const discVal = Number(c.discountValue || c.discount || 0);
      await pool.query(`
        INSERT INTO coupons (
          id, code, discount_type, discount_value, discount, min_bill, active, usage_count, created_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9
        )
        ON CONFLICT (id) DO UPDATE SET
          code = EXCLUDED.code,
          discount_type = EXCLUDED.discount_type,
          discount_value = EXCLUDED.discount_value,
          discount = EXCLUDED.discount,
          min_bill = EXCLUDED.min_bill,
          active = EXCLUDED.active,
          usage_count = EXCLUDED.usage_count
      `, [
        c.id || `cp_${Date.now()}`,
        c.code,
        c.discountType || 'percentage',
        discVal,
        discVal,
        Number(c.minBill) || 0,
        c.active !== undefined ? c.active : true,
        Number(c.usageCount) || 0,
        c.createdAt || new Date().toISOString()
      ]);
      seededCouponsCount++;
    }

    // Seed Admin Config
    const adminConfigFile = path.join(DATA_DIR, 'admin_config.json');
    const adminConfig = safeReadJson(adminConfigFile, {});
    for (const [key, value] of Object.entries(adminConfig)) {
      await pool.query(`
        INSERT INTO admin_config (key, value) VALUES ($1, $2)
        ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
      `, [key, String(value)]);
    }

    console.log(`✅ Seeded ${seededBookingsCount} bookings and ${seededCouponsCount} coupons into PostgreSQL!`);
  } catch (err: any) {
    console.error('❌ Database seed failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run directly when called via CLI script
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('seed.ts')) {
  runSeed();
}

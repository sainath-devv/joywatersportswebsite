import pg from 'pg';

const { Pool } = pg;

/**
 * Get the database connection string from process.env.DATABASE_URL.
 * No hardcoded fallback URL is used.
 */
export function getDatabaseConnectionString(): string | null {
  const url = process.env.DATABASE_URL?.trim();
  if (
    !url ||
    url.includes('<YOUR_PASSWORD>') ||
    url.includes('<password>') ||
    url.includes('<YOUR_NEON_PASSWORD>')
  ) {
    return null;
  }
  return url;
}

const connectionString = getDatabaseConnectionString();
const isLocalHost = connectionString ? (connectionString.includes('localhost') || connectionString.includes('127.0.0.1')) : false;

/**
 * Singleton PostgreSQL Pool instance configured for PostgreSQL/Neon database
 */
export const pool = connectionString
  ? new Pool({
      connectionString,
      ssl: isLocalHost ? false : { rejectUnauthorized: false }
    })
  : null;

if (pool) {
  pool.on('error', (err) => {
    console.error('Unexpected error on idle PostgreSQL client:', err.message);
  });
}

export interface NeonConnectionResult {
  success: boolean;
  message: string;
  latencyMs?: number;
  timestamp: string;
  error?: string;
}

/**
 * Executes a simple 'SELECT 1' query to verify connectivity to PostgreSQL database
 */
export async function verifyNeonConnection(): Promise<NeonConnectionResult> {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();

  if (!pool) {
    return {
      success: false,
      message: 'PostgreSQL database connection pool is not initialized (DATABASE_URL missing).',
      timestamp
    };
  }

  try {
    const result = await pool.query('SELECT 1 AS alive');
    const latencyMs = Date.now() - startTime;

    if (result.rows && result.rows.length > 0 && result.rows[0].alive === 1) {
      return {
        success: true,
        message: 'Successfully connected to PostgreSQL database!',
        latencyMs,
        timestamp
      };
    }

    return {
      success: false,
      message: 'Query executed but returned unexpected response.',
      latencyMs,
      timestamp
    };
  } catch (error: any) {
    const latencyMs = Date.now() - startTime;
    return {
      success: false,
      message: 'Failed to connect to PostgreSQL database.',
      latencyMs,
      timestamp,
      error: error?.message || String(error)
    };
  }
}

export default pool;

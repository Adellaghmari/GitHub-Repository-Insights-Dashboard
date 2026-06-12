import { Pool, PoolClient } from 'pg';
import { env, isDatabaseConfigured } from './env';

let pool: Pool | null = null;

export const getPool = (): Pool | null => {
  if (!isDatabaseConfigured()) return null;
  if (!pool) {
    pool = new Pool({
      connectionString: env.databaseUrl,
      ssl: env.databaseUrl.includes('neon') || env.databaseUrl.includes('sslmode=require')
        ? { rejectUnauthorized: false }
        : undefined,
    });
    pool.on('error', (err) => {
      console.error('Unexpected database pool error:', err.message);
    });
  }
  return pool;
};

export const query = async <T = unknown>(
  text: string,
  params?: unknown[]
): Promise<{ rows: T[]; rowCount: number } | null> => {
  const db = getPool();
  if (!db) return null;
  try {
    const result = await db.query(text, params);
    return { rows: result.rows as T[], rowCount: result.rowCount ?? 0 };
  } catch (err) {
    console.error('Database query error:', err);
    return null;
  }
};

export const withTransaction = async <T>(
  fn: (client: PoolClient) => Promise<T>
): Promise<T | null> => {
  const db = getPool();
  if (!db) return null;
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Transaction error:', err);
    return null;
  } finally {
    client.release();
  }
};

export const testConnection = async (): Promise<boolean> => {
  const db = getPool();
  if (!db) return false;
  try {
    await db.query('SELECT 1');
    return true;
  } catch {
    return false;
  }
};

export const getDatabaseStatus = async (): Promise<{
  configured: boolean;
  connected: boolean;
}> => {
  const configured = isDatabaseConfigured();
  if (!configured) return { configured: false, connected: false };
  const connected = await testConnection();
  return { configured, connected };
};

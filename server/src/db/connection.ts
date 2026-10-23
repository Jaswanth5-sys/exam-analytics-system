import { createRequire } from 'module';
import dotenv from 'dotenv';

const nodeRequire = createRequire(import.meta.url);
const { Connection } = nodeRequire('monetdb');

dotenv.config();

const DB_HOST = process.env.MONETDB_HOST || '127.0.0.1';
const DB_PORT = parseInt(process.env.MONETDB_PORT || '50000', 10);
const DB_NAME = process.env.MONETDB_DATABASE || 'demo';
const DB_USER = process.env.MONETDB_USER || 'monetdb';
const DB_PASS = process.env.MONETDB_PASSWORD || 'monetdb';

const MAPI_URL = `mapi:monetdb://${encodeURIComponent(DB_USER)}:${encodeURIComponent(DB_PASS)}@${DB_HOST}:${DB_PORT}/${DB_NAME}`;

let activeConnection: any = null;
let isConnecting = false;
let connectionWaiters: Array<(conn: any) => void> = [];

/**
 * Escape SQL parameters safely for MonetDB
 */
export function formatSql(sql: string, params?: any[]): string {
  if (!params || params.length === 0) return sql;

  let paramIndex = 0;
  return sql.replace(/\?/g, () => {
    if (paramIndex >= params.length) {
      throw new Error(`Parameter count mismatch: query expects more parameters than provided`);
    }
    const val = params[paramIndex++];
    return escapeMonetValue(val);
  });
}

function escapeMonetValue(val: any): string {
  if (val === null || val === undefined) {
    return 'NULL';
  }
  if (typeof val === 'number') {
    if (Number.isNaN(val)) return 'NULL';
    return String(val);
  }
  if (typeof val === 'boolean') {
    return val ? 'TRUE' : 'FALSE';
  }
  if (val instanceof Date) {
    const pad = (n: number) => String(n).padStart(2, '0');
    const yyyy = val.getFullYear();
    const MM = pad(val.getMonth() + 1);
    const dd = pad(val.getDate());
    const hh = pad(val.getHours());
    const mm = pad(val.getMinutes());
    const ss = pad(val.getSeconds());
    return `TIMESTAMP '${yyyy}-${MM}-${dd} ${hh}:${mm}:${ss}'`;
  }
  if (typeof val === 'object') {
    return escapeMonetValue(JSON.stringify(val));
  }
  // String escaping: MonetDB escapes single quotes with single quote or backslash
  const str = String(val).replace(/\\/g, '\\\\').replace(/'/g, "''");
  return `'${str}'`;
}

/**
 * Get or create an active MonetDB connection
 */
export async function getDbConnection(): Promise<any> {
  if (activeConnection) {
    return activeConnection;
  }

  if (isConnecting) {
    return new Promise((resolve) => {
      connectionWaiters.push(resolve);
    });
  }

  isConnecting = true;
  try {
    const conn = new Connection({
      host: DB_HOST,
      port: DB_PORT,
      database: DB_NAME,
      username: DB_USER,
      password: DB_PASS,
      autoCommit: true,
    });
    await conn.connect();
    try {
      await conn.setAutocommit(true);
    } catch (e) {}

    conn.on('error', (err: any) => {
      console.error('[MonetDB] Connection error:', err?.message || err);
      activeConnection = null;
    });

    conn.on('close', () => {
      console.warn('[MonetDB] Connection closed.');
      activeConnection = null;
    });

    activeConnection = conn;
    console.log(`[MonetDB] Successfully connected to ${DB_HOST}:${DB_PORT}/${DB_NAME}`);

    // Flush any pending waiters
    while (connectionWaiters.length > 0) {
      const waiter = connectionWaiters.shift();
      if (waiter) waiter(activeConnection);
    }

    return activeConnection;
  } catch (err) {
    console.error('[MonetDB] Failed to connect:', err);
    throw err;
  } finally {
    isConnecting = false;
  }
}

/**
 * Transform raw MonetDB tabular output into typed JavaScript objects
 */
function mapResultsToObjects<T>(rawResult: any): T[] {
  if (!rawResult || !rawResult.columns || !rawResult.data) {
    return [];
  }

  const columnNames = rawResult.columns.map((c: any) => c.name);
  return rawResult.data.map((row: any[]) => {
    const obj: any = {};
    columnNames.forEach((colName: string, idx: number) => {
      obj[colName] = row[idx];
    });
    return obj as T;
  });
}

/**
 * Execute a query that returns rows (SELECT)
 */
export async function query<T = any>(sql: string, params?: any[]): Promise<T[]> {
  const conn = await getDbConnection();
  const formattedSql = formatSql(sql, params);
  try {
    const res = await conn.execute(formattedSql);
    return mapResultsToObjects<T>(res);
  } catch (err: any) {
    // If connection was lost, reset and retry once
    if (err?.message?.includes('socket') || err?.message?.includes('connection') || err?.message?.includes('ended')) {
      console.warn('[MonetDB] Reconnecting after connection error...');
      activeConnection = null;
      const newConn = await getDbConnection();
      const res = await newConn.execute(formattedSql);
      return mapResultsToObjects<T>(res);
    }
    console.error(`[MonetDB Query Error]: ${err.message}\nSQL: ${formattedSql}`);
    throw err;
  }
}

/**
 * Execute a query that returns a single row or null
 */
export async function queryOne<T = any>(sql: string, params?: any[]): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

/**
 * Execute a command (INSERT, UPDATE, DELETE, DDL)
 */
export async function execute(sql: string, params?: any[]): Promise<any> {
  const conn = await getDbConnection();
  const formattedSql = formatSql(sql, params);
  try {
    return await conn.execute(formattedSql);
  } catch (err: any) {
    if (err?.message?.includes('socket') || err?.message?.includes('connection') || err?.message?.includes('ended')) {
      console.warn('[MonetDB] Reconnecting after connection error...');
      activeConnection = null;
      const newConn = await getDbConnection();
      return await newConn.execute(formattedSql);
    }
    console.error(`[MonetDB Execute Error]: ${err.message}\nSQL: ${formattedSql}`);
    throw err;
  }
}

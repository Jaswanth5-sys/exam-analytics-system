import { getDbConnection, query } from './connection.js';
import { initializeSchema } from './schema.js';

async function main() {
  console.log('Testing MonetDB connectivity and schema initialization...');
  try {
    const conn = await getDbConnection();
    console.log('MonetDB connected!');

    await initializeSchema();

    const tables = await query<{ name: string }>(`
      SELECT name FROM sys.tables WHERE system = false AND type = 0;
    `);
    console.log('Active user tables in MonetDB:', tables.map(t => t.name));

    console.log('Database test passed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Database test failed:', err);
    process.exit(1);
  }
}

main();

require('./env');

const { Pool } = require('pg');

const shouldUseSsl = String(process.env.DB_SSL || 'false').toLowerCase() === 'true';

const hasDiscreteDbConfig =
  process.env.DB_HOST &&
  process.env.DB_NAME &&
  process.env.DB_USER;

const poolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
    }
  : hasDiscreteDbConfig
    ? {
        host: process.env.DB_HOST,
        port: Number.parseInt(process.env.DB_PORT || '5432', 10),
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
      }
    : {};

const pool = new Pool({
  ...poolConfig,
  ssl: shouldUseSsl ? { rejectUnauthorized: false } : false,
});

pool.on('error', (error) => {
  console.error('Unexpected PostgreSQL pool error:', error);
});

const query = (text, params = []) => pool.query(text, params);
const getClient = () => pool.connect();

const withTransaction = async (callback) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  pool,
  query,
  getClient,
  withTransaction,
};

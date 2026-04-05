const fs = require('fs');
const path = require('path');

require('../src/config/env');

const { pool } = require('../src/config/db');

const run = async () => {
  const targetFile = process.argv[2];

  if (!targetFile) {
    throw new Error('Please provide a SQL file path. Example: node scripts/run-sql.js sql/schema.sql');
  }

  const absolutePath = path.resolve(__dirname, '..', targetFile);

  if (!fs.existsSync(absolutePath)) {
    throw new Error(`SQL file not found: ${absolutePath}`);
  }

  const sql = fs.readFileSync(absolutePath, 'utf8');
  const client = await pool.connect();

  try {
    await client.query(sql);
    console.log(`SQL file executed successfully: ${absolutePath}`);
  } finally {
    client.release();
    await pool.end();
  }
};

run().catch(async (error) => {
  console.error('Failed to execute SQL file.');
  console.error(error.message);
  await pool.end();
  process.exit(1);
});

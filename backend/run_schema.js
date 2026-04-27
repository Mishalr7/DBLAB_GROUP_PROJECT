const fs = require('fs');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function runSchema() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT || 3306,
    multipleStatements: true
  });

  try {
    const schema = fs.readFileSync('schema.sql', 'utf8');
    console.log('Running schema.sql...');
    await connection.query(schema);
    console.log('Schema created successfully.');
  } catch (err) {
    console.error('Error running schema:', err);
  } finally {
    await connection.end();
  }
}

runSchema();

const mysql = require('mysql2/promise');
require('dotenv').config();

async function test() {
  try {
    const pool = mysql.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT
    });

    console.log('Testing connection...');
    const [rows] = await pool.execute('SELECT 1');
    console.log('Connection OK:', rows);

    const searchTerm = '1';
    console.log('Testing search query with:', searchTerm);
    const [searchRows] = await pool.execute(
      'SELECT roll_no, name, department, year FROM students WHERE roll_no = ? OR name LIKE ? LIMIT 10',
      [!isNaN(searchTerm) ? Number(searchTerm) : -1, `%${searchTerm}%`]
    );
    console.log('Search Result:', searchRows);

    process.exit(0);
  } catch (err) {
    console.error('TEST FAILED:', err);
    process.exit(1);
  }
}

test();

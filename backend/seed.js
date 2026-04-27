const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function seed() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
    multipleStatements: true
  });

  try {
    console.log('🌱 CLEAN SEEDING: Admin Only');

    await connection.execute('DELETE FROM attendance');
    await connection.execute('DELETE FROM subjects');
    await connection.execute('DELETE FROM students');
    await connection.execute('DELETE FROM teachers');

    await connection.execute('ALTER TABLE teachers AUTO_INCREMENT = 1');
    await connection.execute('ALTER TABLE students AUTO_INCREMENT = 1');
    await connection.execute('ALTER TABLE subjects AUTO_INCREMENT = 1');
    await connection.execute('ALTER TABLE attendance AUTO_INCREMENT = 1');

    const hashedPassword = await bcrypt.hash('password123', 10);
    await connection.execute(
      'INSERT INTO teachers (name, username, password, role) VALUES (?, ?, ?, ?)',
      ['Admin', 'admin', hashedPassword, 'admin']
    );

    console.log('✅ Admin added: admin / password123');
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
    process.exit(0);
  }
}

seed();

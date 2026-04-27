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
    console.log('🌱 Seeding database with real group data...\n');

    // Clear existing
    await connection.execute('DELETE FROM attendance');
    await connection.execute('DELETE FROM subjects');
    await connection.execute('DELETE FROM students');
    await connection.execute('DELETE FROM teachers');

    await connection.execute('ALTER TABLE teachers AUTO_INCREMENT = 1');
    await connection.execute('ALTER TABLE students AUTO_INCREMENT = 1');
    await connection.execute('ALTER TABLE subjects AUTO_INCREMENT = 1');
    await connection.execute('ALTER TABLE attendance AUTO_INCREMENT = 1');

    // ---- TEACHERS ----
    const teachers = [
      ['Ms. Aswathy CS', 'aswathy', 'admin'],
      ['Mr. Vinod Kumar P P', 'vinod', 'teacher'],
      ['Ms. Suvarna J', 'suvarna', 'teacher'],
      ['Dr. Latha R Nair', 'latha', 'teacher'],
      ['Ms. Swaiba Nasmi', 'swaiba', 'teacher']
    ];

    for (const t of teachers) {
      const teacherPassword = await bcrypt.hash(`${t[1]}@123`, 10);
      await connection.execute(
        'INSERT INTO teachers (name, username, password, role) VALUES (?, ?, ?, ?)',
        [t[0], t[1], teacherPassword, t[2]]
      );
    }
    console.log('✅ 5 Teachers added');

    // ---- SUBJECTS ----
    const subjects = [
      ['MicroProcessors', 1],
      ['Data and Computer Communication', 2],
      ['Numerical and Statistical Techniques', 3],
      ['Universal Human Values', 4],
      ['Database Management Systems', 5]
    ];

    for (const sub of subjects) {
      await connection.execute(
        'INSERT INTO subjects (subject_name, teacher_id) VALUES (?, ?)', sub
      );
    }
    console.log('✅ 5 Subjects added');

    // ---- STUDENTS (CSE 2nd Year) ----
    const studentPassword = await bcrypt.hash('password123', 10);
    const students = [
      [63, 'LENA ELIZABETH MINTO'],
      [64, 'LUTHFUL HAK C M'],
      [65, 'M MOHIT KRISHNAN'],
      [66, 'MALAVIKA VINOD P'],
      [67, 'MIDHUN MAXON'],
      [68, 'MIDHUN RAAJ'],
      [69, 'MILAN PRAMOD'],
      [70, 'MISHAL K'],
      [71, 'MITHUN M'],
      [72, 'MUHAMMAD AFSAL M'],
      [73, 'MOHAMMED BAQIR']
    ];

    for (const s of students) {
      await connection.execute(
        'INSERT INTO students (roll_no, name, department, year, password) VALUES (?, ?, "CSE", 2, ?)',
        [s[0], s[1], studentPassword]
      );
    }
    console.log('✅ 11 Students added');

    // ---- ATTENDANCE (Past 5 Days) ----
    const dates = [];
    for (let i = 0; i < 5; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dates.push(d.toISOString().split('T')[0]);
    }

    let attCount = 0;
    for (const date of dates) {
      for (let subId = 1; subId <= 5; subId++) {
        // Mark for all 11 students
        for (let studentId = 1; studentId <= 11; studentId++) {
          const status = Math.random() > 0.15 ? 'Present' : 'Absent';
          await connection.execute(
            'INSERT INTO attendance (student_id, subject_id, date, session_no, status) VALUES (?, ?, ?, 1, ?)',
            [studentId, subId, date, status]
          );
          attCount++;
        }
      }
    }
    console.log(`✅ ${attCount} Attendance records added`);

    console.log('\n🎉 Seeding complete!');
    console.log('📋 Login: [username] / [username]@123 (e.g. aswathy / aswathy@123)');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
    process.exit(0);
  }
}

seed();

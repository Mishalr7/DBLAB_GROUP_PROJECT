/**
 * Report Routes - Attendance analytics and CSV export
 * 
 * SQL Features used:
 *   - JOIN (multiple tables)
 *   - GROUP BY with aggregate functions (COUNT, SUM)
 *   - HAVING clause for filtering aggregates
 *   - CASE WHEN for conditional counting
 *   - Stored Procedure call
 *   - VIEW usage
 */

const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { isAuthenticated } = require('../middleware/auth');

// Attendance percentage per student (optionally filtered by subject)
// Uses: JOIN, GROUP BY, CASE WHEN, aggregate functions
router.get('/percentage', isAuthenticated, async (req, res) => {
  try {
    const { subject_id } = req.query;

    let query = `
      SELECT 
        s.student_id, s.roll_no, s.name, s.department, s.year,
        COUNT(a.attendance_id) AS total_classes,
        SUM(CASE WHEN a.status = 'Present' THEN 1 ELSE 0 END) AS present_count,
        SUM(CASE WHEN a.status = 'Late' THEN 1 ELSE 0 END) AS late_count,
        SUM(CASE WHEN a.status = 'Absent' THEN 1 ELSE 0 END) AS absent_count,
        ROUND(
          SUM(CASE WHEN a.status IN ('Present', 'Late') THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2
        ) AS percentage
      FROM students s
      JOIN attendance a ON s.student_id = a.student_id
    `;
    const params = [];

    if (subject_id) {
      query += ' WHERE a.subject_id = ?';
      params.push(subject_id);
    }

    query += ' GROUP BY s.student_id, s.roll_no, s.name, s.department, s.year ORDER BY s.roll_no';

    const [rows] = await pool.execute(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching percentage:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Students with attendance below 75%
// Uses: Stored Procedure (GetLowAttendanceStudents)
router.get('/low-attendance', isAuthenticated, async (req, res) => {
  try {
    const threshold = parseFloat(req.query.threshold) || 75;
    const [rows] = await pool.execute('CALL GetLowAttendanceStudents(?)', [threshold]);
    // Stored procedures return nested arrays
    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching low attendance:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Subject-wise attendance summary
// Uses: JOIN, GROUP BY, aggregate functions
router.get('/subject-wise', isAuthenticated, async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT 
        sub.subject_id,
        sub.subject_name,
        t.name AS teacher_name,
        COUNT(a.attendance_id) AS total_records,
        COUNT(DISTINCT a.student_id) AS total_students,
        COUNT(DISTINCT a.date) AS total_classes,
        SUM(CASE WHEN a.status = 'Present' THEN 1 ELSE 0 END) AS present_count,
        SUM(CASE WHEN a.status = 'Absent' THEN 1 ELSE 0 END) AS absent_count,
        SUM(CASE WHEN a.status = 'Late' THEN 1 ELSE 0 END) AS late_count,
        ROUND(
          SUM(CASE WHEN a.status IN ('Present', 'Late') THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2
        ) AS attendance_percentage
      FROM subjects sub
      LEFT JOIN teachers t ON sub.teacher_id = t.teacher_id
      LEFT JOIN attendance a ON sub.subject_id = a.subject_id
      GROUP BY sub.subject_id, sub.subject_name, t.name
      ORDER BY sub.subject_name
    `);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching subject-wise:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Daily attendance summary
// Uses: GROUP BY date, aggregate functions
router.get('/daily-summary', isAuthenticated, async (req, res) => {
  try {
    const { subject_id } = req.query;

    let query = `
      SELECT 
        a.date,
        COUNT(*) AS total,
        SUM(CASE WHEN a.status = 'Present' THEN 1 ELSE 0 END) AS present,
        SUM(CASE WHEN a.status = 'Absent' THEN 1 ELSE 0 END) AS absent,
        SUM(CASE WHEN a.status = 'Late' THEN 1 ELSE 0 END) AS late,
        ROUND(
          SUM(CASE WHEN a.status IN ('Present', 'Late') THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2
        ) AS percentage
      FROM attendance a
    `;
    const params = [];

    if (subject_id) {
      query += ' WHERE a.subject_id = ?';
      params.push(subject_id);
    }

    query += ' GROUP BY a.date ORDER BY a.date DESC';

    const [rows] = await pool.execute(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching daily summary:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Dashboard stats
router.get('/dashboard', isAuthenticated, async (req, res) => {
  try {
    const [[studentCount]] = await pool.execute('SELECT COUNT(*) AS count FROM students');
    const [[teacherCount]] = await pool.execute('SELECT COUNT(*) AS count FROM teachers');
    const [[subjectCount]] = await pool.execute('SELECT COUNT(*) AS count FROM subjects');

    // Today's attendance
    const today = new Date().toISOString().split('T')[0];
    const [todayStats] = await pool.execute(`
      SELECT 
        COUNT(*) AS total,
        SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) AS present,
        SUM(CASE WHEN status = 'Absent' THEN 1 ELSE 0 END) AS absent,
        SUM(CASE WHEN status = 'Late' THEN 1 ELSE 0 END) AS late
      FROM attendance WHERE date = ?
    `, [today]);

    // Overall attendance percentage
    const [[overall]] = await pool.execute(`
      SELECT ROUND(
        SUM(CASE WHEN status IN ('Present', 'Late') THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2
      ) AS percentage
      FROM attendance
    `);

    res.json({
      students: studentCount.count,
      teachers: teacherCount.count,
      subjects: subjectCount.count,
      today: todayStats[0],
      overallPercentage: overall.percentage || 0
    });
  } catch (error) {
    console.error('Error fetching dashboard:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Detailed subject-wise breakdown for all students
// Uses: VIEW (student_attendance_summary)
router.get('/student-summary', isAuthenticated, async (req, res) => {
  try {
    const { student_id } = req.query;
    let query = 'SELECT * FROM student_attendance_summary';
    const params = [];

    if (student_id) {
      query += ' WHERE student_id = ?';
      params.push(student_id);
    }

    query += ' ORDER BY roll_no, subject_name';

    const [rows] = await pool.execute(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching student summary:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

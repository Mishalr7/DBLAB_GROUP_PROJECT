const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { isAuthenticated, requireTeacher } = require('../middleware/auth');

// Mark attendance for multiple students (bulk upsert)
router.post('/mark', isAuthenticated, requireTeacher, async (req, res) => {
  try {
    const { subject_id, date, session_no, records } = req.body;

    // Validate inputs
    if (!subject_id || !date || !records || !Array.isArray(records)) {
      return res.status(400).json({ error: 'subject_id, date, and records array are required' });
    }

    const session = session_no || 1;

    // Authorize: Teacher can only mark their own subject
    if (req.session.user.role === 'teacher') {
      const [subjRows] = await pool.execute('SELECT teacher_id FROM subjects WHERE subject_id = ?', [subject_id]);
      if (subjRows.length === 0 || subjRows[0].teacher_id !== req.session.user.id) {
        return res.status(403).json({ error: 'Not authorized to mark attendance for this subject' });
      }
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }

    const validStatuses = ['Present', 'Absent', 'Late'];
    for (const record of records) {
      if (!record.student_id || !record.status) {
        return res.status(400).json({ error: 'Each record needs student_id and status' });
      }
      if (!validStatuses.includes(record.status)) {
        return res.status(400).json({ error: `Invalid status: ${record.status}` });
      }
    }

    // Use INSERT ... ON DUPLICATE KEY UPDATE to handle re-marking
    const query = `
      INSERT INTO attendance (student_id, subject_id, date, session_no, status)
      VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE status = VALUES(status)
    `;

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      for (const record of records) {
        await connection.execute(query, [record.student_id, subject_id, date, session, record.status]);
      }
      await connection.commit();
      res.json({ message: `Attendance marked for ${records.length} students` });
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error marking attendance:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get attendance for a subject on a specific date
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const { subject_id, date, session_no } = req.query;

    if (!subject_id || !date) {
      return res.status(400).json({ error: 'subject_id and date are required' });
    }

    const session = session_no || 1;

    const [rows] = await pool.execute(`
      SELECT s.student_id, s.roll_no, s.name, s.department, s.year,
             a.attendance_id, a.status
      FROM students s
      LEFT JOIN attendance a ON s.student_id = a.student_id
        AND a.subject_id = ? AND a.date = ? AND a.session_no = ?
      ORDER BY s.roll_no
    `, [subject_id, date, session]);

    res.json(rows);
  } catch (error) {
    console.error('Error fetching attendance:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get attendance history for a specific student (Admin/Teacher only)
router.get('/student/:id', isAuthenticated, async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT a.attendance_id, a.date, a.status,
             sub.subject_id, sub.subject_name
      FROM attendance a
      JOIN subjects sub ON a.subject_id = sub.subject_id
      WHERE a.student_id = ?
      ORDER BY a.date DESC
    `, [req.params.id]);

    res.json(rows);
  } catch (error) {
    console.error('Error fetching student attendance:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUBLIC: Search for a student by exact roll_no or partial name
router.get('/public/search', async (req, res) => {
  try {
    const { q } = req.query;
    console.log('Search query:', q);
    if (!q || q.trim() === '') {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const searchTerm = q.trim();
    console.log('Executing search query...');
    const [rows] = await pool.execute(
      'SELECT roll_no, name, department, year FROM students WHERE roll_no = ? OR name LIKE ? LIMIT 10',
      [!isNaN(searchTerm) ? Number(searchTerm) : -1, `%${searchTerm}%`]
    );
    console.log('Search results found:', rows.length);

    res.json(rows);
  } catch (error) {
    console.error('Error searching public students:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUBLIC: Get attendance summary for a specific roll_no
router.get('/public/:roll_no', async (req, res) => {
  try {
    const roll_no = Number(req.params.roll_no);
    if (isNaN(roll_no)) {
      return res.status(400).json({ error: 'Invalid roll number' });
    }

    // First find the student_id safely without exposing it
    const [studentRows] = await pool.execute(
      'SELECT student_id, roll_no, name, department, year FROM students WHERE roll_no = ?',
      [roll_no]
    );

    if (studentRows.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const student = studentRows[0];

    // Get attendance stats safely
    const [stats] = await pool.execute(`
      SELECT 
          sub.subject_id,
          sub.subject_name,
          COUNT(*) AS total_classes,
          SUM(CASE WHEN a.status = 'Present' THEN 1 ELSE 0 END) AS present_count,
          SUM(CASE WHEN a.status = 'Absent' THEN 1 ELSE 0 END) AS absent_count,
          SUM(CASE WHEN a.status = 'Late' THEN 1 ELSE 0 END) AS late_count,
          ROUND(
              SUM(CASE WHEN a.status IN ('Present', 'Late') THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2
          ) AS attendance_percentage
      FROM attendance a
      JOIN subjects sub ON a.subject_id = sub.subject_id
      WHERE a.student_id = ?
      GROUP BY sub.subject_id, sub.subject_name
    `, [student.student_id]);

    res.json({
      student: {
        roll_no: student.roll_no,
        name: student.name,
        department: student.department,
        year: student.year
      },
      stats
    });
  } catch (error) {
    console.error('Error fetching public attendance:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

/**
 * Student Routes - CRUD operations
 * GET    /api/students        - List all (with search)
 * GET    /api/students/:id    - Get one
 * POST   /api/students        - Add (admin only)
 * PUT    /api/students/:id    - Edit (admin only)
 * DELETE /api/students/:id    - Delete (admin only)
 */

const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { isAuthenticated, isAdmin } = require('../middleware/auth');

// List all students with optional search
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const { search, department, year } = req.query;
    let query = 'SELECT * FROM students';
    const params = [];
    const conditions = [];

    if (search) {
      conditions.push('(roll_no LIKE ? OR name LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }
    if (department) {
      conditions.push('department = ?');
      params.push(department);
    }
    if (year) {
      conditions.push('year = ?');
      params.push(parseInt(year));
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ' ORDER BY roll_no';

    const [rows] = await pool.execute(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single student
router.get('/:id', isAuthenticated, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM students WHERE student_id = ?',
      [req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching student:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add student (admin only)
router.post('/', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { roll_no, name, department, year } = req.body;

    // Input validation
    if (!roll_no || !name || !department || !year) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    if (parseInt(year) < 1 || parseInt(year) > 4) {
      return res.status(400).json({ error: 'Year must be between 1 and 4' });
    }

    const [result] = await pool.execute(
      'INSERT INTO students (roll_no, name, department, year) VALUES (?, ?, ?, ?)',
      [String(roll_no).trim(), String(name).trim(), String(department).trim(), parseInt(year)]
    );

    res.status(201).json({ message: 'Student added', student_id: result.insertId });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Roll number already exists' });
    }
    console.error('Error adding student:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Edit student (admin only)
router.put('/:id', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { roll_no, name, department, year } = req.body;

    if (!roll_no || !name || !department || !year) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    if (parseInt(year) < 1 || parseInt(year) > 4) {
      return res.status(400).json({ error: 'Year must be between 1 and 4' });
    }

    const [result] = await pool.execute(
      'UPDATE students SET roll_no = ?, name = ?, department = ?, year = ? WHERE student_id = ?',
      [String(roll_no).trim(), String(name).trim(), String(department).trim(), parseInt(year), req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }
    res.json({ message: 'Student updated' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Roll number already exists' });
    }
    console.error('Error updating student:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete student (admin only)
router.delete('/:id', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const [result] = await pool.execute(
      'DELETE FROM students WHERE student_id = ?',
      [req.params.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }
    res.json({ message: 'Student deleted' });
  } catch (error) {
    console.error('Error deleting student:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

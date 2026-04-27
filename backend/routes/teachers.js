/**
 * Teacher Routes - CRUD operations (admin only)
 * GET    /api/teachers
 * POST   /api/teachers
 * PUT    /api/teachers/:id
 * DELETE /api/teachers/:id
 */

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const { isAuthenticated, isAdmin } = require('../middleware/auth');

// List all teachers (never expose password)
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT teacher_id, name, username, role FROM teachers ORDER BY name'
    );
    res.json(rows);
  } catch (error) {
    console.error('Error fetching teachers:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add teacher (admin only)
router.post('/', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { name, username, password, role } = req.body;

    if (!name || !username || !password) {
      return res.status(400).json({ error: 'Name, username, and password are required' });
    }
    if (role && !['teacher', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Role must be teacher or admin' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await pool.execute(
      'INSERT INTO teachers (name, username, password, role) VALUES (?, ?, ?, ?)',
      [name.trim(), username.trim(), hashedPassword, role || 'teacher']
    );

    res.status(201).json({ message: 'Teacher added', teacher_id: result.insertId });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Username already exists' });
    }
    console.error('Error adding teacher:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update teacher (admin only)
router.put('/:id', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { name, username, password, role } = req.body;

    if (!name || !username) {
      return res.status(400).json({ error: 'Name and username are required' });
    }

    let query, params;
    if (password) {
      const hashed = await bcrypt.hash(password, 10);
      query = 'UPDATE teachers SET name=?, username=?, password=?, role=? WHERE teacher_id=?';
      params = [name.trim(), username.trim(), hashed, role || 'teacher', req.params.id];
    } else {
      query = 'UPDATE teachers SET name=?, username=?, role=? WHERE teacher_id=?';
      params = [name.trim(), username.trim(), role || 'teacher', req.params.id];
    }

    const [result] = await pool.execute(query, params);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Teacher not found' });
    }
    res.json({ message: 'Teacher updated' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Username already exists' });
    }
    console.error('Error updating teacher:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete teacher (admin only)
router.delete('/:id', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const [result] = await pool.execute(
      'DELETE FROM teachers WHERE teacher_id = ?',
      [req.params.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Teacher not found' });
    }
    res.json({ message: 'Teacher deleted' });
  } catch (error) {
    console.error('Error deleting teacher:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

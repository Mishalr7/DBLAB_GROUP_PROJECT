/**
 * Subject Routes - CRUD with teacher assignment
 * Uses JOIN to include teacher name in listing
 */

const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { isAuthenticated, isAdmin } = require('../middleware/auth');

// List all subjects with teacher name (JOIN)
router.get('/', isAuthenticated, async (req, res) => {
  try {
    let query = `
      SELECT s.subject_id, s.subject_name, s.teacher_id, t.name AS teacher_name
      FROM subjects s
      LEFT JOIN teachers t ON s.teacher_id = t.teacher_id
    `;
    const params = [];
    
    // Restrict teachers to their own subjects
    if (req.session.user.role === 'teacher') {
      query += ` WHERE s.teacher_id = ? `;
      params.push(req.session.user.id);
    }
    
    query += ` ORDER BY s.subject_name`;

    const [rows] = await pool.execute(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching subjects:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add subject (admin only)
router.post('/', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { subject_name, teacher_id } = req.body;
    if (!subject_name) {
      return res.status(400).json({ error: 'Subject name is required' });
    }

    const [result] = await pool.execute(
      'INSERT INTO subjects (subject_name, teacher_id) VALUES (?, ?)',
      [subject_name.trim(), teacher_id || null]
    );

    res.status(201).json({ message: 'Subject added', subject_id: result.insertId });
  } catch (error) {
    console.error('Error adding subject:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update subject (admin only)
router.put('/:id', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { subject_name, teacher_id } = req.body;
    if (!subject_name) {
      return res.status(400).json({ error: 'Subject name is required' });
    }

    const [result] = await pool.execute(
      'UPDATE subjects SET subject_name = ?, teacher_id = ? WHERE subject_id = ?',
      [subject_name.trim(), teacher_id || null, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Subject not found' });
    }
    res.json({ message: 'Subject updated' });
  } catch (error) {
    console.error('Error updating subject:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete subject (admin only)
router.delete('/:id', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const [result] = await pool.execute(
      'DELETE FROM subjects WHERE subject_id = ?',
      [req.params.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Subject not found' });
    }
    res.json({ message: 'Subject deleted' });
  } catch (error) {
    console.error('Error deleting subject:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

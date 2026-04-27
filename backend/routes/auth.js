

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const { isAuthenticated } = require('../middleware/auth');

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Fetch user (never expose password hash in response)
    const [rows] = await pool.execute(
      'SELECT teacher_id, name, username, password, role FROM teachers WHERE username = ?',
      [username]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const user = rows[0];

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Store in session (no password)
    req.session.user = {
      id: user.teacher_id,
      name: user.name,
      identifier: user.username,
      role: user.role
    };

    res.json({ message: 'Login successful', user: req.session.user });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Change Password
router.post('/change-password', isAuthenticated, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.session.user.id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new passwords are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long' });
    }

    // Fetch current password hash
    const [rows] = await pool.execute('SELECT password FROM teachers WHERE teacher_id = ?', [userId]);
    if (rows.length === 0) return res.status(404).json({ error: 'User not found' });

    const isMatch = await bcrypt.compare(currentPassword, rows[0].password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Incorrect current password' });
    }

    // Check if new password is same as old
    const isSame = await bcrypt.compare(newPassword, rows[0].password);
    if (isSame) {
      return res.status(400).json({ error: 'New password cannot be the same as the old one' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update DB
    await pool.execute('UPDATE teachers SET password = ? WHERE teacher_id = ?', [hashedPassword, userId]);

    // Force re-login by destroying session
    req.session.destroy((err) => {
      if (err) {
        console.error('Session destruction error after password change:', err);
        return res.status(500).json({ error: 'Password updated but failed to logout' });
      }
      res.clearCookie('connect.sid');
      res.json({ message: 'Password updated successfully. Please login again.' });
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Logout
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ error: 'Logout failed' });
    res.clearCookie('connect.sid');
    res.json({ message: 'Logged out successfully' });
  });
});

// Get current user
router.get('/me', (req, res) => {
  if (req.session && req.session.user) {
    return res.json({ user: req.session.user });
  }
  res.status(401).json({ error: 'Not authenticated' });
});

module.exports = router;

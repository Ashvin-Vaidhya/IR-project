const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

// Register
router.post('/register', async (req, res) => {
  try {
    const { full_name, email, password, role, organization, phone } = req.body;
    if (!full_name || !email || !password) return res.status(400).json({ error: 'Required fields missing' });
    const [existing] = await db.execute('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) return res.status(409).json({ error: 'Email already registered' });
    const hashed = await bcrypt.hash(password, 10);
    const [result] = await db.execute(
      'INSERT INTO users (full_name, email, password, role, organization, phone) VALUES (?, ?, ?, ?, ?, ?)',
      [full_name, email, hashed, role || 'researcher', organization || '', phone || '']
    );
    res.status(201).json({ message: 'Registration successful', userId: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const [users] = await db.execute('SELECT * FROM users WHERE email = ? AND is_active = 1', [email]);
    if (!users.length) return res.status(401).json({ error: 'Invalid credentials' });
    const user = users[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.full_name },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '24h' }
    );
    res.json({ token, user: { id: user.id, name: user.full_name, email: user.email, role: user.role, organization: user.organization } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

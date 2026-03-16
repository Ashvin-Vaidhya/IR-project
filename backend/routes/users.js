const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');

// ---- USERS ----
router.get('/users', authenticate, authorize('admin'), async (req, res) => {
  try {
    const [users] = await db.execute('SELECT id, full_name, email, role, organization, phone, is_active, created_at FROM users ORDER BY created_at DESC');
    res.json(users);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/users/:id/status', authenticate, authorize('admin'), async (req, res) => {
  try {
    await db.execute('UPDATE users SET is_active = ? WHERE id = ?', [req.body.is_active, req.params.id]);
    res.json({ message: 'User status updated' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/users/profile', authenticate, async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT id, full_name, email, role, organization, phone, created_at FROM users WHERE id = ?', [req.user.id]);
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ---- NOTIFICATIONS ----
router.get('/notifications', authenticate, async (req, res) => {
  try {
    const [notifs] = await db.execute('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 20', [req.user.id]);
    res.json(notifs);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/notifications/:id/read', authenticate, async (req, res) => {
  try {
    await db.execute('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    res.json({ message: 'Marked as read' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/notifications/read-all', authenticate, async (req, res) => {
  try {
    await db.execute('UPDATE notifications SET is_read = 1 WHERE user_id = ?', [req.user.id]);
    res.json({ message: 'All marked as read' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ---- INVESTMENTS ----
router.get('/investments', authenticate, async (req, res) => {
  try {
    let query = `SELECT inv.*, p.title as project_title, u.full_name as investor_name FROM investments inv
      JOIN projects p ON inv.project_id = p.id JOIN users u ON inv.investor_id = u.id WHERE 1=1`;
    const params = [];
    if (req.user.role === 'investor') { query += ' AND inv.investor_id = ?'; params.push(req.user.id); }
    if (req.user.role === 'researcher') { query += ' AND p.lead_researcher_id = ?'; params.push(req.user.id); }
    const [rows] = await db.execute(query, params);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/investments', authenticate, authorize('investor'), async (req, res) => {
  try {
    const { project_id, amount, equity_percentage, notes } = req.body;
    const [result] = await db.execute(
      'INSERT INTO investments (project_id, investor_id, amount, equity_percentage, notes) VALUES (?, ?, ?, ?, ?)',
      [project_id, req.user.id, amount, equity_percentage, notes]
    );
    res.status(201).json({ message: 'Investment request submitted', investmentId: result.insertId });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;

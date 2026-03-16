const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');
const multer = require('multer');

const storage = multer.diskStorage({
  destination: './uploads/ipr/',
  filename: (req, file, cb) => cb(null, 'IPR-' + Date.now() + '-' + file.originalname)
});
const upload = multer({ storage, limits: { fileSize: 20 * 1024 * 1024 } });

// Get all IPR records
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, type, project_id } = req.query;
    let query = `SELECT ir.*, p.title as project_title, u.full_name as creator_name
      FROM ipr_records ir LEFT JOIN projects p ON ir.project_id = p.id
      LEFT JOIN users u ON ir.created_by = u.id WHERE 1=1`;
    const params = [];
    if (req.user.role === 'researcher') {
      query += ' AND p.lead_researcher_id = ?'; params.push(req.user.id);
    }
    if (status) { query += ' AND ir.status = ?'; params.push(status); }
    if (type) { query += ' AND ir.ipr_type = ?'; params.push(type); }
    if (project_id) { query += ' AND ir.project_id = ?'; params.push(project_id); }
    query += ' ORDER BY ir.created_at DESC';
    const [records] = await db.execute(query, params);
    res.json(records);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Get single IPR
router.get('/:id', authenticate, async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT ir.*, p.title as project_title, u.full_name as creator_name
       FROM ipr_records ir LEFT JOIN projects p ON ir.project_id = p.id
       LEFT JOIN users u ON ir.created_by = u.id WHERE ir.id = ?`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'IPR record not found' });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Create IPR record
router.post('/', authenticate, authorize('researcher', 'ipr_professional', 'admin'), upload.single('document'), async (req, res) => {
  try {
    const { project_id, ipr_type, title, description, filing_number, status, filing_date, jurisdiction, applicant_name, attorney_name, notes } = req.body;
    const documentPath = req.file ? req.file.path : null;
    const [result] = await db.execute(
      `INSERT INTO ipr_records (project_id, ipr_type, title, description, filing_number, status, filing_date, jurisdiction, applicant_name, attorney_name, document_path, notes, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [project_id, ipr_type, title, description, filing_number, status || 'draft', filing_date, jurisdiction || 'India', applicant_name, attorney_name, documentPath, notes, req.user.id]
    );
    // Create notification for project lead
    const [project] = await db.execute('SELECT lead_researcher_id FROM projects WHERE id = ?', [project_id]);
    if (project.length && project[0].lead_researcher_id !== req.user.id) {
      await db.execute(
        'INSERT INTO notifications (user_id, title, message, type, related_type, related_id) VALUES (?, ?, ?, ?, ?, ?)',
        [project[0].lead_researcher_id, 'New IPR Filed', `A new ${ipr_type} IPR record has been created for your project.`, 'info', 'ipr', result.insertId]
      );
    }
    res.status(201).json({ message: 'IPR record created', iprId: result.insertId });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Update IPR record
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { ipr_type, title, description, filing_number, status, filing_date, approval_date, expiry_date, jurisdiction, applicant_name, attorney_name, notes } = req.body;
    await db.execute(
      `UPDATE ipr_records SET ipr_type=?, title=?, description=?, filing_number=?, status=?, filing_date=?, approval_date=?, expiry_date=?, jurisdiction=?, applicant_name=?, attorney_name=?, notes=? WHERE id=?`,
      [ipr_type, title, description, filing_number, status, filing_date, approval_date, expiry_date, jurisdiction, applicant_name, attorney_name, notes, req.params.id]
    );
    // Notification on status change
    const [ipr] = await db.execute('SELECT ir.*, p.lead_researcher_id FROM ipr_records ir JOIN projects p ON ir.project_id = p.id WHERE ir.id = ?', [req.params.id]);
    if (ipr.length) {
      await db.execute(
        'INSERT INTO notifications (user_id, title, message, type, related_type, related_id) VALUES (?, ?, ?, ?, ?, ?)',
        [ipr[0].lead_researcher_id, 'IPR Status Updated', `IPR record "${title}" status changed to ${status}.`, status === 'approved' ? 'success' : 'info', 'ipr', req.params.id]
      );
    }
    res.json({ message: 'IPR record updated' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// IPR Stats
router.get('/stats/overview', authenticate, async (req, res) => {
  try {
    const [byStatus] = await db.execute(`SELECT status, COUNT(*) as count FROM ipr_records GROUP BY status`);
    const [byType] = await db.execute(`SELECT ipr_type, COUNT(*) as count FROM ipr_records GROUP BY ipr_type`);
    const [total] = await db.execute('SELECT COUNT(*) as count FROM ipr_records');
    res.json({ total: total[0].count, byStatus, byType });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;

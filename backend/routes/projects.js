const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: './uploads/documents/',
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// Get all projects
router.get('/', authenticate, async (req, res) => {
  try {
    const { search, status, domain } = req.query;
    let query = `SELECT p.*, u.full_name as lead_researcher_name, u.organization,
      (SELECT COUNT(*) FROM ipr_records WHERE project_id = p.id) as ipr_count
      FROM projects p LEFT JOIN users u ON p.lead_researcher_id = u.id WHERE 1=1`;
    const params = [];
    if (req.user.role === 'researcher') { query += ' AND p.lead_researcher_id = ?'; params.push(req.user.id); }
    if (req.user.role === 'investor') { query += ' AND p.is_public = 1'; }
    if (search) { query += ' AND (p.title LIKE ? OR p.keywords LIKE ? OR u.full_name LIKE ?)'; params.push(`%${search}%`, `%${search}%`, `%${search}%`); }
    if (status) { query += ' AND p.status = ?'; params.push(status); }
    if (domain) { query += ' AND p.technology_domain LIKE ?'; params.push(`%${domain}%`); }
    query += ' ORDER BY p.created_at DESC';
    const [projects] = await db.execute(query, params);
    res.json(projects);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Get single project
router.get('/:id', authenticate, async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT p.*, u.full_name as lead_researcher_name, u.email as researcher_email, u.organization
       FROM projects p LEFT JOIN users u ON p.lead_researcher_id = u.id WHERE p.id = ?`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Project not found' });
    const [team] = await db.execute(
      `SELECT pt.*, u.full_name, u.email, u.role FROM project_team pt JOIN users u ON pt.user_id = u.id WHERE pt.project_id = ?`,
      [req.params.id]
    );
    const [iprs] = await db.execute('SELECT * FROM ipr_records WHERE project_id = ?', [req.params.id]);
    const [docs] = await db.execute(
      `SELECT pd.*, u.full_name as uploaded_by_name FROM project_documents pd LEFT JOIN users u ON pd.uploaded_by = u.id WHERE pd.project_id = ?`,
      [req.params.id]
    );
    res.json({ ...rows[0], team, iprs, documents: docs });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Create project
router.post('/', authenticate, authorize('researcher', 'admin'), async (req, res) => {
  try {
    const { title, description, technology_domain, funding_required, start_date, expected_end_date, institution, keywords, is_public } = req.body;
    const [result] = await db.execute(
      `INSERT INTO projects (title, description, technology_domain, funding_required, start_date, expected_end_date, lead_researcher_id, institution, keywords, is_public)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, description, technology_domain, funding_required || 0, start_date, expected_end_date, req.user.id, institution, keywords, is_public || false]
    );
    // Add creator to team
    await db.execute('INSERT INTO project_team (project_id, user_id, role_in_project) VALUES (?, ?, ?)', [result.insertId, req.user.id, 'Lead Researcher']);
    res.status(201).json({ message: 'Project created', projectId: result.insertId });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Update project
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { title, description, technology_domain, funding_required, funding_received, status, progress, expected_end_date, keywords, is_public } = req.body;
    await db.execute(
      `UPDATE projects SET title=?, description=?, technology_domain=?, funding_required=?, funding_received=?, status=?, progress=?, expected_end_date=?, keywords=?, is_public=? WHERE id=?`,
      [title, description, technology_domain, funding_required, funding_received, status, progress, expected_end_date, keywords, is_public, req.params.id]
    );
    res.json({ message: 'Project updated' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Upload document
router.post('/:id/documents', authenticate, upload.single('document'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    await db.execute(
      'INSERT INTO project_documents (project_id, uploaded_by, file_name, file_path, file_type, file_size, description) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [req.params.id, req.user.id, req.file.originalname, req.file.path, req.file.mimetype, req.file.size, req.body.description || '']
    );
    res.json({ message: 'Document uploaded', filename: req.file.filename });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Dashboard stats
router.get('/stats/overview', authenticate, async (req, res) => {
  try {
    let whereClause = '';
    const params = [];
    if (req.user.role === 'researcher') { whereClause = 'WHERE lead_researcher_id = ?'; params.push(req.user.id); }

    const [totalProjects] = await db.execute(`SELECT COUNT(*) as count FROM projects ${whereClause}`, params);
    const [approved] = await db.execute(`SELECT COUNT(*) as count FROM projects ${whereClause ? whereClause + ' AND status="approved"' : 'WHERE status="approved"'}`, params);
    const [pendingIPR] = await db.execute(`SELECT COUNT(*) as count FROM ipr_records WHERE status IN ('draft','filed','under_review')${req.user.role === 'researcher' ? ' AND project_id IN (SELECT id FROM projects WHERE lead_researcher_id = ?)' : ''}`, req.user.role === 'researcher' ? [req.user.id] : []);
    const [totalUsers] = await db.execute('SELECT COUNT(*) as count FROM users');
    const [byStatus] = await db.execute(`SELECT status, COUNT(*) as count FROM projects ${whereClause} GROUP BY status`, params);
    const [recentProjects] = await db.execute(`SELECT p.*, u.full_name as researcher FROM projects p LEFT JOIN users u ON p.lead_researcher_id = u.id ${whereClause} ORDER BY p.created_at DESC LIMIT 5`, params);

    res.json({
      totalProjects: totalProjects[0].count,
      approvedProjects: approved[0].count,
      pendingIPR: pendingIPR[0].count,
      totalUsers: totalUsers[0].count,
      byStatus,
      recentProjects
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;

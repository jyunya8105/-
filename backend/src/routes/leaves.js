const express = require('express');
const router = express.Router();
const db = require('../database');

// GET paid leaves for employee by month
router.get('/employee/:id', (req, res) => {
  const { year, month } = req.query;
  let query = 'SELECT * FROM paid_leaves WHERE employee_id = ?';
  const params = [req.params.id];

  if (year && month) {
    const prefix = `${year}-${String(month).padStart(2, '0')}`;
    query += ' AND date LIKE ? ORDER BY date';
    params.push(`${prefix}%`);
  } else {
    query += ' ORDER BY date DESC';
  }

  const leaves = db.prepare(query).all(...params);
  res.json(leaves);
});

// GET all pending leave requests (admin)
router.get('/pending', (req, res) => {
  const leaves = db.prepare(`
    SELECT pl.*, e.name as employee_name
    FROM paid_leaves pl
    JOIN employees e ON pl.employee_id = e.id
    WHERE pl.status = 'pending'
    ORDER BY pl.date
  `).all();
  res.json(leaves);
});

// GET all leaves with employee name (admin)
router.get('/all', (req, res) => {
  const { year, month } = req.query;
  let query = `
    SELECT pl.*, e.name as employee_name
    FROM paid_leaves pl
    JOIN employees e ON pl.employee_id = e.id
  `;
  const params = [];

  if (year && month) {
    const prefix = `${year}-${String(month).padStart(2, '0')}`;
    query += ' WHERE pl.date LIKE ?';
    params.push(`${prefix}%`);
  }
  query += ' ORDER BY pl.date, e.name';

  const leaves = db.prepare(query).all(...params);
  res.json(leaves);
});

// POST request paid leave
router.post('/request', (req, res) => {
  const { employee_id, date } = req.body;
  if (!employee_id || !date) return res.status(400).json({ error: 'パラメータが不足しています' });

  const employee = db.prepare('SELECT * FROM employees WHERE id = ?').get(employee_id);
  if (!employee) return res.status(404).json({ error: '従業員が見つかりません' });

  // Check remaining paid leaves
  const approvedCount = db.prepare(
    "SELECT COUNT(*) as cnt FROM paid_leaves WHERE employee_id = ? AND status = 'approved'"
  ).get(employee_id).cnt;

  if (approvedCount >= employee.paid_leave_days) {
    return res.status(400).json({ error: '有給休暇の残日数がありません' });
  }

  const existing = db.prepare(
    'SELECT id FROM paid_leaves WHERE employee_id = ? AND date = ?'
  ).get(employee_id, date);

  if (existing) {
    return res.status(400).json({ error: 'すでにこの日に有給申請があります' });
  }

  const result = db.prepare(
    "INSERT INTO paid_leaves (employee_id, date, status) VALUES (?, ?, 'pending')"
  ).run(employee_id, date);

  const leave = db.prepare('SELECT * FROM paid_leaves WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(leave);
});

// PUT approve/reject leave (admin)
router.put('/:id/status', (req, res) => {
  const { status } = req.body;
  if (!['approved', 'rejected', 'pending'].includes(status)) {
    return res.status(400).json({ error: '無効なステータスです' });
  }

  const existing = db.prepare('SELECT * FROM paid_leaves WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: '申請が見つかりません' });

  db.prepare('UPDATE paid_leaves SET status = ? WHERE id = ?').run(status, req.params.id);
  const updated = db.prepare('SELECT * FROM paid_leaves WHERE id = ?').get(req.params.id);
  res.json(updated);
});

// DELETE leave request
router.delete('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM paid_leaves WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: '申請が見つかりません' });

  if (existing.status === 'approved') {
    return res.status(400).json({ error: '承認済みの申請は削除できません' });
  }

  db.prepare('DELETE FROM paid_leaves WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;

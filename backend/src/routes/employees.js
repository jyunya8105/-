const express = require('express');
const router = express.Router();
const db = require('../database');

// GET all employees
router.get('/', (req, res) => {
  const employees = db.prepare('SELECT * FROM employees ORDER BY name').all();
  res.json(employees);
});

// GET single employee
router.get('/:id', (req, res) => {
  const employee = db.prepare('SELECT * FROM employees WHERE id = ?').get(req.params.id);
  if (!employee) return res.status(404).json({ error: '従業員が見つかりません' });
  res.json(employee);
});

// POST create employee
router.post('/', (req, res) => {
  const { name, hourly_wage, paid_leave_days } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: '名前は必須です' });
  if (!hourly_wage || hourly_wage < 0) return res.status(400).json({ error: '時給を正しく入力してください' });

  const result = db.prepare(
    'INSERT INTO employees (name, hourly_wage, paid_leave_days) VALUES (?, ?, ?)'
  ).run(name.trim(), hourly_wage, paid_leave_days ?? 10);

  const employee = db.prepare('SELECT * FROM employees WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(employee);
});

// PUT update employee
router.put('/:id', (req, res) => {
  const { name, hourly_wage, paid_leave_days } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: '名前は必須です' });
  if (!hourly_wage || hourly_wage < 0) return res.status(400).json({ error: '時給を正しく入力してください' });

  const existing = db.prepare('SELECT id FROM employees WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: '従業員が見つかりません' });

  db.prepare(
    'UPDATE employees SET name = ?, hourly_wage = ?, paid_leave_days = ? WHERE id = ?'
  ).run(name.trim(), hourly_wage, paid_leave_days ?? 10, req.params.id);

  const employee = db.prepare('SELECT * FROM employees WHERE id = ?').get(req.params.id);
  res.json(employee);
});

// DELETE employee
router.delete('/:id', (req, res) => {
  const existing = db.prepare('SELECT id FROM employees WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: '従業員が見つかりません' });

  db.prepare('DELETE FROM employees WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;

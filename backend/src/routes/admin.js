const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../database');

// POST verify admin password
router.post('/login', (req, res) => {
  const { password } = req.body;
  if (!password) return res.status(400).json({ error: 'パスワードを入力してください' });

  const settings = db.prepare('SELECT password_hash FROM admin_settings WHERE id = 1').get();
  if (!settings) return res.status(500).json({ error: 'システムエラー' });

  const valid = bcrypt.compareSync(password, settings.password_hash);
  if (!valid) return res.status(401).json({ error: 'パスワードが違います' });

  res.json({ success: true });
});

// POST change admin password
router.post('/change-password', (req, res) => {
  const { current_password, new_password } = req.body;
  if (!current_password || !new_password) {
    return res.status(400).json({ error: 'パラメータが不足しています' });
  }
  if (new_password.length < 4) {
    return res.status(400).json({ error: 'パスワードは4文字以上にしてください' });
  }

  const settings = db.prepare('SELECT password_hash FROM admin_settings WHERE id = 1').get();
  const valid = bcrypt.compareSync(current_password, settings.password_hash);
  if (!valid) return res.status(401).json({ error: '現在のパスワードが違います' });

  const newHash = bcrypt.hashSync(new_password, 10);
  db.prepare('UPDATE admin_settings SET password_hash = ? WHERE id = 1').run(newHash);

  res.json({ success: true });
});

// GET all attendance for all employees (admin view)
router.get('/attendance', (req, res) => {
  const { year, month } = req.query;
  if (!year || !month) return res.status(400).json({ error: '年月を指定してください' });

  const prefix = `${year}-${String(month).padStart(2, '0')}`;
  const records = db.prepare(`
    SELECT a.*, e.name as employee_name, e.hourly_wage
    FROM attendance a
    JOIN employees e ON a.employee_id = e.id
    WHERE a.date LIKE ?
    ORDER BY a.date, e.name
  `).all(`${prefix}%`);

  res.json(records);
});

// GET monthly salary report for all employees
router.get('/salary-report', (req, res) => {
  const { year, month } = req.query;
  if (!year || !month) return res.status(400).json({ error: '年月を指定してください' });

  const prefix = `${year}-${String(month).padStart(2, '0')}`;
  const employees = db.prepare('SELECT * FROM employees ORDER BY name').all();

  const report = employees.map(emp => {
    const records = db.prepare(
      'SELECT * FROM attendance WHERE employee_id = ? AND date LIKE ?'
    ).all(emp.id, `${prefix}%`);

    let totalMinutes = 0;
    records.forEach(r => {
      totalMinutes += calcWorkMinutes(r);
    });

    const paidLeaves = db.prepare(
      "SELECT COUNT(*) as cnt FROM paid_leaves WHERE employee_id = ? AND date LIKE ? AND status = 'approved'"
    ).get(emp.id, `${prefix}%`).cnt;

    const salary = Math.floor((totalMinutes / 60) * emp.hourly_wage);

    return {
      employee: emp,
      total_minutes: totalMinutes,
      total_hours: Math.floor(totalMinutes / 60),
      remain_minutes: totalMinutes % 60,
      salary,
      paid_leaves: paidLeaves,
    };
  });

  res.json(report);
});

function calcWorkMinutes(record) {
  if (!record.clock_in || !record.clock_out) return 0;
  const start = new Date(`2000-01-01 ${record.clock_in.split(' ')[1] || record.clock_in}`);
  const end = new Date(`2000-01-01 ${record.clock_out.split(' ')[1] || record.clock_out}`);
  let diff = (end - start) / 60000;
  if (diff < 0) return 0;

  if (record.break_start && record.break_end) {
    const bs = new Date(`2000-01-01 ${record.break_start.split(' ')[1] || record.break_start}`);
    const be = new Date(`2000-01-01 ${record.break_end.split(' ')[1] || record.break_end}`);
    const breakDiff = (be - bs) / 60000;
    if (breakDiff > 0) diff -= breakDiff;
  }
  return Math.max(0, Math.floor(diff));
}

module.exports = router;

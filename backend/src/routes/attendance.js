const express = require('express');
const router = express.Router();
const db = require('../database');

// GET attendance for employee by month
router.get('/employee/:id', (req, res) => {
  const { year, month } = req.query;
  let query = 'SELECT * FROM attendance WHERE employee_id = ?';
  const params = [req.params.id];

  if (year && month) {
    const prefix = `${year}-${String(month).padStart(2, '0')}`;
    query += ' AND date LIKE ? ORDER BY date';
    params.push(`${prefix}%`);
  } else {
    query += ' ORDER BY date DESC LIMIT 100';
  }

  const records = db.prepare(query).all(...params);
  res.json(records);
});

// GET today's attendance for employee
router.get('/employee/:id/today', (req, res) => {
  const today = getTodayJST();
  const record = db.prepare(
    'SELECT * FROM attendance WHERE employee_id = ? AND date = ?'
  ).get(req.params.id, today);
  res.json(record || null);
});

// POST clock action (clock_in, break_start, break_end, clock_out)
router.post('/clock', (req, res) => {
  const { employee_id, action } = req.body;
  if (!employee_id || !action) return res.status(400).json({ error: 'パラメータが不足しています' });

  const validActions = ['clock_in', 'break_start', 'break_end', 'clock_out'];
  if (!validActions.includes(action)) return res.status(400).json({ error: '無効なアクションです' });

  const employee = db.prepare('SELECT id FROM employees WHERE id = ?').get(employee_id);
  if (!employee) return res.status(404).json({ error: '従業員が見つかりません' });

  const today = getTodayJST();
  const now = getNowJST();

  let record = db.prepare(
    'SELECT * FROM attendance WHERE employee_id = ? AND date = ?'
  ).get(employee_id, today);

  if (!record) {
    if (action !== 'clock_in') {
      return res.status(400).json({ error: '先に出勤打刻してください' });
    }
    db.prepare(
      'INSERT INTO attendance (employee_id, date, clock_in) VALUES (?, ?, ?)'
    ).run(employee_id, today, now);
  } else {
    // Validate action sequence
    if (action === 'clock_in' && record.clock_in) {
      return res.status(400).json({ error: 'すでに出勤済みです' });
    }
    if (action === 'break_start' && !record.clock_in) {
      return res.status(400).json({ error: '先に出勤打刻してください' });
    }
    if (action === 'break_start' && record.break_start) {
      return res.status(400).json({ error: 'すでに休憩中です' });
    }
    if (action === 'break_end' && !record.break_start) {
      return res.status(400).json({ error: '休憩開始打刻がありません' });
    }
    if (action === 'break_end' && record.break_end) {
      return res.status(400).json({ error: 'すでに休憩終了済みです' });
    }
    if (action === 'clock_out' && !record.clock_in) {
      return res.status(400).json({ error: '出勤打刻がありません' });
    }
    if (action === 'clock_out' && record.clock_out) {
      return res.status(400).json({ error: 'すでに退勤済みです' });
    }

    db.prepare(`UPDATE attendance SET ${action} = ? WHERE employee_id = ? AND date = ?`)
      .run(now, employee_id, today);
  }

  const updated = db.prepare(
    'SELECT * FROM attendance WHERE employee_id = ? AND date = ?'
  ).get(employee_id, today);
  res.json(updated);
});

// GET monthly summary for employee (working hours + salary)
router.get('/employee/:id/summary', (req, res) => {
  const { year, month } = req.query;
  if (!year || !month) return res.status(400).json({ error: '年月を指定してください' });

  const employee = db.prepare('SELECT * FROM employees WHERE id = ?').get(req.params.id);
  if (!employee) return res.status(404).json({ error: '従業員が見つかりません' });

  const prefix = `${year}-${String(month).padStart(2, '0')}`;
  const records = db.prepare(
    'SELECT * FROM attendance WHERE employee_id = ? AND date LIKE ? ORDER BY date'
  ).all(req.params.id, `${prefix}%`);

  const paidLeaves = db.prepare(
    "SELECT * FROM paid_leaves WHERE employee_id = ? AND date LIKE ? AND status = 'approved'"
  ).all(req.params.id, `${prefix}%`);

  let totalMinutes = 0;
  const dailyData = records.map(r => {
    const workMinutes = calcWorkMinutes(r);
    totalMinutes += workMinutes;
    return { ...r, work_minutes: workMinutes };
  });

  const totalHours = Math.floor(totalMinutes / 60);
  const remainMinutes = totalMinutes % 60;
  const salary = Math.floor((totalMinutes / 60) * employee.hourly_wage);

  res.json({
    employee,
    year: parseInt(year),
    month: parseInt(month),
    records: dailyData,
    paid_leaves: paidLeaves,
    total_minutes: totalMinutes,
    total_hours: totalHours,
    remain_minutes: remainMinutes,
    salary,
  });
});

// Admin: Update attendance record
router.put('/:id', (req, res) => {
  const { clock_in, break_start, break_end, clock_out, note, admin_name } = req.body;

  const existing = db.prepare('SELECT * FROM attendance WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: '打刻記録が見つかりません' });

  const now = getNowJST();
  db.prepare(`
    UPDATE attendance SET
      clock_in = ?, break_start = ?, break_end = ?, clock_out = ?,
      note = ?, modified_by = ?, modified_at = ?
    WHERE id = ?
  `).run(
    clock_in || null, break_start || null, break_end || null, clock_out || null,
    note || null, admin_name || 'admin', now, req.params.id
  );

  const updated = db.prepare('SELECT * FROM attendance WHERE id = ?').get(req.params.id);
  res.json(updated);
});

// Admin: Create attendance record for a date
router.post('/admin/create', (req, res) => {
  const { employee_id, date, clock_in, break_start, break_end, clock_out, note, admin_name } = req.body;
  if (!employee_id || !date) return res.status(400).json({ error: 'パラメータが不足しています' });

  const existing = db.prepare(
    'SELECT id FROM attendance WHERE employee_id = ? AND date = ?'
  ).get(employee_id, date);

  const now = getNowJST();
  if (existing) {
    db.prepare(`
      UPDATE attendance SET
        clock_in = ?, break_start = ?, break_end = ?, clock_out = ?,
        note = ?, modified_by = ?, modified_at = ?
      WHERE employee_id = ? AND date = ?
    `).run(
      clock_in || null, break_start || null, break_end || null, clock_out || null,
      note || null, admin_name || 'admin', now, employee_id, date
    );
  } else {
    db.prepare(`
      INSERT INTO attendance (employee_id, date, clock_in, break_start, break_end, clock_out, note, modified_by, modified_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      employee_id, date,
      clock_in || null, break_start || null, break_end || null, clock_out || null,
      note || null, admin_name || 'admin', now
    );
  }

  const record = db.prepare(
    'SELECT * FROM attendance WHERE employee_id = ? AND date = ?'
  ).get(employee_id, date);
  res.json(record);
});

function getTodayJST() {
  const now = new Date();
  const jst = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Tokyo' }));
  return `${jst.getFullYear()}-${String(jst.getMonth() + 1).padStart(2, '0')}-${String(jst.getDate()).padStart(2, '0')}`;
}

function getNowJST() {
  const now = new Date();
  const jst = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Tokyo' }));
  return `${jst.getFullYear()}-${String(jst.getMonth() + 1).padStart(2, '0')}-${String(jst.getDate()).padStart(2, '0')} ${String(jst.getHours()).padStart(2, '0')}:${String(jst.getMinutes()).padStart(2, '0')}:${String(jst.getSeconds()).padStart(2, '0')}`;
}

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

const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'data', 'oka_shouten.db');

// Ensure data directory exists
const fs = require('fs');
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS employees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    hourly_wage INTEGER NOT NULL DEFAULT 1000,
    paid_leave_days INTEGER NOT NULL DEFAULT 10,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    clock_in TEXT,
    break_start TEXT,
    break_end TEXT,
    clock_out TEXT,
    note TEXT,
    modified_by TEXT,
    modified_at DATETIME,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    UNIQUE(employee_id, date)
  );

  CREATE TABLE IF NOT EXISTS paid_leaves (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    UNIQUE(employee_id, date)
  );

  CREATE TABLE IF NOT EXISTS admin_settings (
    id INTEGER PRIMARY KEY DEFAULT 1,
    password_hash TEXT NOT NULL
  );
`);

// Initialize admin password if not set
const adminRow = db.prepare('SELECT id FROM admin_settings WHERE id = 1').get();
if (!adminRow) {
  const hash = bcrypt.hashSync('admin1234', 10);
  db.prepare('INSERT INTO admin_settings (id, password_hash) VALUES (1, ?)').run(hash);
}

module.exports = db;

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../database/disaster_alert.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error('DB Error:', err);
  else console.log(' SQLite connected');
});

module.exports = db;

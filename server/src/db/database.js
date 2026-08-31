const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Defaults to a file next to the server code, which on Render (and most
// PaaS hosts) sits on an EPHEMERAL disk -- wiped on every deploy/restart,
// which is why every redeploy this session has silently reset every user
// account. Set DB_PATH to a location on a mounted persistent disk (Render:
// add a Disk in the service's dashboard, e.g. mounted at /data, then set
// DB_PATH=/data/disaster_alert.db as an env var) to survive redeploys.
const dbPath = process.env.DB_PATH || path.resolve(__dirname, '../../disaster_alert.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('Connected to SQLite database');
    initializeDatabase();
  }
});

function initializeDatabase() {
  db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
      userID TEXT PRIMARY KEY,
      displayName TEXT,
      photoUrl TEXT,
      latitude REAL,
      longitude REAL,
      radius INTEGER,
      lastUpdate TEXT,
      batteryLevel INTEGER
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS user_auth (
      userID TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      mobile TEXT,
      password TEXT NOT NULL,
      userType TEXT NOT NULL,
      FOREIGN KEY (userID) REFERENCES users(userID)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS friends (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      requestorID TEXT NOT NULL,
      userId TEXT NOT NULL,
      status TEXT NOT NULL,
      lastLocationUpdate TEXT,
      FOREIGN KEY (requestorID) REFERENCES users(userID),
      FOREIGN KEY (userId) REFERENCES users(userID)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS disaster (
      id TEXT PRIMARY KEY,
      eventID INTEGER,
      title TEXT NOT NULL,
      description TEXT,
      severity TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      expiryTime TEXT NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      radius REAL NOT NULL,
      source TEXT,
      type TEXT,
      desc TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS user_alerts (
      userID TEXT NOT NULL,
      alertID TEXT NOT NULL,
      isActive INTEGER NOT NULL DEFAULT 1,
      PRIMARY KEY (userID, alertID),
      FOREIGN KEY (userID) REFERENCES users(userID),
      FOREIGN KEY (alertID) REFERENCES disaster(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS safelocation (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      eventID INTEGER NOT NULL,
      safelat REAL NOT NULL,
      safelong REAL NOT NULL,
      type TEXT NOT NULL,
      desc TEXT NOT NULL
    )`);

    console.log('Database tables initialized');
  });
}

module.exports = db;

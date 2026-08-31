const { createClient } = require('@libsql/client');

// Turso (hosted libSQL -- SQLite-compatible, network-backed, free tier)
// instead of a local sqlite3 file. The local file lived on the server's
// disk with no persistent volume, which most PaaS hosts (Render included)
// wipe on every deploy/restart -- every account created was lost the next
// time the server redeployed. A real persistent disk on Render only comes
// with a paid plan; Turso's free tier gives the same durability without
// that cost.
const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

function toArgs(params) {
  if (params == null) return [];
  return Array.isArray(params) ? params : [params];
}

function toPlainRows(rows) {
  // libSQL's Row objects support both index and column-name access but
  // aren't guaranteed to serialize through JSON.stringify the same way a
  // plain object does -- spread them into real plain objects up front so
  // res.json(rows) downstream always behaves exactly like it did with the
  // sqlite3 driver.
  return rows.map((r) => ({ ...r }));
}

// Thin shim reproducing the exact subset of node-sqlite3's callback-based
// API this codebase already calls (db.run/get/all/serialize/prepare,
// including `this.lastID`/`this.changes` inside a `function (err) {...}`
// callback) -- so every existing controller keeps working completely
// unchanged; only this file needed to change for the storage swap.
const db = {
  run(sql, params, callback) {
    if (typeof params === 'function') { callback = params; params = []; }
    client.execute({ sql, args: toArgs(params) })
      .then((result) => {
        if (callback) {
          callback.call({ lastID: Number(result.lastInsertRowid ?? 0), changes: result.rowsAffected }, null);
        }
      })
      .catch((err) => { if (callback) callback.call({}, err); });
  },

  get(sql, params, callback) {
    if (typeof params === 'function') { callback = params; params = []; }
    client.execute({ sql, args: toArgs(params) })
      .then((result) => { if (callback) callback(null, toPlainRows(result.rows)[0]); })
      .catch((err) => { if (callback) callback(err); });
  },

  all(sql, params, callback) {
    if (typeof params === 'function') { callback = params; params = []; }
    client.execute({ sql, args: toArgs(params) })
      .then((result) => { if (callback) callback(null, toPlainRows(result.rows)); })
      .catch((err) => { if (callback) callback(err); });
  },

  prepare(sql) {
    return {
      run(...args) {
        let callback;
        if (typeof args[args.length - 1] === 'function') callback = args.pop();
        client.execute({ sql, args })
          .then((result) => {
            if (callback) {
              callback.call({ lastID: Number(result.lastInsertRowid ?? 0), changes: result.rowsAffected }, null);
            }
          })
          .catch((err) => { if (callback) callback.call({}, err); });
        return this;
      },
      finalize(cb) { if (cb) cb(); },
    };
  },

  serialize(fn) { fn(); },
};

async function initializeDatabase() {
  await client.execute(`CREATE TABLE IF NOT EXISTS users (
    userID TEXT PRIMARY KEY,
    displayName TEXT,
    photoUrl TEXT,
    latitude REAL,
    longitude REAL,
    radius INTEGER,
    lastUpdate TEXT,
    batteryLevel INTEGER
  )`);

  await client.execute(`CREATE TABLE IF NOT EXISTS user_auth (
    userID TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    mobile TEXT,
    password TEXT NOT NULL,
    userType TEXT NOT NULL,
    FOREIGN KEY (userID) REFERENCES users(userID)
  )`);

  await client.execute(`CREATE TABLE IF NOT EXISTS friends (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    requestorID TEXT NOT NULL,
    userId TEXT NOT NULL,
    status TEXT NOT NULL,
    lastLocationUpdate TEXT,
    FOREIGN KEY (requestorID) REFERENCES users(userID),
    FOREIGN KEY (userId) REFERENCES users(userID)
  )`);

  await client.execute(`CREATE TABLE IF NOT EXISTS disaster (
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

  await client.execute(`CREATE TABLE IF NOT EXISTS user_alerts (
    userID TEXT NOT NULL,
    alertID TEXT NOT NULL,
    isActive INTEGER NOT NULL DEFAULT 1,
    PRIMARY KEY (userID, alertID),
    FOREIGN KEY (userID) REFERENCES users(userID),
    FOREIGN KEY (alertID) REFERENCES disaster(id)
  )`);

  await client.execute(`CREATE TABLE IF NOT EXISTS safelocation (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    eventID INTEGER NOT NULL,
    safelat REAL NOT NULL,
    safelong REAL NOT NULL,
    type TEXT NOT NULL,
    desc TEXT NOT NULL
  )`);

  console.log('Database tables initialized (Turso)');
}

initializeDatabase().catch((err) => {
  console.error('Error initializing Turso database:', err.message);
});

module.exports = db;

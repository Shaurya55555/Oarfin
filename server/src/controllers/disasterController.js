const db = require('../db/database');

function getAllDisasters(req, res) {
  const sql = `SELECT * FROM disaster WHERE datetime(expiryTime) > datetime('now')`;
  db.all(sql, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
}

function reportDisaster(req, res) {
  const { eventID, latitude, longitude, radius, type, desc } = req.body;

  if (!eventID || !latitude || !longitude || !radius || !type) {
    return res.status(400).json({ error: 'eventID, latitude, longitude, radius, and type are required' });
  }

  const id = `disaster-${eventID}-${Date.now()}`;
  const now = new Date();
  const expiryTime = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const severityMap = { earthquake: 'Critical', flood: 'Critical', fire: 'Critical', storm: 'Warning', other: 'Watch' };
  const severity = severityMap[type.toLowerCase()] || 'Warning';
  const title = `${type.charAt(0).toUpperCase() + type.slice(1)} Alert`;

  const sql = `
    INSERT INTO disaster (id, eventID, title, description, severity, timestamp, expiryTime, latitude, longitude, radius, source, type, desc)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.run(sql, [id, eventID, title, desc || '', severity, now.toISOString(), expiryTime.toISOString(), latitude, longitude, radius, 'WEBSITE', type, desc || ''], function (err) {
    if (err) {
      console.error('Error creating disaster:', err);
      return res.status(500).json({ error: err.message });
    }

    // Find affected users and create alerts for them
    const alertSql = `
      SELECT userID FROM users
      WHERE (latitude BETWEEN ? - (?/111.0) AND ? + (?/111.0))
        AND (longitude BETWEEN ? - (?/(111.0 * COS(RADIANS(latitude)))) AND ? + (?/(111.0 * COS(RADIANS(latitude)))))
    `;

    db.all(alertSql, [latitude, radius, latitude, radius, longitude, radius, longitude, radius], (err, users) => {
      if (!err && users.length > 0) {
        users.forEach((user) => {
          db.run('INSERT OR REPLACE INTO user_alerts (userID, alertID, isActive) VALUES (?, ?, 1)', [user.userID, id]);
        });
      }

      res.status(201).json({
        message: 'Disaster recorded successfully',
        id,
        affectedUsers: users ? users.length : 0,
      });
    });
  });
}

module.exports = { getAllDisasters, reportDisaster };

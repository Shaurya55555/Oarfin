const db = require('../db/database');

function updateUserAlerts(userID, alertIDs) {
  if (!Array.isArray(alertIDs) || alertIDs.length === 0) return;

  db.run('UPDATE user_alerts SET isActive = 0 WHERE userID = ?', [userID], (err) => {
    if (err) return console.error('Error deactivating old alerts:', err);
    alertIDs.forEach((alertID) => {
      db.run('INSERT OR REPLACE INTO user_alerts (userID, alertID, isActive) VALUES (?, ?, 1)', [userID, alertID]);
    });
  });
}

function checkForNearbyDisasters(userID, latitude, longitude) {
  const sql = `
    SELECT id, eventID FROM disaster
    WHERE (latitude BETWEEN ? - (radius/111.0) AND ? + (radius/111.0))
      AND (longitude BETWEEN ? - (radius/(111.0 * COS(RADIANS(?)))) AND ? + (radius/(111.0 * COS(RADIANS(?)))))
      AND eventID IS NOT NULL
      AND datetime(expiryTime) > datetime('now')
  `;

  db.all(sql, [latitude, latitude, longitude, latitude, longitude, latitude], (err, rows) => {
    if (err) return console.error('Error checking nearby disasters:', err);
    if (rows.length > 0) {
      rows.forEach((row) => {
        db.run('INSERT OR REPLACE INTO user_alerts (userID, alertID, isActive) VALUES (?, ?, 1)', [userID, row.id]);
      });
    }
  });
}

function updateLocation(req, res) {
  const userID = req.userID;
  const { latitude, longitude, radius, timestamp, batteryLevel } = req.body;

  if (!latitude || !longitude) {
    return res.status(400).json({ error: 'latitude and longitude are required' });
  }

  const now = timestamp || new Date().toISOString();
  const userRadius = radius || 100;

  db.run(
    'UPDATE users SET latitude = ?, longitude = ?, radius = ?, lastUpdate = ?, batteryLevel = ? WHERE userID = ?',
    [latitude, longitude, userRadius, now, batteryLevel, userID],
    function (err) {
      if (err) return res.status(500).json({ error: 'Failed to update location' });

      if (this.changes === 0) {
        db.run(
          'INSERT INTO users (userID, latitude, longitude, radius, lastUpdate, batteryLevel) VALUES (?, ?, ?, ?, ?, ?)',
          [userID, latitude, longitude, userRadius, now, batteryLevel],
          (err) => {
            if (err) return res.status(500).json({ error: 'Failed to create user' });
            checkForNearbyDisasters(userID, latitude, longitude);
            res.status(200).json({ message: 'Location updated successfully' });
          }
        );
      } else {
        checkForNearbyDisasters(userID, latitude, longitude);
        res.status(200).json({ message: 'Location updated successfully' });
      }
    }
  );
}

function getAlerts(req, res) {
  const userID = req.userID;
  const { latitude, longitude, radius } = req.body;

  if (!latitude || !longitude || !radius) {
    return res.status(400).json({ error: 'latitude, longitude, and radius are required' });
  }

  const sql = `
    SELECT d.id, d.title, d.description, d.severity, d.timestamp, d.expiryTime,
           d.latitude, d.longitude, d.radius, d.source, d.type
    FROM disaster d
    WHERE (? BETWEEN d.latitude - (d.radius/111.0) AND d.latitude + (d.radius/111.0))
      AND (? BETWEEN d.longitude - (d.radius/(111.0 * COS(RADIANS(?)))) AND d.longitude + (d.radius/(111.0 * COS(RADIANS(?)))))
      AND datetime(d.expiryTime) > datetime('now')
  `;

  db.all(sql, [latitude, longitude, latitude, latitude], (err, disasters) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch alerts' });

    updateUserAlerts(userID, disasters.map((d) => d.id));

    const eventIDs = disasters.map((d) => d.eventID).filter(Boolean);
    if (eventIDs.length === 0) return res.json({ alerts: disasters, safeLocations: [] });

    const placeholders = eventIDs.map(() => '?').join(',');
    db.all(`SELECT eventID, safelat, safelong, type, desc FROM safelocation WHERE eventID IN (${placeholders})`, eventIDs, (err, safeLocations) => {
      res.json({ alerts: disasters, safeLocations: err ? [] : safeLocations });
    });
  });
}

module.exports = { updateLocation, getAlerts };

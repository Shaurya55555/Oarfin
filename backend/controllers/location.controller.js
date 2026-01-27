const db = require('../config/db');
const getUserID = require('../middlewares/auth.middleware');
const { checkForDisasters } = require('../services/alert.service');

exports.updateLocation = (req, res) => {
  const userID = getUserID(req);
  const { latitude, longitude, radius = 100, batteryLevel } = req.body;

  if (!latitude || !longitude) {
    return res.status(400).json({ error: 'Latitude & longitude required' });
  }

  const now = new Date().toISOString();

  const sql = `
    INSERT INTO users (userID, latitude, longitude, radius, lastUpdate, batteryLevel)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(userID) DO UPDATE SET
      latitude=excluded.latitude,
      longitude=excluded.longitude,
      radius=excluded.radius,
      lastUpdate=excluded.lastUpdate,
      batteryLevel=excluded.batteryLevel
  `;

  db.run(sql, [userID, latitude, longitude, radius, now, batteryLevel], () => {
    checkForDisasters(userID, latitude, longitude);
    res.json({ message: 'Location updated successfully' });
  });
};

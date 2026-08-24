const db = require('../db/database');

function getAllSafeLocations(req, res) {
  db.all('SELECT * FROM safelocation', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
}

function reportSafeLocation(req, res) {
  const { eventID, safelat, safelong, type, desc } = req.body;

  if (!eventID || !safelat || !safelong || !type || !desc) {
    return res.status(400).json({ error: 'eventID, safelat, safelong, type, and desc are required' });
  }

  const stmt = db.prepare('INSERT INTO safelocation (eventID, safelat, safelong, type, desc) VALUES (?, ?, ?, ?, ?)');
  stmt.run(eventID, safelat, safelong, type, desc, function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ message: 'Safe location recorded successfully', id: this.lastID });
  });
  stmt.finalize();
}

module.exports = { getAllSafeLocations, reportSafeLocation };

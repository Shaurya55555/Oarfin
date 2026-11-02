const db = require('../db/database');

// Promise wrappers over the callback-style db shim.
const all = (sql, params) => new Promise((resolve, reject) => db.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows))));
const get = (sql, params) => new Promise((resolve, reject) => db.get(sql, params, (err, row) => (err ? reject(err) : resolve(row))));
const run = (sql, params) =>
  new Promise((resolve, reject) =>
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    })
  );

// GET /api/friends?status=accepted|pending
// Each row describes the *other* person in the friendship, with their last
// reported location and how many active disaster alerts they are inside.
async function listFriends(req, res) {
  const status = req.query.status === 'pending' ? 'pending' : 'accepted';
  try {
    const rows = await all(
      `SELECT f.id, f.requestorID, f.status,
              other.userID AS userId, other.displayName, other.latitude, other.longitude,
              other.lastUpdate AS lastLocationUpdate, other.batteryLevel,
              ua.email
       FROM friends f
       JOIN users other ON other.userID = CASE WHEN f.requestorID = ? THEN f.userId ELSE f.requestorID END
       LEFT JOIN user_auth ua ON ua.userID = other.userID
       WHERE (f.requestorID = ? OR f.userId = ?) AND f.status = ?
       ORDER BY other.displayName`,
      [req.userID, req.userID, req.userID, status]
    );

    const otherIds = rows.map((r) => r.userId);
    const alertCounts = {};
    if (status === 'accepted' && otherIds.length) {
      const placeholders = otherIds.map(() => '?').join(',');
      const counts = await all(
        `SELECT ua.userID, COUNT(*) AS n
         FROM user_alerts ua JOIN disaster d ON d.id = ua.alertID
         WHERE ua.isActive = 1 AND datetime(d.expiryTime) > datetime('now') AND ua.userID IN (${placeholders})
         GROUP BY ua.userID`,
        otherIds
      );
      counts.forEach((c) => (alertCounts[c.userID] = Number(c.n)));
    }

    res.json(
      rows.map((r) => ({
        id: String(r.id),
        userId: r.userId,
        displayName: r.displayName || r.email || 'Oarfin user',
        email: r.email || '',
        // Location is only shared once a request is accepted.
        latitude: status === 'accepted' ? r.latitude : null,
        longitude: status === 'accepted' ? r.longitude : null,
        lastLocationUpdate: status === 'accepted' ? r.lastLocationUpdate : null,
        batteryLevel: status === 'accepted' ? r.batteryLevel : null,
        activeAlertsCount: alertCounts[r.userId] || 0,
        isRequestor: r.requestorID === req.userID,
      }))
    );
  } catch (err) {
    console.error('Error listing friends:', err.message);
    res.status(500).json({ error: 'Failed to load friends' });
  }
}

// POST /api/friends/request  { email }
async function sendRequest(req, res) {
  const email = String(req.body.email || '').trim().toLowerCase();
  if (!email) return res.status(400).json({ error: 'email is required' });

  try {
    const target = await get('SELECT userID FROM user_auth WHERE lower(email) = ?', [email]);
    if (!target) return res.status(404).json({ error: 'No Oarfin account uses that email' });
    if (target.userID === req.userID) return res.status(400).json({ error: "You can't add yourself" });

    const existing = await get(
      `SELECT id, status, requestorID FROM friends
       WHERE (requestorID = ? AND userId = ?) OR (requestorID = ? AND userId = ?)`,
      [req.userID, target.userID, target.userID, req.userID]
    );
    if (existing) {
      if (existing.status === 'accepted') return res.status(409).json({ error: 'You are already friends' });
      // They already asked us: treat our request as accepting theirs.
      if (existing.requestorID === target.userID) {
        await run(`UPDATE friends SET status = 'accepted' WHERE id = ?`, [existing.id]);
        return res.json({ message: 'Friend request accepted', id: String(existing.id) });
      }
      return res.status(409).json({ error: 'Request already sent' });
    }

    const result = await run(`INSERT INTO friends (requestorID, userId, status) VALUES (?, ?, 'pending')`, [req.userID, target.userID]);
    res.status(201).json({ message: 'Friend request sent', id: String(result.lastID) });
  } catch (err) {
    console.error('Error sending friend request:', err.message);
    res.status(500).json({ error: 'Failed to send friend request' });
  }
}

// PUT /api/friends/respond  { requestId, status: 'accept' | 'reject' }
async function respondToRequest(req, res) {
  const { requestId, status } = req.body;
  if (!requestId || !['accept', 'reject'].includes(status)) {
    return res.status(400).json({ error: "requestId and status ('accept' or 'reject') are required" });
  }

  try {
    const request = await get(`SELECT id FROM friends WHERE id = ? AND userId = ? AND status = 'pending'`, [requestId, req.userID]);
    if (!request) return res.status(404).json({ error: 'Friend request not found' });

    if (status === 'accept') {
      await run(`UPDATE friends SET status = 'accepted' WHERE id = ?`, [requestId]);
      return res.json({ message: 'Friend request accepted' });
    }
    await run('DELETE FROM friends WHERE id = ?', [requestId]);
    res.json({ message: 'Friend request declined' });
  } catch (err) {
    console.error('Error responding to friend request:', err.message);
    res.status(500).json({ error: 'Failed to respond to friend request' });
  }
}

// DELETE /api/friends/:id  — remove a friend or cancel a pending request (either side).
async function removeFriend(req, res) {
  try {
    const result = await run('DELETE FROM friends WHERE id = ? AND (requestorID = ? OR userId = ?)', [
      req.params.id,
      req.userID,
      req.userID,
    ]);
    if (!result.changes) return res.status(404).json({ error: 'Friend not found' });
    res.json({ message: 'Friend removed' });
  } catch (err) {
    console.error('Error removing friend:', err.message);
    res.status(500).json({ error: 'Failed to remove friend' });
  }
}

module.exports = { listFriends, sendRequest, respondToRequest, removeFriend };

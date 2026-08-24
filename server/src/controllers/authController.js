const db = require('../db/database');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function generateToken(userID) {
  return jwt.sign({ userID }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '7d' });
}

function register(req, res) {
  const { firstName, lastName, email, mobile, password, userType } = req.body;

  if (!firstName || !lastName || !email || !password || !userType) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const userID = `user-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const displayName = `${firstName} ${lastName}`;
  const hashedPassword = hashPassword(password);

  db.run(
    `INSERT INTO users (userID, displayName, photoUrl) VALUES (?, ?, ?)`,
    [userID, displayName, ''],
    function (err) {
      if (err) {
        if (err.message.includes('UNIQUE')) return res.status(409).json({ error: 'Email already registered' });
        return res.status(500).json({ error: 'Registration failed' });
      }

      // store auth info in a separate table
      db.run(
        `INSERT INTO user_auth (userID, email, mobile, password, userType) VALUES (?, ?, ?, ?, ?)`,
        [userID, email, mobile || '', hashedPassword, userType],
        (err) => {
          if (err) {
            if (err.message.includes('UNIQUE')) return res.status(409).json({ error: 'Email already registered' });
            return res.status(500).json({ error: 'Registration failed' });
          }
          res.status(201).json({ message: 'Account created successfully' });
        }
      );
    }
  );
}

function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

  const hashedPassword = hashPassword(password);

  db.get(
    `SELECT ua.userID, ua.email, ua.userType, u.displayName
     FROM user_auth ua JOIN users u ON ua.userID = u.userID
     WHERE ua.email = ? AND ua.password = ?`,
    [email, hashedPassword],
    (err, row) => {
      if (err) return res.status(500).json({ error: 'Login failed' });
      if (!row) return res.status(401).json({ error: 'Invalid email or password' });

      const token = generateToken(row.userID);
      res.json({
        token,
        user: { userID: row.userID, email: row.email, displayName: row.displayName, userType: row.userType },
      });
    }
  );
}

module.exports = { register, login };

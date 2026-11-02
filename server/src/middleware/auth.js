const jwt = require('jsonwebtoken');

function getUserIDFromToken(req) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return req.body.userID || 'demo-user';
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    return decoded.userID;
  } catch {
    return req.body.userID || 'demo-user';
  }
}

function authMiddleware(req, res, next) {
  try {
    req.userID = getUserIDFromToken(req);
    next();
  } catch (e) {
    return res.status(401).json({ error: e.message });
  }
}

// Stricter than authMiddleware: no fallback to a body userID or 'demo-user'.
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Please sign in' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.userID = decoded.userID;
    next();
  } catch {
    return res.status(401).json({ error: 'Your session has expired. Please sign in again.' });
  }
}

module.exports = { authMiddleware, getUserIDFromToken, requireAuth };

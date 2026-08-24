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

module.exports = { authMiddleware, getUserIDFromToken };

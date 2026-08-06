const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'insightai_super_secret_jwt_key_2026';

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    // Demo guest user fallback
    req.user = { id: 'demo-user-123', email: 'demo@insight.ai', name: 'Demo Analyst', role: 'user' };
    return next();
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      req.user = { id: 'demo-user-123', email: 'demo@insight.ai', name: 'Demo Analyst', role: 'user' };
      return next();
    }
    req.user = user;
    next();
  });
}

module.exports = { authenticateToken, JWT_SECRET };

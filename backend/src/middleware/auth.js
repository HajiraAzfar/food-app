const jwt = require('jsonwebtoken');

function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: 'Login zaroori hai' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: payload.id, role: payload.role };
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token ghalat ya expire ho chuka hai' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Login zaroori hai' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Aapko is cheez ki ijazat nahi' });
    }
    next();
  };
}

module.exports = { authenticate, requireRole };
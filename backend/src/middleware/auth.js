const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Akses ditolak: Token tidak disediakan' });
  }

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET || 'pesantren_secret_key_jwt_super_secure_123!');
    req.user = verified;
    next();
  } catch (error) {
    res.status(403).json({ message: 'Token tidak valid atau kedaluwarsa' });
  }
};

const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'ADMIN') {
    next();
  } else {
    res.status(403).json({ message: 'Akses ditolak: Hanya untuk Admin/Server' });
  }
};

const isSantri = (req, res, next) => {
  if (req.user && req.user.role === 'SANTRI') {
    next();
  } else {
    res.status(403).json({ message: 'Akses ditolak: Hanya untuk Santri/Wali' });
  }
};

module.exports = {
  verifyToken,
  isAdmin,
  isSantri
};

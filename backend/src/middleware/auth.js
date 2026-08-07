const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  // 1. Coba ambil dari cookie httpOnly (lebih aman dari XSS)
  let token = req.cookies ? req.cookies.simesra_token : null;

  // 2. Fallback: Ambil dari Authorization Header (dukungan untuk Capacitor mobile app)
  if (!token) {
    const authHeader = req.headers['authorization'];
    token = authHeader && authHeader.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Akses ditolak: Token tidak disediakan' });
  }

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
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

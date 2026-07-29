const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email dan password wajib diisi' });
    }

    let user = await prisma.user.findUnique({ where: { email } });
    let role = 'ADMIN';
    let status = 'ACTIVE';

    if (!user) {
      user = await prisma.santri.findUnique({ where: { email } });
      role = 'SANTRI';
      if (user) {
        status = user.status || 'ACTIVE';
      }
    }

    if (!user) {
      return res.status(401).json({ message: 'Email atau password salah' });
    }

    if (role === 'SANTRI' && status !== 'ACTIVE') {
      return res.status(401).json({ message: 'Akun Anda belum aktif. Silakan hubungi admin.' });
    }

    // Bandingkan password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Email atau password salah' });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user.id,
        nama: user.nama,
        email: user.email,
        role: role,
        status: status
      },
      process.env.JWT_SECRET || 'pesantren_secret_key_jwt_super_secure_123!',
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login berhasil',
      token,
      user: {
        id: user.id,
        nama: user.nama,
        email: user.email,
        role: role,
        status: status
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server saat login' });
  }
};

const getMe = async (req, res) => {
  try {
    let user;
    if (req.user.role === 'SANTRI') {
      user = await prisma.santri.findUnique({
        where: { id: req.user.id },
        select: {
          id: true,
          nama: true,
          email: true,
          noHp: true,
          alamat: true,
          fotoProfil: true,
          kelas: true,
          status: true
        }
      });
    } else {
      user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: {
          id: true,
          nama: true,
          email: true,
          noHp: true,
          alamat: true,
          fotoProfil: true
        }
      });
    }

    if (!user) {
      return res.status(404).json({ message: 'User tidak ditemukan' });
    }

    res.json({
      ...user,
      role: req.user.role || 'ADMIN',
      status: req.user.role === 'SANTRI' ? (user.status || 'ACTIVE') : 'ACTIVE'
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server saat memuat profil' });
  }
};

const changePassword = async (req, res) => {
  try {
    const { passwordLama, passwordBaru } = req.body;
    const userId = req.user.id;

    if (!passwordLama || !passwordBaru) {
      return res.status(400).json({ message: 'Kata sandi lama dan kata sandi baru wajib diisi' });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ message: 'User tidak ditemukan' });
    }

    // Verifikasi kata sandi lama
    const isPasswordValid = await bcrypt.compare(passwordLama, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Kata sandi lama Anda salah' });
    }

    // Hash kata sandi baru
    const newHashedPassword = await bcrypt.hash(passwordBaru, 10);

    // Update password di database
    await prisma.user.update({
      where: { id: userId },
      data: { password: newHashedPassword }
    });

    res.json({ message: 'Kata sandi berhasil diperbarui' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server saat mengubah kata sandi' });
  }
};

module.exports = {
  login,
  getMe,
  changePassword
};


const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const register = async (req, res) => {
  try {
    const { nama, email, password, noHp, alamat, namaWali, kelas, role: reqRole } = req.body;

    // Validasi basic
    if (!nama || !email || !password || !noHp || !alamat) {
      return res.status(400).json({ message: 'Semua field wajib diisi (Nama, Email, Password, No. HP, Alamat)' });
    }

    // Validasi format nomor HP
    const numericPhone = /^[0-9]+$/;
    if (!numericPhone.test(noHp)) {
      return res.status(400).json({ message: 'Nomor HP harus berupa angka' });
    }

    // Cek email duplikat
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'Email sudah terdaftar' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Tentukan status dan role
    // Default register adalah status PENDING dan role SANTRI.
    // Jika admin yang membuat (lewat token admin), status bisa ACTIVE dan role bisa diatur.
    let status = 'PENDING';
    let role = 'SANTRI';

    // Cek apakah request dibuat oleh admin
    const authHeader = req.headers['authorization'];
    if (authHeader) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'pesantren_secret_key_jwt_super_secure_123!');
        if (decoded.role === 'ADMIN') {
          role = reqRole || 'SANTRI';
          status = 'ACTIVE'; // Dibuat oleh admin otomatis aktif
        }
      } catch (err) {
        // Abaikan error token, anggap sebagai registrasi mandiri
      }
    }

    const newUser = await prisma.user.create({
      data: {
        nama,
        email,
        password: hashedPassword,
        noHp,
        alamat,
        namaWali: role === 'SANTRI' ? namaWali : null,
        kelas: role === 'SANTRI' ? kelas : null,
        role,
        status
      }
    });

    res.status(201).json({
      message: role === 'SANTRI' && status === 'PENDING' 
        ? 'Pendaftaran berhasil. Akun Anda berstatus pending menunggu aktivasi dari Admin.'
        : 'Akun berhasil dibuat.',
      user: {
        id: newUser.id,
        nama: newUser.nama,
        email: newUser.email,
        role: newUser.role,
        status: newUser.status
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server saat pendaftaran' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email dan password wajib diisi' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'Email atau password salah' });
    }

    // Cek status akun
    if (user.status === 'PENDING') {
      return res.status(403).json({ message: 'Akun Anda belum aktif. Silakan hubungi admin untuk aktivasi.' });
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
        role: user.role,
        status: user.status
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
        role: user.role,
        status: user.status
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server saat login' });
  }
};

const getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        nama: true,
        email: true,
        noHp: true,
        alamat: true,
        namaWali: true,
        kelas: true,
        role: true,
        status: true
      }
    });

    if (!user) {
      return res.status(404).json({ message: 'User tidak ditemukan' });
    }

    res.json(user);
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
  register,
  login,
  getMe,
  changePassword
};


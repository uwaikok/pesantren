require('dotenv').config();

// Validasi Environment Variables Wajib demi keamanan
const requiredEnvVars = ['JWT_SECRET', 'DATABASE_URL'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar] || process.env[envVar].trim() === '');

if (missingEnvVars.length > 0) {
  console.error('================================================================');
  console.error('❌ EROR STARTUP SERIUS: Environment Variable Wajib Tidak Ditemukan!');
  console.error(`Variabel yang kurang: ${missingEnvVars.join(', ')}`);
  console.error('Silakan konfigurasi variabel ini di file .env Anda atau platform hosting.');
  console.error('Server dihentikan otomatis demi keamanan data.');
  console.error('================================================================');
  process.exit(1);
}

const express = require('express');
const cors = require('cors');
const path = require('path');
const routes = require('./routes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*', // Untuk kemudahan development, izinkan dari origin mana pun
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Serve static files for uploaded profile photos
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Main Routing
app.use('/api', routes);

// Route pengecekan kesehatan API
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server SIM Pesantren berjalan dengan baik' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Terjadi kesalahan internal pada server' });
});

app.listen(PORT, () => {
  console.log(`=================================================`);
  console.log(` Server berjalan di http://localhost:${PORT}`);
  console.log(` API base path: http://localhost:${PORT}/api`);
  console.log(`=================================================`);
});

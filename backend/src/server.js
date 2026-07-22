require('dotenv').config();
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

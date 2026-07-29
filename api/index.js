const express = require('express');
const cors = require('cors');
const path = require('path');

// Load environment variables (locally from backend/.env, on Vercel from env vars)
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });
}

const routes = require('../backend/src/routes/index.js');

const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded files (won't persist on Vercel serverless, but needed for local dev)
app.use('/uploads', express.static(path.join(__dirname, '../backend/uploads')));

// Main Routing
app.use('/api', routes);

app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server SIM Pesantren berjalan dengan baik', env: process.env.NODE_ENV });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Terjadi kesalahan internal pada server' });
});

module.exports = app;

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const routes = require('./routes');
const pool = require('./config/database');

// Run startup migrations (idempotent ALTER TABLE statements)
async function runMigrations() {
  // Prescriptions: walk-in patient support
  try { await pool.query(`ALTER TABLE prescriptions ALTER COLUMN patient_id DROP NOT NULL`); } catch (_) {}
  try { await pool.query(`ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS walk_in_patient JSONB`); } catch (e) { console.error('Migration:', e.message); }

  // Medicine items: stop support
  try { await pool.query(`ALTER TABLE medicine_items ADD COLUMN IF NOT EXISTS stopped_at TIMESTAMPTZ`); } catch (_) {}
  try { await pool.query(`ALTER TABLE medicine_items ADD COLUMN IF NOT EXISTS stop_reason TEXT`); } catch (_) {}
  try { await pool.query(`ALTER TABLE medicine_items ADD COLUMN IF NOT EXISTS stop_notes TEXT`); } catch (_) {}

  // Medicine dose logs: daily taken tracking
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS medicine_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        medicine_item_id UUID REFERENCES medicine_items(id) ON DELETE CASCADE,
        patient_id UUID,
        dose_date DATE NOT NULL DEFAULT CURRENT_DATE,
        dose_slot VARCHAR(20) NOT NULL,
        taken_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(medicine_item_id, dose_date, dose_slot)
      )
    `);
  } catch (e) { console.error('Migration medicine_logs:', e.message); }
}
runMigrations();

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    const allowed = [
      'http://localhost:3000',
      'http://localhost:5173',
      process.env.FRONTEND_URL,
      'https://careweave-erx.vercel.app',
    ].filter(Boolean);
    // Allow Vercel preview URLs and no-origin requests (mobile apps, Postman)
    if (!origin || allowed.includes(origin) || origin.endsWith('.vercel.app')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 100,
  message: { success: false, message: 'Too many requests. Please try again later.' }
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50, // allow 50 attempts per 15 min (dev-friendly; tighten before production)
  message: { success: false, message: 'Too many login attempts. Please wait 15 minutes.' }
});

app.use('/api', limiter);
app.use('/api/auth/login', authLimiter);

// Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Routes
app.use('/api', routes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'RxSystem SL API' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`🚀 RxSystem API running on port ${PORT}`);
  console.log(`📋 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;

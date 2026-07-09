require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const routes = require('./routes');
const pool = require('./config/database');

// Run startup migrations (idempotent — safe to re-run on every boot)
async function runMigrations() {
  // ── Core schema (CREATE TABLE IF NOT EXISTS — safe to re-run) ──────────
  try { await pool.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`); } catch (_) {}

  try { await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      nic VARCHAR(12) UNIQUE NOT NULL,
      full_name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE,
      mobile VARCHAR(15) NOT NULL,
      role VARCHAR(20) NOT NULL CHECK (role IN ('doctor','pharmacy','patient','admin')),
      password_hash VARCHAR(255) NOT NULL,
      is_active BOOLEAN DEFAULT false,
      is_verified BOOLEAN DEFAULT false,
      two_factor_enabled BOOLEAN DEFAULT false,
      two_factor_secret VARCHAR(100),
      last_login TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )`); } catch (e) { console.error('Migration users:', e.message); }

  try { await pool.query(`
    CREATE TABLE IF NOT EXISTS doctors (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      slmc_number VARCHAR(50) UNIQUE NOT NULL,
      specialisation VARCHAR(100),
      clinic_name VARCHAR(255),
      clinic_address TEXT,
      clinic_phone VARCHAR(15),
      qualification VARCHAR(255),
      licence_expiry DATE,
      licence_status VARCHAR(20) DEFAULT 'pending' CHECK (licence_status IN ('pending','active','suspended','expired')),
      approved_by UUID REFERENCES users(id),
      approved_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )`); } catch (e) { console.error('Migration doctors:', e.message); }

  try { await pool.query(`
    CREATE TABLE IF NOT EXISTS pharmacies (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      licence_number VARCHAR(50) UNIQUE NOT NULL,
      pharmacy_name VARCHAR(255) NOT NULL,
      address TEXT NOT NULL,
      city VARCHAR(100),
      district VARCHAR(100),
      gps_lat DECIMAL(9,6),
      gps_lng DECIMAL(9,6),
      operating_hours VARCHAR(100),
      approval_status VARCHAR(20) DEFAULT 'pending' CHECK (approval_status IN ('pending','approved','suspended','rejected')),
      approved_by UUID REFERENCES users(id),
      approved_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )`); } catch (e) { console.error('Migration pharmacies:', e.message); }

  try { await pool.query(`
    CREATE TABLE IF NOT EXISTS patients (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      date_of_birth DATE,
      gender VARCHAR(10) CHECK (gender IN ('male','female','other')),
      address TEXT,
      city VARCHAR(100),
      district VARCHAR(100),
      blood_group VARCHAR(5),
      allergies TEXT,
      preferred_pharmacy_id UUID REFERENCES pharmacies(id),
      emergency_contact_name VARCHAR(255),
      emergency_contact_phone VARCHAR(15),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )`); } catch (e) { console.error('Migration patients:', e.message); }

  try { await pool.query(`
    CREATE TABLE IF NOT EXISTS prescriptions (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      prescription_code VARCHAR(20) UNIQUE NOT NULL,
      doctor_id UUID NOT NULL REFERENCES doctors(id),
      patient_id UUID REFERENCES patients(id),
      pharmacy_id UUID REFERENCES pharmacies(id),
      qr_code TEXT,
      digital_signature TEXT,
      diagnosis TEXT,
      notes TEXT,
      walk_in_patient JSONB,
      status VARCHAR(20) DEFAULT 'created' CHECK (status IN ('created','sent','received','dispensed','cancelled','expired')),
      valid_until DATE NOT NULL,
      sent_at TIMESTAMPTZ,
      received_at TIMESTAMPTZ,
      dispensed_at TIMESTAMPTZ,
      dispensed_by UUID REFERENCES users(id),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )`); } catch (e) { console.error('Migration prescriptions:', e.message); }

  try { await pool.query(`
    CREATE TABLE IF NOT EXISTS medicine_items (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      prescription_id UUID NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
      medicine_name VARCHAR(255) NOT NULL,
      generic_name VARCHAR(255),
      dosage VARCHAR(100) NOT NULL,
      quantity INTEGER NOT NULL,
      frequency VARCHAR(100),
      duration VARCHAR(100),
      instructions TEXT,
      is_dispensed BOOLEAN DEFAULT false,
      stopped_at TIMESTAMPTZ,
      stop_reason TEXT,
      stop_notes TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`); } catch (e) { console.error('Migration medicine_items:', e.message); }

  try { await pool.query(`
    CREATE TABLE IF NOT EXISTS medicines_catalogue (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      brand_name VARCHAR(255) NOT NULL,
      generic_name VARCHAR(255) NOT NULL,
      category VARCHAR(100),
      form VARCHAR(50),
      strength VARCHAR(100),
      manufacturer VARCHAR(255),
      requires_prescription BOOLEAN DEFAULT true,
      is_controlled BOOLEAN DEFAULT false,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`); } catch (e) { console.error('Migration medicines_catalogue:', e.message); }

  try { await pool.query(`
    CREATE TABLE IF NOT EXISTS notifications (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type VARCHAR(50) NOT NULL,
      title VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      reference_id UUID,
      reference_type VARCHAR(50),
      is_read BOOLEAN DEFAULT false,
      sent_via VARCHAR(20)[] DEFAULT '{}',
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`); } catch (e) { console.error('Migration notifications:', e.message); }

  try { await pool.query(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID REFERENCES users(id),
      action VARCHAR(100) NOT NULL,
      entity_type VARCHAR(50),
      entity_id UUID,
      old_data JSONB,
      new_data JSONB,
      ip_address INET,
      user_agent TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`); } catch (e) { console.error('Migration audit_logs:', e.message); }

  try { await pool.query(`
    CREATE TABLE IF NOT EXISTS otps (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      mobile VARCHAR(15),
      otp_code VARCHAR(6) NOT NULL,
      purpose VARCHAR(50) NOT NULL,
      is_used BOOLEAN DEFAULT false,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`); } catch (e) { console.error('Migration otps:', e.message); }

  // Indexes
  try { await pool.query(`CREATE INDEX IF NOT EXISTS idx_prescriptions_patient ON prescriptions(patient_id)`); } catch (_) {}
  try { await pool.query(`CREATE INDEX IF NOT EXISTS idx_prescriptions_doctor ON prescriptions(doctor_id)`); } catch (_) {}
  try { await pool.query(`CREATE INDEX IF NOT EXISTS idx_prescriptions_status ON prescriptions(status)`); } catch (_) {}
  try { await pool.query(`CREATE INDEX IF NOT EXISTS idx_prescriptions_code ON prescriptions(prescription_code)`); } catch (_) {}
  try { await pool.query(`CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id)`); } catch (_) {}
  try { await pool.query(`CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id)`); } catch (_) {}
  try { await pool.query(`CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)`); } catch (_) {}
  try { await pool.query(`CREATE INDEX IF NOT EXISTS idx_users_nic ON users(nic)`); } catch (_) {}

  // Updated_at trigger
  try { await pool.query(`
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
    $$ language 'plpgsql'`); } catch (_) {}
  try { await pool.query(`CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()`); } catch (_) {}
  try { await pool.query(`CREATE TRIGGER update_doctors_updated_at BEFORE UPDATE ON doctors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()`); } catch (_) {}
  try { await pool.query(`CREATE TRIGGER update_pharmacies_updated_at BEFORE UPDATE ON pharmacies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()`); } catch (_) {}
  try { await pool.query(`CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON patients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()`); } catch (_) {}
  try { await pool.query(`CREATE TRIGGER update_prescriptions_updated_at BEFORE UPDATE ON prescriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()`); } catch (_) {}

  // ── Additional column patches ──────────────────────────────────────────
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

  // ── Seed: default admin user (only if none exists) ────────────────────
  try {
    const bcrypt = require('bcryptjs');
    const adminCheck = await pool.query(`SELECT id FROM users WHERE role='admin' LIMIT 1`);
    if (adminCheck.rows.length === 0) {
      const hash = await bcrypt.hash('Admin@1234!', 12);
      await pool.query(
        `INSERT INTO users (nic, full_name, email, mobile, role, password_hash, is_active, is_verified)
         VALUES ('000000000000','Admin User','admin@careweave.test','0700000000','admin',$1,true,true)`,
        [hash]
      );
      console.log('✅ Default admin user seeded (mobile: 0700000000, password: Admin@1234!)');
    }
  } catch (e) { console.error('Seed admin error:', e.message); }
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

// Health check — also tests DB connection
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', db: 'connected', timestamp: new Date().toISOString(), service: 'RxSystem SL API' });
  } catch (err) {
    res.status(500).json({ status: 'ok', db: 'ERROR: ' + err.message, timestamp: new Date().toISOString() });
  }
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

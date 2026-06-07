-- RxSystem Sri Lanka - Full Database Schema
-- Run: psql -U postgres -d rxsystem_sl -f schema.sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================
-- USERS TABLE (base)
-- =====================
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
);

-- =====================
-- DOCTORS TABLE
-- =====================
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
);

-- =====================
-- PHARMACIES TABLE
-- =====================
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
);

-- =====================
-- PATIENTS TABLE
-- =====================
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
);

-- =====================
-- PRESCRIPTIONS TABLE
-- =====================
CREATE TABLE IF NOT EXISTS prescriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prescription_code VARCHAR(20) UNIQUE NOT NULL,
    doctor_id UUID NOT NULL REFERENCES doctors(id),
    patient_id UUID NOT NULL REFERENCES patients(id),
    pharmacy_id UUID REFERENCES pharmacies(id),
    qr_code TEXT,
    digital_signature TEXT,
    diagnosis TEXT,
    notes TEXT,
    status VARCHAR(20) DEFAULT 'created' CHECK (status IN ('created','sent','received','dispensed','cancelled','expired')),
    valid_until DATE NOT NULL,
    sent_at TIMESTAMPTZ,
    received_at TIMESTAMPTZ,
    dispensed_at TIMESTAMPTZ,
    dispensed_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- MEDICINE ITEMS TABLE
-- =====================
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
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- MEDICINES CATALOGUE
-- =====================
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
);

-- =====================
-- NOTIFICATIONS TABLE
-- =====================
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
);

-- =====================
-- AUDIT LOGS TABLE
-- =====================
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
);

-- =====================
-- OTP TABLE
-- =====================
CREATE TABLE IF NOT EXISTS otps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    mobile VARCHAR(15),
    otp_code VARCHAR(6) NOT NULL,
    purpose VARCHAR(50) NOT NULL,
    is_used BOOLEAN DEFAULT false,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- INDEXES
-- =====================
CREATE INDEX IF NOT EXISTS idx_prescriptions_patient ON prescriptions(patient_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_doctor ON prescriptions(doctor_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_pharmacy ON prescriptions(pharmacy_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_status ON prescriptions(status);
CREATE INDEX IF NOT EXISTS idx_prescriptions_code ON prescriptions(prescription_code);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_nic ON users(nic);

-- =====================
-- UPDATED_AT TRIGGER
-- =====================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_doctors_updated_at BEFORE UPDATE ON doctors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pharmacies_updated_at BEFORE UPDATE ON pharmacies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON patients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_prescriptions_updated_at BEFORE UPDATE ON prescriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================
-- PATCH: Add city/district to patients (safe to re-run)
-- =====================
ALTER TABLE patients ADD COLUMN IF NOT EXISTS city VARCHAR(100);
ALTER TABLE patients ADD COLUMN IF NOT EXISTS district VARCHAR(100);

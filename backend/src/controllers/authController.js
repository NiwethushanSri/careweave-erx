const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const pool = require('../config/database');
const { auditLog } = require('../utils/audit');

const generateTokens = (userId) => {
  const accessToken = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
  return { accessToken };
};

// POST /api/auth/register/patient
const registerPatient = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { nic, full_name, email, mobile, password, date_of_birth, gender, address, city, district, preferred_pharmacy_id } = req.body;

    if (!date_of_birth) {
      return res.status(400).json({ success: false, message: 'Date of birth is required' });
    }

    // Calculate age
    const today = new Date();
    const birth = new Date(date_of_birth);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;

    const isMinor = age < 15;

    // For adults, NIC is required
    if (!isMinor && !nic) {
      return res.status(400).json({ success: false, message: 'NIC is required for patients aged 15 and above' });
    }

    // Generate identifier for minors (DOB-based)
    const identifier = isMinor
      ? (nic || `DOB-${date_of_birth}-${full_name.replace(/\s+/g,'-')}`)
      : nic;

    // Check for existing patient by NIC (adults) or DOB+name (minors)
    let existingCheck;
    if (isMinor) {
      existingCheck = await client.query(
        'SELECT u.id FROM users u JOIN patients p ON p.user_id = u.id WHERE p.date_of_birth = $1 AND u.full_name = $2',
        [date_of_birth, full_name]
      );
    } else {
      existingCheck = await client.query('SELECT id FROM users WHERE nic = $1', [nic]);
    }

    if (existingCheck.rows.length > 0) {
      return res.status(409).json({ success: false, message: isMinor ? 'Patient with this name and date of birth already registered' : 'NIC already registered' });
    }

    // Check mobile
    const mobileCheck = await client.query('SELECT id FROM users WHERE mobile = $1', [mobile]);
    if (mobileCheck.rows.length > 0) {
      return res.status(409).json({ success: false, message: 'Mobile number already registered' });
    }

    const hash = await bcrypt.hash(password, 12);
    const userResult = await client.query(
      `INSERT INTO users (nic, full_name, email, mobile, role, password_hash, is_active, is_verified)
       VALUES ($1,$2,$3,$4,'patient',$5, true, true) RETURNING id, full_name, email, mobile, role`,
      [identifier, full_name, email || null, mobile, hash]
    );
    const user = userResult.rows[0];

    await client.query(
      `INSERT INTO patients (user_id, date_of_birth, gender, address, city, district, preferred_pharmacy_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [user.id, date_of_birth, gender || null, address || null, city || null, district || null, preferred_pharmacy_id || null]
    );

    await client.query('COMMIT');
    const { accessToken } = generateTokens(user.id);
    await auditLog(user.id, 'REGISTER', 'users', user.id, null, user, req.ip);

    res.status(201).json({
      success: true,
      message: isMinor ? 'Minor patient registered successfully' : 'Registration successful',
      data: { user, accessToken, isMinor, age }
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Register patient error:', err);
    res.status(500).json({ success: false, message: 'Registration failed' });
  } finally {
    client.release();
  }
};

// POST /api/auth/register/doctor
const registerDoctor = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { nic, full_name, email, mobile, password, slmc_number, specialisation, clinic_name, clinic_address, qualification } = req.body;

    const existing = await client.query(
      'SELECT id FROM users WHERE nic = $1 OR mobile = $2', [nic, mobile]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ success: false, message: 'NIC or mobile already registered' });
    }

    const slmcCheck = await client.query('SELECT id FROM doctors WHERE slmc_number = $1', [slmc_number]);
    if (slmcCheck.rows.length > 0) {
      return res.status(409).json({ success: false, message: 'SLMC number already registered' });
    }

    const hash = await bcrypt.hash(password, 12);
    const userResult = await client.query(
      `INSERT INTO users (nic, full_name, email, mobile, role, password_hash, is_active, is_verified)
       VALUES ($1,$2,$3,$4,'doctor',$5, false, false) RETURNING id, full_name, email, mobile, role`,
      [nic, full_name, email, mobile, hash]
    );
    const user = userResult.rows[0];

    await client.query(
      `INSERT INTO doctors (user_id, slmc_number, specialisation, clinic_name, clinic_address, qualification)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [user.id, slmc_number, specialisation, clinic_name, clinic_address, qualification]
    );

    await client.query('COMMIT');
    res.status(201).json({
      success: true,
      message: 'Doctor registration submitted. Awaiting admin approval.',
      data: { userId: user.id }
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Register doctor error:', err);
    res.status(500).json({ success: false, message: 'Registration failed' });
  } finally {
    client.release();
  }
};

// POST /api/auth/register/pharmacy
const registerPharmacy = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { nic, full_name, email, mobile, password, licence_number, pharmacy_name, address, city, district, gps_lat, gps_lng } = req.body;

    const existing = await client.query('SELECT id FROM users WHERE nic = $1 OR mobile = $2', [nic, mobile]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ success: false, message: 'NIC or mobile already registered' });
    }

    const hash = await bcrypt.hash(password, 12);
    const userResult = await client.query(
      `INSERT INTO users (nic, full_name, email, mobile, role, password_hash, is_active, is_verified)
       VALUES ($1,$2,$3,$4,'pharmacy',$5, false, false) RETURNING id, full_name, email, mobile, role`,
      [nic, full_name, email, mobile, hash]
    );
    const user = userResult.rows[0];

    await client.query(
      `INSERT INTO pharmacies (user_id, licence_number, pharmacy_name, address, city, district, gps_lat, gps_lng)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [user.id, licence_number, pharmacy_name, address, city, district, gps_lat || null, gps_lng || null]
    );

    await client.query('COMMIT');
    res.status(201).json({
      success: true,
      message: 'Pharmacy registration submitted. Awaiting admin approval.',
      data: { userId: user.id }
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Register pharmacy error:', err);
    res.status(500).json({ success: false, message: 'Registration failed' });
  } finally {
    client.release();
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    const result = await pool.query(
      `SELECT u.*, 
        d.id as doctor_profile_id, d.slmc_number, d.licence_status,
        ph.id as pharmacy_profile_id, ph.approval_status,
        pa.id as patient_profile_id
       FROM users u
       LEFT JOIN doctors d ON d.user_id = u.id
       LEFT JOIN pharmacies ph ON ph.user_id = u.id
       LEFT JOIN patients pa ON pa.user_id = u.id
       WHERE u.nic = $1 OR u.mobile = $1 OR u.email = $1`,
      [identifier]
    );

    if (!result.rows[0]) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Account pending approval. You will be notified when approved.'
      });
    }

    await pool.query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);
    const { accessToken } = generateTokens(user.id);
    await auditLog(user.id, 'LOGIN', 'users', user.id, null, null, req.ip);

    const userData = {
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      mobile: user.mobile,
      role: user.role,
      nic: user.nic,
    };

    if (user.role === 'doctor') userData.profileId = user.doctor_profile_id;
    if (user.role === 'pharmacy') userData.profileId = user.pharmacy_profile_id;
    if (user.role === 'patient') userData.profileId = user.patient_profile_id;

    res.json({ success: true, data: { user: userData, accessToken } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Login failed' });
  }
};

// GET /api/auth/me
const getMe = async (req, res) => {
  try {
    res.json({ success: true, data: { user: req.user } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch profile' });
  }
};



// POST /api/auth/forgot-password/verify
const forgotPasswordVerify = async (req, res) => {
  try {
    const { nic, mobile } = req.body;
    const result = await pool.query(
      'SELECT id, full_name, role FROM users WHERE nic = $1 AND mobile = $2',
      [nic, mobile]
    );
    if (!result.rows[0]) {
      return res.status(404).json({ success: false, message: 'No account found with this NIC and mobile number' });
    }
    res.json({ success: true, message: 'Identity verified', data: { userId: result.rows[0].id } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Verification failed' });
  }
};

// POST /api/auth/forgot-password/reset
const forgotPasswordReset = async (req, res) => {
  try {
    const { userId, newPassword } = req.body;
    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
    }
    const hash = await bcrypt.hash(newPassword, 12);
    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, userId]);
    res.json({ success: true, message: 'Password reset successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Reset failed' });
  }
};

module.exports = { registerPatient, registerDoctor, registerPharmacy, login, getMe, forgotPasswordVerify, forgotPasswordReset };

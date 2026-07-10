const express = require('express');
const router = express.Router();

const { authenticate, authorize } = require('../middleware/auth');
const authCtrl = require('../controllers/authController');
const prescCtrl = require('../controllers/prescriptionController');
const adminCtrl = require('../controllers/adminController');
const documentCtrl = require('../controllers/documentController');
const pool = require('../config/database');
const { getNotifications, markRead } = require('../utils/notifications');

// ========================
// HOSPITALS (public - for dropdowns)
// ========================
const SRI_LANKA_HOSPITALS = require('../data/hospitals');


router.get('/hospitals', (req, res) => {
  const { province, district, search } = req.query;
  let results = SRI_LANKA_HOSPITALS;
  if (province) results = results.filter(h => h.province.toLowerCase() === province.toLowerCase());
  if (district) results = results.filter(h => h.district.toLowerCase() === district.toLowerCase());
  if (search) results = results.filter(h =>
    h.name.toLowerCase().includes(search.toLowerCase()) ||
    h.city.toLowerCase().includes(search.toLowerCase())
  );
  res.json({ success: true, data: results });
});

// ========================
// AUTH ROUTES
// ========================
router.post('/auth/register/patient', authCtrl.registerPatient);
router.post('/auth/register/doctor', authCtrl.registerDoctor);
router.post('/auth/register/pharmacy', authCtrl.registerPharmacy);
router.post('/auth/login', authCtrl.login);
router.post('/auth/forgot-password/verify', authCtrl.forgotPasswordVerify);
router.post('/auth/forgot-password/reset', authCtrl.forgotPasswordReset);
router.get('/auth/me', authenticate, authCtrl.getMe);

// ========================
// PRESCRIPTION ROUTES
// ========================
router.get('/prescriptions/verify/:code', prescCtrl.verifyPrescription); // public
router.get('/prescriptions', authenticate, prescCtrl.getPrescriptions);
router.post('/prescriptions', authenticate, authorize('doctor'), prescCtrl.createPrescription);
router.get('/prescriptions/:id', authenticate, prescCtrl.getPrescriptionById);
router.post('/prescriptions/:id/send', authenticate, authorize('doctor'), prescCtrl.sendPrescription);
router.post('/prescriptions/:id/receive', authenticate, authorize('pharmacy'), async (req, res) => {
  try {
    const ph = await pool.query('SELECT id FROM pharmacies WHERE user_id=$1', [req.user.id]);
    const result = await pool.query(
      `UPDATE prescriptions SET status='received', received_at=NOW()
       WHERE id=$1 AND pharmacy_id=$2 AND status='sent' RETURNING *`,
      [req.params.id, ph.rows[0]?.id]
    );
    if (!result.rows[0]) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { res.status(500).json({ success: false, message: 'Failed' }); }
});
router.post('/prescriptions/:id/dispense', authenticate, authorize('pharmacy'), prescCtrl.dispensePrescription);
router.post('/prescriptions/:id/cancel', authenticate, authorize('doctor', 'admin'), async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE prescriptions SET status='cancelled' WHERE id=$1 AND status NOT IN ('dispensed','cancelled') RETURNING *`,
      [req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ success: false, message: 'Cannot cancel' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { res.status(500).json({ success: false, message: 'Failed' }); }
});

// ========================
// PHARMACIES ROUTES
// ========================
router.get('/pharmacies', async (req, res) => {
  try {
    const { district } = req.query;
    let query = `SELECT ph.id, ph.pharmacy_name, ph.address, ph.city, ph.district, ph.gps_lat, ph.gps_lng, ph.operating_hours
                 FROM pharmacies ph WHERE ph.approval_status='approved'`;
    const params = [];
    if (district) {
      params.push(district);
      query += ` AND LOWER(ph.district) = LOWER($1)`;
    }
    query += ` ORDER BY ph.pharmacy_name`;
    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (err) { res.status(500).json({ success: false, message: 'Failed' }); }
});

// ========================
// PATIENT ROUTES
// ========================
router.get('/patients/search', authenticate, authorize('doctor'), async (req, res) => {
  try {
    // Support: ?q=<anything>  OR  ?name=X&dob=Y&mobile=Z (field-specific)
    const { q, name, dob, mobile, nic: nicParam } = req.query;
    const baseSelect = `
      SELECT pa.id, u.full_name, u.nic, u.mobile, pa.date_of_birth, pa.gender,
             pa.blood_group, pa.allergies, pa.address, pa.city, pa.district,
             pa.preferred_pharmacy_id, ph.pharmacy_name as preferred_pharmacy
      FROM patients pa
      JOIN users u ON u.id = pa.user_id
      LEFT JOIN pharmacies ph ON ph.id = pa.preferred_pharmacy_id`;

    let rows = [];

    if (q) {
      // Smart single-box search: try exact NIC/mobile/email first, then name ILIKE
      const exact = await pool.query(
        `${baseSelect}
         WHERE UPPER(TRIM(u.nic)) = UPPER($1)
            OR TRIM(u.mobile) = $1
            OR u.email = LOWER($1)
         LIMIT 10`,
        [q.trim()]
      );
      if (exact.rows.length) {
        rows = exact.rows;
      } else {
        // Partial name search
        const like = await pool.query(
          `${baseSelect}
           WHERE u.full_name ILIKE $1
           ORDER BY u.full_name
           LIMIT 10`,
          [`%${q.trim()}%`]
        );
        rows = like.rows;
      }
    } else {
      // Field-specific search
      const conditions = [];
      const params = [];
      if (nicParam) { params.push(nicParam.trim()); conditions.push(`UPPER(TRIM(u.nic)) = UPPER($${params.length})`); }
      if (mobile)   { params.push(mobile.trim());   conditions.push(`TRIM(u.mobile) = $${params.length}`); }
      if (dob)      { params.push(dob.trim());       conditions.push(`pa.date_of_birth::date = $${params.length}::date`); }
      if (name)     { params.push(`%${name.trim()}%`); conditions.push(`u.full_name ILIKE $${params.length}`); }

      if (!conditions.length) {
        return res.status(400).json({ success: false, message: 'Provide at least one search field' });
      }
      const result = await pool.query(
        `${baseSelect} WHERE ${conditions.join(' AND ')} ORDER BY u.full_name LIMIT 20`,
        params
      );
      rows = result.rows;
    }

    if (!rows.length) return res.status(404).json({ success: false, message: 'No patient found' });

    // If exactly one result, return as single object (backwards-compatible)
    if (rows.length === 1) {
      return res.json({ success: true, data: rows[0], multiple: false });
    }
    // Multiple results
    return res.json({ success: true, data: rows[0], results: rows, multiple: true });
  } catch (err) {
    console.error('Patient search error:', err);
    res.status(500).json({ success: false, message: 'Search failed' });
  }
});

// Distinct medicines from the patient's non-cancelled, still-valid prescriptions —
// used by the doctor's new-prescription screen for interaction/allergy checks.
router.get('/patients/:patientId/active-medicines', authenticate, authorize('doctor'), async (req, res) => {
  try {
    const { patientId } = req.params;
    const result = await pool.query(
      `SELECT DISTINCT mi.medicine_name, mi.generic_name
       FROM medicine_items mi
       JOIN prescriptions p ON p.id = mi.prescription_id
       WHERE p.patient_id = $1 AND p.status != 'cancelled' AND p.valid_until >= CURRENT_DATE
       ORDER BY mi.medicine_name`,
      [patientId]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Active medicines fetch error:', err);
    res.status(500).json({ success: false, message: 'Failed to load active medicines' });
  }
});

// ========================
// PATIENT DOCUMENTS (X-ray, blood report, ECG) — doctor uploads, patient views.
// Pharmacy is intentionally NOT authorized on any of these routes.
// ========================
router.post('/patients/:patientId/documents', authenticate, authorize('doctor'), (req, res, next) => {
  documentCtrl.upload.single('file')(req, res, (err) => {
    if (err) return res.status(400).json({ success: false, message: err.message });
    next();
  });
}, documentCtrl.uploadPatientDocument);

router.get('/patients/me/documents', authenticate, authorize('patient'), documentCtrl.listMyDocuments);
router.get('/patients/:patientId/documents', authenticate, authorize('doctor', 'patient'), documentCtrl.listPatientDocuments);
router.get('/documents/:documentId/file', authenticate, authorize('doctor', 'patient'), documentCtrl.downloadDocument);

router.patch('/patients/preferred-pharmacy', authenticate, authorize('patient'), async (req, res) => {
  try {
    const { pharmacy_id } = req.body;
    await pool.query(
      'UPDATE patients SET preferred_pharmacy_id=$1 WHERE user_id=$2',
      [pharmacy_id, req.user.id]
    );
    res.json({ success: true, message: 'Preferred pharmacy updated' });
  } catch (err) { res.status(500).json({ success: false, message: 'Failed' }); }
});

// ========================
// MEDICINE REMINDER ROUTES
// ========================

// Frequency → dose slots mapping
function getDoseSlots(frequency) {
  const f = (frequency || '').toLowerCase();
  if (f.includes('four') || f.includes('4 times')) return ['Morning (8am)', 'Noon (12pm)', 'Evening (4pm)', 'Night (8pm)'];
  if (f.includes('three') || f.includes('3 times')) return ['Morning (8am)', 'Afternoon (2pm)', 'Night (8pm)'];
  if (f.includes('every 8')) return ['Morning (8am)', 'Afternoon (4pm)', 'Night (12am)'];
  if (f.includes('twice') || f.includes('2 times')) return ['Morning (8am)', 'Night (8pm)'];
  if (f.includes('as needed')) return ['As needed'];
  return ['Morning (8am)']; // once daily default
}

// GET /patient/medicines/today — all active medicine items with today's log
router.get('/patient/medicines/today', authenticate, authorize('patient'), async (req, res) => {
  try {
    const patientRes = await pool.query('SELECT id FROM patients WHERE user_id = $1', [req.user.id]);
    if (!patientRes.rows[0]) return res.status(404).json({ success: false, message: 'Patient not found' });
    const patientId = patientRes.rows[0].id;
    const today = new Date().toISOString().slice(0, 10);

    // Get all dispensed active prescriptions with their medicines
    const result = await pool.query(`
      SELECT mi.id as med_id, mi.medicine_name, mi.dosage, mi.frequency, mi.instructions,
             mi.duration, mi.stopped_at, mi.stop_reason, mi.stop_notes,
             p.id as prescription_id, p.prescription_code, p.diagnosis, p.valid_until,
             p.dispensed_at,
             u.full_name as doctor_name, d.specialisation,
             json_agg(json_build_object('slot', ml.dose_slot, 'taken_at', ml.taken_at))
               FILTER (WHERE ml.id IS NOT NULL AND ml.dose_date = $2::date) as taken_slots
      FROM prescriptions p
      JOIN medicine_items mi ON mi.prescription_id = p.id
      JOIN doctors d ON d.id = p.doctor_id
      JOIN users u ON u.id = d.user_id
      LEFT JOIN medicine_logs ml ON ml.medicine_item_id = mi.id AND ml.dose_date = $2::date
      WHERE p.patient_id = $1
        AND p.status = 'dispensed'
        AND p.valid_until >= NOW()
        AND mi.stopped_at IS NULL
      GROUP BY mi.id, p.id, u.full_name, d.specialisation
      ORDER BY p.dispensed_at DESC, mi.medicine_name
    `, [patientId, today]);

    // Build medicine schedule with slot status
    const medicines = result.rows.map(row => {
      const slots = getDoseSlots(row.frequency);
      const takenSlots = (row.taken_slots || []).map(s => s.slot);
      return {
        med_id: row.med_id,
        medicine_name: row.medicine_name,
        dosage: row.dosage,
        frequency: row.frequency,
        instructions: row.instructions,
        duration: row.duration,
        prescription_code: row.prescription_code,
        prescription_id: row.prescription_id,
        diagnosis: row.diagnosis,
        doctor_name: row.doctor_name,
        specialisation: row.specialisation,
        valid_until: row.valid_until,
        slots: slots.map(slot => ({
          slot,
          taken: takenSlots.includes(slot),
          taken_at: (row.taken_slots || []).find(s => s.slot === slot)?.taken_at || null,
        })),
        all_taken: slots.every(s => takenSlots.includes(s)),
        pending_count: slots.filter(s => !takenSlots.includes(s)).length,
      };
    });

    const totalPending = medicines.reduce((a, m) => a + m.pending_count, 0);

    // Auto-create portal reminder notification if not done today
    if (medicines.length > 0 && totalPending > 0) {
      const todayNotifCheck = await pool.query(
        `SELECT id FROM notifications WHERE user_id = $1 AND type = 'MEDICINE_REMINDER'
         AND DATE(created_at) = $2::date LIMIT 1`,
        [req.user.id, today]
      );
      if (!todayNotifCheck.rows.length) {
        const medNames = medicines.slice(0, 3).map(m => m.medicine_name).join(', ');
        await pool.query(
          `INSERT INTO notifications (user_id, type, title, message, is_read)
           VALUES ($1, 'MEDICINE_REMINDER', $2, $3, false)`,
          [req.user.id, '💊 Daily Medicine Reminder',
           `You have ${totalPending} dose${totalPending > 1 ? 's' : ''} to take today: ${medNames}${medicines.length > 3 ? ' and more' : ''}.`]
        );
      }
    }

    res.json({ success: true, data: { medicines, today, total_pending: totalPending } });
  } catch (err) {
    console.error('Today medicines error:', err);
    res.status(500).json({ success: false, message: 'Failed to load medicine schedule' });
  }
});

// POST /patient/medicines/:id/log — mark a dose as taken
router.post('/patient/medicines/:id/log', authenticate, authorize('patient'), async (req, res) => {
  try {
    const patientRes = await pool.query('SELECT id FROM patients WHERE user_id = $1', [req.user.id]);
    if (!patientRes.rows[0]) return res.status(404).json({ success: false, message: 'Patient not found' });
    const patientId = patientRes.rows[0].id;
    const { dose_slot } = req.body;
    const today = new Date().toISOString().slice(0, 10);

    await pool.query(
      `INSERT INTO medicine_logs (medicine_item_id, patient_id, dose_date, dose_slot)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (medicine_item_id, dose_date, dose_slot) DO NOTHING`,
      [req.params.id, patientId, today, dose_slot]
    );
    res.json({ success: true, message: 'Dose logged' });
  } catch (err) {
    console.error('Log dose error:', err);
    res.status(500).json({ success: false, message: 'Failed to log dose' });
  }
});

// DELETE /patient/medicines/:id/log/:slot — undo a taken dose
router.delete('/patient/medicines/:id/log', authenticate, authorize('patient'), async (req, res) => {
  try {
    const { dose_slot } = req.body;
    const today = new Date().toISOString().slice(0, 10);
    await pool.query(
      `DELETE FROM medicine_logs WHERE medicine_item_id = $1 AND dose_date = $2 AND dose_slot = $3`,
      [req.params.id, today, dose_slot]
    );
    res.json({ success: true, message: 'Dose unmarked' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed' });
  }
});

// POST /patient/medicines/:id/stop — patient stops a medicine
router.post('/patient/medicines/:id/stop', authenticate, authorize('patient'), async (req, res) => {
  try {
    const { stop_reason, stop_notes } = req.body;
    if (!stop_reason) return res.status(400).json({ success: false, message: 'Stop reason required' });

    // Verify the medicine belongs to this patient
    const check = await pool.query(
      `SELECT mi.id FROM medicine_items mi
       JOIN prescriptions p ON p.id = mi.prescription_id
       JOIN patients pa ON pa.id = p.patient_id
       WHERE mi.id = $1 AND pa.user_id = $2`,
      [req.params.id, req.user.id]
    );
    if (!check.rows[0]) return res.status(403).json({ success: false, message: 'Not authorised' });

    await pool.query(
      `UPDATE medicine_items SET stopped_at = NOW(), stop_reason = $1, stop_notes = $2 WHERE id = $3`,
      [stop_reason, stop_notes || null, req.params.id]
    );

    // Create notification about stopped medicine
    const med = await pool.query('SELECT medicine_name FROM medicine_items WHERE id = $1', [req.params.id]);
    await pool.query(
      `INSERT INTO notifications (user_id, type, title, message, is_read)
       VALUES ($1, 'MEDICINE_STOPPED', $2, $3, false)`,
      [req.user.id, `Medicine Stopped`,
       `You stopped ${med.rows[0]?.medicine_name}. Reason: ${stop_reason}. Your doctor's record has been updated.`]
    );

    res.json({ success: true, message: 'Medicine stopped successfully' });
  } catch (err) {
    console.error('Stop medicine error:', err);
    res.status(500).json({ success: false, message: 'Failed to stop medicine' });
  }
});

// GET /patient/medicines/stopped — all stopped medicines
router.get('/patient/medicines/stopped', authenticate, authorize('patient'), async (req, res) => {
  try {
    const patientRes = await pool.query('SELECT id FROM patients WHERE user_id = $1', [req.user.id]);
    if (!patientRes.rows[0]) return res.status(404).json({ success: false });
    const patientId = patientRes.rows[0].id;

    const result = await pool.query(`
      SELECT mi.id, mi.medicine_name, mi.dosage, mi.frequency, mi.stopped_at, mi.stop_reason, mi.stop_notes,
             p.prescription_code, p.diagnosis, u.full_name as doctor_name
      FROM medicine_items mi
      JOIN prescriptions p ON p.id = mi.prescription_id
      JOIN doctors d ON d.id = p.doctor_id
      JOIN users u ON u.id = d.user_id
      WHERE p.patient_id = $1 AND mi.stopped_at IS NOT NULL
      ORDER BY mi.stopped_at DESC
    `, [patientId]);

    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed' });
  }
});

// ========================
// NOTIFICATIONS ROUTES
// ========================
router.get('/notifications', authenticate, async (req, res) => {
  const data = await getNotifications(req.user.id);
  res.json({ success: true, data });
});
router.patch('/notifications/:id/read', authenticate, async (req, res) => {
  await markRead(req.params.id, req.user.id);
  res.json({ success: true });
});

// ========================
// PROFILE ROUTES
// ========================

// GET doctor profile
router.get('/profile/doctor', authenticate, authorize('doctor'), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.full_name, u.email, u.mobile, u.nic,
              d.slmc_number, d.specialisation, d.qualification, d.clinic_name,
              d.clinic_address, d.clinic_phone, d.experience_years, d.about
       FROM doctors d JOIN users u ON u.id = d.user_id
       WHERE d.user_id = $1`,
      [req.user.id]
    );
    if (!result.rows[0]) return res.status(404).json({ success: false, message: 'Profile not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { res.status(500).json({ success: false, message: 'Failed' }); }
});

// PATCH doctor profile (safe fields only — cannot change NIC or SLMC)
router.patch('/profile/doctor', authenticate, authorize('doctor'), async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { full_name, email, mobile, specialisation, qualification,
            clinic_name, clinic_address, clinic_phone, experience_years, about } = req.body;

    // Update users table
    await client.query(
      `UPDATE users SET full_name=$1, email=$2, mobile=$3 WHERE id=$4`,
      [full_name, email, mobile, req.user.id]
    );
    // Update doctors table
    await client.query(
      `UPDATE doctors SET specialisation=$1, qualification=$2, clinic_name=$3,
              clinic_address=$4, clinic_phone=$5, experience_years=$6, about=$7
       WHERE user_id=$8`,
      [specialisation, qualification, clinic_name, clinic_address, clinic_phone,
       experience_years || null, about, req.user.id]
    );
    await client.query('COMMIT');
    res.json({ success: true, message: 'Profile updated successfully' });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ success: false, message: 'Failed to update profile' });
  } finally { client.release(); }
});

// GET pharmacy profile
router.get('/profile/pharmacy', authenticate, authorize('pharmacy'), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.full_name, u.email, u.mobile, u.nic,
              ph.pharmacy_name, ph.licence_number, ph.address, ph.city, ph.district,
              ph.phone, ph.operating_hours, ph.gps_lat, ph.gps_lng
       FROM pharmacies ph JOIN users u ON u.id = ph.user_id
       WHERE ph.user_id = $1`,
      [req.user.id]
    );
    if (!result.rows[0]) return res.status(404).json({ success: false, message: 'Profile not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { res.status(500).json({ success: false, message: 'Failed' }); }
});

// PATCH pharmacy profile (cannot change licence_number)
router.patch('/profile/pharmacy', authenticate, authorize('pharmacy'), async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { full_name, email, mobile, pharmacy_name, address, city, district, phone, operating_hours } = req.body;

    await client.query(
      `UPDATE users SET full_name=$1, email=$2, mobile=$3 WHERE id=$4`,
      [full_name, email, mobile, req.user.id]
    );
    await client.query(
      `UPDATE pharmacies SET pharmacy_name=$1, address=$2, city=$3, district=$4, phone=$5, operating_hours=$6
       WHERE user_id=$7`,
      [pharmacy_name, address, city, district, phone, operating_hours, req.user.id]
    );
    await client.query('COMMIT');
    res.json({ success: true, message: 'Profile updated successfully' });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ success: false, message: 'Failed to update profile' });
  } finally { client.release(); }
});

// ========================
// ADMIN ROUTES
// ========================
router.get('/admin/dashboard', authenticate, authorize('admin'), adminCtrl.getDashboard);
router.get('/admin/pending-approvals', authenticate, authorize('admin'), adminCtrl.getPendingApprovals);
router.post('/admin/approve/:userId', authenticate, authorize('admin'), adminCtrl.approveUser);
router.get('/admin/audit-logs', authenticate, authorize('admin'), adminCtrl.getAuditLogs);
router.get('/admin/reports', authenticate, authorize('admin'), adminCtrl.getReports);
router.get('/admin/users', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { role, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;
    const where = role ? `WHERE u.role = '${role}'` : '';
    const result = await pool.query(
      `SELECT u.id, u.full_name, u.email, u.mobile, u.nic, u.role, u.is_active, u.created_at, u.last_login
       FROM users u ${where} ORDER BY u.created_at DESC LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) { res.status(500).json({ success: false, message: 'Failed' }); }
});

module.exports = router;

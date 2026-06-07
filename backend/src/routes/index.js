const express = require('express');
const router = express.Router();

const { authenticate, authorize } = require('../middleware/auth');
const authCtrl = require('../controllers/authController');
const prescCtrl = require('../controllers/prescriptionController');
const adminCtrl = require('../controllers/adminController');
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
    const { nic } = req.query;
    const q = (nic || '').trim();
    if (!q) return res.status(400).json({ success: false, message: 'Search query required' });

    const result = await pool.query(
      `SELECT pa.id, u.full_name, u.nic, u.mobile, pa.date_of_birth, pa.gender, pa.blood_group, pa.allergies,
        pa.address, pa.city, pa.district,
        pa.preferred_pharmacy_id,
        ph.pharmacy_name as preferred_pharmacy
       FROM patients pa JOIN users u ON u.id=pa.user_id
       LEFT JOIN pharmacies ph ON ph.id=pa.preferred_pharmacy_id
       WHERE UPPER(TRIM(u.nic)) = UPPER($1)
          OR TRIM(u.mobile) = $1
          OR u.email = $1`,
      [q]
    );
    if (!result.rows[0]) return res.status(404).json({ success: false, message: 'Patient not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { res.status(500).json({ success: false, message: 'Failed' }); }
});

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

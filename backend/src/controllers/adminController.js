const pool = require('../config/database');
const { auditLog } = require('../utils/audit');
const { sendNotification } = require('../utils/notifications');

// GET /api/admin/dashboard
const getDashboard = async (req, res) => {
  try {
    const [users, prescriptions, pending] = await Promise.all([
      pool.query(`SELECT 
        COUNT(*) FILTER (WHERE role='doctor') as doctors,
        COUNT(*) FILTER (WHERE role='pharmacy') as pharmacies,
        COUNT(*) FILTER (WHERE role='patient') as patients
        FROM users WHERE is_active=true`),
      pool.query(`SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status='dispensed') as dispensed,
        COUNT(*) FILTER (WHERE status='created' OR status='sent') as active,
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as this_week
        FROM prescriptions`),
      pool.query(`SELECT 
        COUNT(*) FILTER (WHERE role='doctor' AND is_active=false) as pending_doctors,
        COUNT(*) FILTER (WHERE role='pharmacy' AND is_active=false) as pending_pharmacies
        FROM users`)
    ]);

    res.json({
      success: true,
      data: {
        users: users.rows[0],
        prescriptions: prescriptions.rows[0],
        pending: pending.rows[0]
      }
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ success: false, message: 'Failed to load dashboard' });
  }
};

// GET /api/admin/pending-approvals
const getPendingApprovals = async (req, res) => {
  try {
    const doctors = await pool.query(
      `SELECT u.id, u.full_name, u.email, u.mobile, u.nic, u.created_at,
        d.id as profile_id, d.slmc_number, d.specialisation, d.clinic_name, d.qualification, d.licence_status
       FROM users u JOIN doctors d ON d.user_id = u.id
       WHERE u.is_active = false AND u.role = 'doctor'
       ORDER BY u.created_at DESC`
    );
    const pharmacies = await pool.query(
      `SELECT u.id, u.full_name, u.email, u.mobile, u.nic, u.created_at,
        ph.id as profile_id, ph.licence_number, ph.pharmacy_name, ph.address, ph.city, ph.approval_status
       FROM users u JOIN pharmacies ph ON ph.user_id = u.id
       WHERE u.is_active = false AND u.role = 'pharmacy'
       ORDER BY u.created_at DESC`
    );
    res.json({ success: true, data: { doctors: doctors.rows, pharmacies: pharmacies.rows } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch pending approvals' });
  }
};

// POST /api/admin/approve/:userId
const approveUser = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { userId } = req.params;
    const { action } = req.body; // 'approve' or 'reject'

    const userResult = await client.query('SELECT * FROM users WHERE id = $1', [userId]);
    if (!userResult.rows[0]) return res.status(404).json({ success: false, message: 'User not found' });
    const user = userResult.rows[0];

    if (action === 'approve') {
      await client.query('UPDATE users SET is_active=true, is_verified=true WHERE id=$1', [userId]);

      if (user.role === 'doctor') {
        await client.query(
          'UPDATE doctors SET licence_status=$1, approved_by=$2, approved_at=NOW() WHERE user_id=$3',
          ['active', req.user.id, userId]
        );
      } else if (user.role === 'pharmacy') {
        await client.query(
          'UPDATE pharmacies SET approval_status=$1, approved_by=$2, approved_at=NOW() WHERE user_id=$3',
          ['approved', req.user.id, userId]
        );
      }

      await sendNotification(userId, {
        type: 'ACCOUNT_APPROVED',
        title: 'Account Approved',
        message: `Your ${user.role} account has been approved. You can now log in.`,
        reference_type: 'users',
        reference_id: userId
      });
    } else {
      await client.query('DELETE FROM users WHERE id=$1', [userId]);
    }

    await client.query('COMMIT');
    await auditLog(req.user.id, `${action.toUpperCase()}_USER`, 'users', userId, null, null, req.ip);

    res.json({ success: true, message: `User ${action}d successfully` });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Approve user error:', err);
    res.status(500).json({ success: false, message: 'Action failed' });
  } finally {
    client.release();
  }
};

// GET /api/admin/audit-logs
const getAuditLogs = async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;
    const result = await pool.query(
      `SELECT al.*, u.full_name, u.role FROM audit_logs al
       LEFT JOIN users u ON u.id = al.user_id
       ORDER BY al.created_at DESC LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch audit logs' });
  }
};

// GET /api/admin/reports
const getReports = async (req, res) => {
  try {
    const { from, to } = req.query;
    const fromDate = from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const toDate = to || new Date().toISOString();

    const [prescByStatus, topDoctors, topPharmacies, dailyStats] = await Promise.all([
      pool.query(
        `SELECT status, COUNT(*) FROM prescriptions WHERE created_at BETWEEN $1 AND $2 GROUP BY status`,
        [fromDate, toDate]
      ),
      pool.query(
        `SELECT u.full_name, d.slmc_number, COUNT(p.id) as prescriptions_count
         FROM doctors d JOIN users u ON u.id=d.user_id
         LEFT JOIN prescriptions p ON p.doctor_id=d.id AND p.created_at BETWEEN $1 AND $2
         GROUP BY u.full_name, d.slmc_number ORDER BY prescriptions_count DESC LIMIT 10`,
        [fromDate, toDate]
      ),
      pool.query(
        `SELECT ph.pharmacy_name, COUNT(p.id) as dispensed_count
         FROM pharmacies ph
         LEFT JOIN prescriptions p ON p.pharmacy_id=ph.id AND p.status='dispensed' AND p.dispensed_at BETWEEN $1 AND $2
         GROUP BY ph.pharmacy_name ORDER BY dispensed_count DESC LIMIT 10`,
        [fromDate, toDate]
      ),
      pool.query(
        `SELECT DATE(created_at) as date, COUNT(*) as created,
          COUNT(*) FILTER (WHERE status='dispensed') as dispensed
         FROM prescriptions WHERE created_at BETWEEN $1 AND $2
         GROUP BY DATE(created_at) ORDER BY date`,
        [fromDate, toDate]
      )
    ]);

    res.json({
      success: true,
      data: {
        prescriptionsByStatus: prescByStatus.rows,
        topDoctors: topDoctors.rows,
        topPharmacies: topPharmacies.rows,
        dailyStats: dailyStats.rows
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to generate report' });
  }
};

module.exports = { getDashboard, getPendingApprovals, approveUser, getAuditLogs, getReports };

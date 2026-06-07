const { v4: uuidv4 } = require('uuid');
const QRCode = require('qrcode');
const crypto = require('crypto');
const pool = require('../config/database');
const { auditLog } = require('../utils/audit');
const { sendNotification } = require('../utils/notifications');

const generatePrescriptionCode = () => {
  const prefix = 'RX';
  const date = new Date().toISOString().slice(2, 10).replace(/-/g, '');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${prefix}${date}${random}`;
};

// POST /api/prescriptions - doctor creates prescription
const createPrescription = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { patient_nic, pharmacy_id, diagnosis, notes, valid_days = 30, medicines } = req.body;

    // Get doctor profile
    const doctorResult = await client.query(
      'SELECT d.id FROM doctors d WHERE d.user_id = $1 AND d.licence_status = $2',
      [req.user.id, 'active']
    );
    if (!doctorResult.rows[0]) {
      return res.status(403).json({ success: false, message: 'Doctor licence not active' });
    }
    const doctor = doctorResult.rows[0];

    // Get patient — case-insensitive NIC, also accept mobile
    const patientResult = await client.query(
      `SELECT pa.id, u.full_name, u.mobile, u.email FROM patients pa JOIN users u ON u.id = pa.user_id
       WHERE UPPER(TRIM(u.nic)) = UPPER(TRIM($1)) OR TRIM(u.mobile) = TRIM($1)`,
      [patient_nic]
    );
    if (!patientResult.rows[0]) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }
    const patient = patientResult.rows[0];

    const code = generatePrescriptionCode();
    const validUntil = new Date(Date.now() + valid_days * 24 * 60 * 60 * 1000);
    const signature = crypto.createHmac('sha256', process.env.JWT_SECRET)
      .update(`${code}:${doctor.id}:${patient.id}`)
      .digest('hex');

    // Generate QR code
    const qrData = JSON.stringify({
      code,
      doctor_id: doctor.id,
      patient_id: patient.id,
      created_at: new Date().toISOString(),
      verify_url: `${process.env.APP_BASE_URL}/verify/${code}`
    });
    const qrCode = await QRCode.toDataURL(qrData);

    const prescResult = await client.query(
      `INSERT INTO prescriptions 
       (prescription_code, doctor_id, patient_id, pharmacy_id, qr_code, digital_signature, diagnosis, notes, status, valid_until)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'created',$9) RETURNING *`,
      [code, doctor.id, patient.id, pharmacy_id || null, qrCode, signature, diagnosis, notes, validUntil]
    );
    const prescription = prescResult.rows[0];

    // Insert medicines
    if (medicines && medicines.length > 0) {
      for (const med of medicines) {
        await client.query(
          `INSERT INTO medicine_items (prescription_id, medicine_name, generic_name, dosage, quantity, frequency, duration, instructions)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
          [prescription.id, med.medicine_name, med.generic_name || null, med.dosage, med.quantity,
           med.frequency || null, med.duration || null, med.instructions || null]
        );
      }
    }

    await client.query('COMMIT');
    await auditLog(req.user.id, 'CREATE_PRESCRIPTION', 'prescriptions', prescription.id, null, { code }, req.ip);

    // Notify patient
    await sendNotification(patient.id, {
      type: 'PRESCRIPTION_CREATED',
      title: 'New Prescription',
      message: `A prescription (${code}) has been created for you.`,
      reference_id: prescription.id,
      reference_type: 'prescriptions'
    });

    res.status(201).json({
      success: true,
      message: 'Prescription created successfully',
      data: { prescription: { ...prescription, medicines } }
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Create prescription error:', err);
    res.status(500).json({ success: false, message: 'Failed to create prescription' });
  } finally {
    client.release();
  }
};

// POST /api/prescriptions/:id/send - send to pharmacy
const sendPrescription = async (req, res) => {
  try {
    const { id } = req.params;
    const { pharmacy_id } = req.body;

    const doctorResult = await pool.query('SELECT id FROM doctors WHERE user_id = $1', [req.user.id]);
    if (!doctorResult.rows[0]) return res.status(403).json({ success: false, message: 'Not a doctor' });

    const result = await pool.query(
      `UPDATE prescriptions SET status='sent', pharmacy_id=$1, sent_at=NOW()
       WHERE id=$2 AND doctor_id=$3 AND status='created' RETURNING *`,
      [pharmacy_id, id, doctorResult.rows[0].id]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ success: false, message: 'Prescription not found or already sent' });
    }

    // Notify pharmacy
    const pharmacyUser = await pool.query(
      'SELECT ph.user_id FROM pharmacies ph WHERE ph.id = $1', [pharmacy_id]
    );
    if (pharmacyUser.rows[0]) {
      await sendNotification(pharmacyUser.rows[0].user_id, {
        type: 'PRESCRIPTION_RECEIVED',
        title: 'New Prescription',
        message: `Prescription ${result.rows[0].prescription_code} received and ready for dispensing.`,
        reference_id: id,
        reference_type: 'prescriptions'
      });
    }

    res.json({ success: true, message: 'Prescription sent to pharmacy', data: result.rows[0] });
  } catch (err) {
    console.error('Send prescription error:', err);
    res.status(500).json({ success: false, message: 'Failed to send prescription' });
  }
};

// POST /api/prescriptions/:id/dispense - pharmacy dispenses
const dispensePrescription = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { id } = req.params;
    const { dispensing_notes } = req.body;

    const pharmacyResult = await client.query(
      'SELECT ph.id FROM pharmacies ph WHERE ph.user_id = $1 AND ph.approval_status = $2',
      [req.user.id, 'approved']
    );
    if (!pharmacyResult.rows[0]) {
      return res.status(403).json({ success: false, message: 'Pharmacy not approved' });
    }

    const prescResult = await client.query(
      `UPDATE prescriptions SET status='dispensed', dispensed_at=NOW(), dispensed_by=$1
       WHERE id=$2 AND pharmacy_id=$3 AND status IN ('sent','received')
       RETURNING *, (SELECT patient_id FROM prescriptions WHERE id=$2) as pid`,
      [req.user.id, id, pharmacyResult.rows[0].id]
    );

    if (!prescResult.rows[0]) {
      return res.status(404).json({ success: false, message: 'Prescription not found or cannot be dispensed' });
    }

    await client.query(
      'UPDATE medicine_items SET is_dispensed=true WHERE prescription_id=$1', [id]
    );

    const prescription = prescResult.rows[0];

    // Notify patient
    const patientUser = await client.query(
      'SELECT pa.user_id FROM patients pa WHERE pa.id = $1', [prescription.patient_id]
    );
    if (patientUser.rows[0]) {
      await sendNotification(patientUser.rows[0].user_id, {
        type: 'PRESCRIPTION_DISPENSED',
        title: 'Prescription Dispensed',
        message: `Your prescription ${prescription.prescription_code} has been dispensed. Please collect your medicines.`,
        reference_id: id,
        reference_type: 'prescriptions'
      });
    }

    await client.query('COMMIT');
    await auditLog(req.user.id, 'DISPENSE_PRESCRIPTION', 'prescriptions', id, null, null, req.ip);

    res.json({ success: true, message: 'Prescription dispensed successfully', data: prescription });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Dispense error:', err);
    res.status(500).json({ success: false, message: 'Failed to dispense prescription' });
  } finally {
    client.release();
  }
};

// GET /api/prescriptions - list with role-based filtering
const getPrescriptions = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    let whereClause = '';
    let params = [];

    if (req.user.role === 'doctor') {
      const doc = await pool.query('SELECT id FROM doctors WHERE user_id = $1', [req.user.id]);
      if (!doc.rows[0]) return res.json({ success: true, data: { prescriptions: [], total: 0 } });
      whereClause = 'WHERE p.doctor_id = $1';
      params = [doc.rows[0].id];
    } else if (req.user.role === 'pharmacy') {
      const ph = await pool.query('SELECT id FROM pharmacies WHERE user_id = $1', [req.user.id]);
      if (!ph.rows[0]) return res.json({ success: true, data: { prescriptions: [], total: 0 } });
      whereClause = `WHERE p.pharmacy_id = $1 AND p.status IN ('sent','received','dispensed')`;
      params = [ph.rows[0].id];
    } else if (req.user.role === 'patient') {
      const pat = await pool.query('SELECT id FROM patients WHERE user_id = $1', [req.user.id]);
      if (!pat.rows[0]) return res.json({ success: true, data: { prescriptions: [], total: 0 } });
      whereClause = 'WHERE p.patient_id = $1';
      params = [pat.rows[0].id];
    }

    if (status) {
      whereClause += (whereClause ? ' AND' : 'WHERE') + ` p.status = $${params.length + 1}`;
      params.push(status);
    }

    const query = `
      SELECT p.*, 
        u_doc.full_name as doctor_name, d.slmc_number, d.specialisation,
        u_pat.full_name as patient_name, u_pat.nic as patient_nic,
        ph.pharmacy_name,
        json_agg(json_build_object(
          'id', mi.id, 'medicine_name', mi.medicine_name,
          'dosage', mi.dosage, 'quantity', mi.quantity,
          'frequency', mi.frequency, 'instructions', mi.instructions
        )) FILTER (WHERE mi.id IS NOT NULL) as medicines
      FROM prescriptions p
      LEFT JOIN doctors d ON d.id = p.doctor_id
      LEFT JOIN users u_doc ON u_doc.id = d.user_id
      LEFT JOIN patients pa ON pa.id = p.patient_id
      LEFT JOIN users u_pat ON u_pat.id = pa.user_id
      LEFT JOIN pharmacies ph ON ph.id = p.pharmacy_id
      LEFT JOIN medicine_items mi ON mi.prescription_id = p.id
      ${whereClause}
      GROUP BY p.id, u_doc.full_name, d.slmc_number, d.specialisation, u_pat.full_name, u_pat.nic, ph.pharmacy_name
      ORDER BY p.created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;

    const countQuery = `SELECT COUNT(*) FROM prescriptions p ${whereClause}`;

    const [prescriptions, countResult] = await Promise.all([
      pool.query(query, [...params, limit, offset]),
      pool.query(countQuery, params)
    ]);

    res.json({
      success: true,
      data: {
        prescriptions: prescriptions.rows,
        total: parseInt(countResult.rows[0].count),
        page: parseInt(page),
        pages: Math.ceil(countResult.rows[0].count / limit)
      }
    });
  } catch (err) {
    console.error('Get prescriptions error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch prescriptions' });
  }
};

// GET /api/prescriptions/:id
const getPrescriptionById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT p.*,
        u_doc.full_name as doctor_name, d.slmc_number, d.specialisation, d.clinic_name,
        u_pat.full_name as patient_name, u_pat.nic as patient_nic, u_pat.mobile as patient_mobile,
        pa.district as patient_district, pa.city as patient_city, pa.address as patient_address,
        pa.preferred_pharmacy_id,
        ph.pharmacy_name, ph.address as pharmacy_address, ph.operating_hours as pharmacy_phone,
        json_agg(json_build_object(
          'id', mi.id, 'medicine_name', mi.medicine_name, 'generic_name', mi.generic_name,
          'dosage', mi.dosage, 'quantity', mi.quantity, 'frequency', mi.frequency,
          'duration', mi.duration, 'instructions', mi.instructions, 'is_dispensed', mi.is_dispensed
        )) FILTER (WHERE mi.id IS NOT NULL) as medicines
       FROM prescriptions p
       LEFT JOIN doctors d ON d.id = p.doctor_id
       LEFT JOIN users u_doc ON u_doc.id = d.user_id
       LEFT JOIN patients pa ON pa.id = p.patient_id
       LEFT JOIN users u_pat ON u_pat.id = pa.user_id
       LEFT JOIN pharmacies ph ON ph.id = p.pharmacy_id
       LEFT JOIN medicine_items mi ON mi.prescription_id = p.id
       WHERE p.id = $1
       GROUP BY p.id, u_doc.full_name, d.slmc_number, d.specialisation, d.clinic_name,
                u_pat.full_name, u_pat.nic, u_pat.mobile,
                pa.district, pa.city, pa.address, pa.preferred_pharmacy_id,
                ph.pharmacy_name, ph.address, ph.operating_hours`,
      [id]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ success: false, message: 'Prescription not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('Get prescription error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch prescription' });
  }
};

// GET /api/prescriptions/verify/:code - public QR verification
const verifyPrescription = async (req, res) => {
  try {
    const { code } = req.params;
    const result = await pool.query(
      `SELECT p.prescription_code, p.status, p.valid_until, p.created_at,
        u_doc.full_name as doctor_name, d.slmc_number,
        u_pat.full_name as patient_name
       FROM prescriptions p
       JOIN doctors d ON d.id = p.doctor_id
       JOIN users u_doc ON u_doc.id = d.user_id
       JOIN patients pa ON pa.id = p.patient_id
       JOIN users u_pat ON u_pat.id = pa.user_id
       WHERE p.prescription_code = $1`,
      [code]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ success: false, message: 'Prescription not found', valid: false });
    }

    const presc = result.rows[0];
    const isExpired = new Date(presc.valid_until) < new Date();

    res.json({
      success: true,
      data: {
        valid: !isExpired && presc.status !== 'cancelled',
        prescription_code: presc.prescription_code,
        status: isExpired ? 'expired' : presc.status,
        doctor_name: presc.doctor_name,
        slmc_number: presc.slmc_number,
        patient_name: presc.patient_name,
        valid_until: presc.valid_until
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Verification failed' });
  }
};

module.exports = { createPrescription, sendPrescription, dispensePrescription, getPrescriptions, getPrescriptionById, verifyPrescription };

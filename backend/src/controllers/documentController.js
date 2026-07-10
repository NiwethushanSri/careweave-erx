const fs = require('fs');
const path = require('path');
const multer = require('multer');
const pool = require('../config/database');
const { sendNotification } = require('../utils/notifications');

const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads', 'patient-documents');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const ALLOWED_TYPES = { 'application/pdf': 'pdf', 'image/jpeg': 'jpg', 'image/jpg': 'jpg', 'image/png': 'png' };

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = ALLOWED_TYPES[file.mimetype] || 'bin';
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}.${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_TYPES[file.mimetype]) return cb(new Error('Only PDF, JPG, or PNG files are allowed'));
    cb(null, true);
  },
});

// POST /api/patients/:patientId/documents  (doctor only)
const uploadPatientDocument = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
    const { patientId } = req.params;
    const { document_type, notes } = req.body;

    if (!['xray', 'blood_report', 'ecg', 'other'].includes(document_type)) {
      fs.unlink(req.file.path, () => {});
      return res.status(400).json({ success: false, message: 'Invalid document type' });
    }

    const patientCheck = await pool.query(
      'SELECT pa.id, u.id as user_id, u.full_name FROM patients pa JOIN users u ON u.id = pa.user_id WHERE pa.id = $1',
      [patientId]
    );
    if (!patientCheck.rows[0]) {
      fs.unlink(req.file.path, () => {});
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    const fileType = ALLOWED_TYPES[req.file.mimetype];
    const result = await pool.query(
      `INSERT INTO patient_documents (patient_id, uploaded_by, document_type, file_name, file_path, file_type, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id, document_type, file_name, file_type, notes, created_at`,
      [patientId, req.user.id, document_type, req.file.originalname, req.file.filename, fileType, notes || null]
    );

    const labels = { xray: 'X-Ray', blood_report: 'Blood Report', ecg: 'ECG Report', other: 'Medical Document' };
    await sendNotification(patientCheck.rows[0].user_id, {
      type: 'DOCUMENT_UPLOADED',
      title: 'New medical document',
      message: `Dr. ${req.user.full_name} uploaded a ${labels[document_type]} to your records.`,
      reference_id: result.rows[0].id,
      reference_type: 'patient_documents',
    });

    res.status(201).json({ success: true, message: 'Document uploaded', data: result.rows[0] });
  } catch (err) {
    if (req.file) fs.unlink(req.file.path, () => {});
    console.error('Document upload error:', err);
    res.status(500).json({ success: false, message: 'Upload failed' });
  }
};

// Shared: resolve the requesting user's own patients.id (only relevant for role='patient')
const resolveOwnPatientId = async (userId) => {
  const result = await pool.query('SELECT id FROM patients WHERE user_id = $1', [userId]);
  return result.rows[0]?.id || null;
};

// GET /api/patients/:patientId/documents  (doctor: any patient; patient: only their own)
const listPatientDocuments = async (req, res) => {
  try {
    const { patientId } = req.params;

    if (req.user.role === 'patient') {
      const ownId = await resolveOwnPatientId(req.user.id);
      if (ownId !== patientId) return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const result = await pool.query(
      `SELECT pd.id, pd.document_type, pd.file_name, pd.file_type, pd.notes, pd.created_at, u.full_name as uploaded_by_name
       FROM patient_documents pd
       JOIN users u ON u.id = pd.uploaded_by
       WHERE pd.patient_id = $1
       ORDER BY pd.created_at DESC`,
      [patientId]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('List documents error:', err);
    res.status(500).json({ success: false, message: 'Failed to load documents' });
  }
};

// GET /api/patients/me/documents  (patient — convenience, resolves own patient id)
const listMyDocuments = async (req, res) => {
  req.params.patientId = await resolveOwnPatientId(req.user.id);
  if (!req.params.patientId) return res.status(404).json({ success: false, message: 'Patient profile not found' });
  return listPatientDocuments(req, res);
};

// GET /api/documents/:documentId/file  (doctor: any; patient: only their own; pharmacy: forbidden by route middleware)
const downloadDocument = async (req, res) => {
  try {
    const { documentId } = req.params;
    const result = await pool.query('SELECT * FROM patient_documents WHERE id = $1', [documentId]);
    const doc = result.rows[0];
    if (!doc) return res.status(404).json({ success: false, message: 'Document not found' });

    if (req.user.role === 'patient') {
      const ownId = await resolveOwnPatientId(req.user.id);
      if (ownId !== doc.patient_id) return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const filePath = path.join(UPLOAD_DIR, doc.file_path);
    if (!fs.existsSync(filePath)) return res.status(404).json({ success: false, message: 'File not found on server' });

    res.setHeader('Content-Disposition', `inline; filename="${doc.file_name}"`);
    res.sendFile(filePath);
  } catch (err) {
    console.error('Document download error:', err);
    res.status(500).json({ success: false, message: 'Failed to load file' });
  }
};

module.exports = { upload, uploadPatientDocument, listPatientDocuments, listMyDocuments, downloadDocument };

const pool = require('../config/database');

const auditLog = async (userId, action, entityType, entityId, oldData, newData, ipAddress) => {
  try {
    await pool.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_data, new_data, ip_address)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [
        userId || null,
        action,
        entityType || null,
        entityId || null,
        oldData ? JSON.stringify(oldData) : null,
        newData ? JSON.stringify(newData) : null,
        ipAddress || null
      ]
    );
  } catch (err) {
    console.error('Audit log error:', err.message);
  }
};

module.exports = { auditLog };

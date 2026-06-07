const pool = require('../config/database');

const sendNotification = async (userId, { type, title, message, reference_id, reference_type }) => {
  try {
    await pool.query(
      `INSERT INTO notifications (user_id, type, title, message, reference_id, reference_type)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [userId, type, title, message, reference_id || null, reference_type || null]
    );
    // TODO: Add SMS via Twilio / Dialog, email via Nodemailer, WhatsApp via Twilio API
    // These are hooked in here when you add credentials to .env
  } catch (err) {
    console.error('Notification error:', err.message);
  }
};

const getNotifications = async (userId, limit = 20) => {
  const result = await pool.query(
    `SELECT * FROM notifications WHERE user_id=$1 ORDER BY created_at DESC LIMIT $2`,
    [userId, limit]
  );
  return result.rows;
};

const markRead = async (notificationId, userId) => {
  await pool.query(
    'UPDATE notifications SET is_read=true WHERE id=$1 AND user_id=$2',
    [notificationId, userId]
  );
};

module.exports = { sendNotification, getNotifications, markRead };

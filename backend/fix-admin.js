require('dotenv').config();
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
const pool = new Pool({ host: 'localhost', port: 5432, database: 'rxsystem_sl', user: 'postgres', password: 'Mathushan@96' });
bcrypt.hash('admin123', 10).then(hash => {
  return pool.query('UPDATE users SET password_hash=$1 WHERE nic=$2', [hash, '199512345678']);
}).then(() => {
  console.log('Admin password reset to admin123!');
  process.exit();
}).catch(e => { console.error(e.message); process.exit(1); });

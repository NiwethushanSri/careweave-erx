# RxSystem SL — Digital Prescription Platform

## Architecture
- **Backend**: Node.js + Express.js REST API
- **Frontend**: React + Vite + Tailwind CSS
- **Database**: PostgreSQL

---

## Quick Start (Development)

### 1. Database Setup
```bash
psql -U postgres
CREATE DATABASE rxsystem_sl;
\q
```

### 2. Backend Setup
```bash
cd backend
cp .env.example .env
# Edit .env with your DB credentials and secrets

npm install
npm run migrate    # creates all tables
npm run dev        # starts on port 5000
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev        # starts on port 3000
```

### 4. Create First Admin User
Run this SQL once:
```sql
INSERT INTO users (nic, full_name, email, mobile, role, password_hash, is_active, is_verified)
VALUES (
  '199512345678',
  'System Admin',
  'admin@rxsystem.lk',
  '0771234567',
  'admin',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQyCgJQQHt.6c0Cj.s7xVRWCC', -- password: admin123
  true,
  true
);
```
Change password after first login!

---

## Production Deployment (Ubuntu VPS)

### Install dependencies
```bash
sudo apt update
sudo apt install nodejs npm postgresql nginx
npm install -g pm2
```

### PostgreSQL
```bash
sudo -u postgres createdb rxsystem_sl
sudo -u postgres psql -c "CREATE USER rxuser WITH PASSWORD 'strongpassword';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE rxsystem_sl TO rxuser;"
```

### Backend (PM2)
```bash
cd /var/www/rxsystem/backend
cp .env.example .env  # fill in production values
npm install
npm run migrate
pm2 start src/index.js --name rxsystem-api
pm2 save
pm2 startup
```

### Frontend (Build)
```bash
cd /var/www/rxsystem/frontend
npm install
npm run build   # outputs to dist/
```

### Nginx Config
```nginx
server {
    listen 80;
    server_name yourdomain.lk www.yourdomain.lk;

    # Frontend
    location / {
        root /var/www/rxsystem/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### SSL (Let's Encrypt)
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.lk
```

---

## API Endpoints

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | /api/auth/register/patient | Public | Patient registration |
| POST | /api/auth/register/doctor | Public | Doctor registration (pending approval) |
| POST | /api/auth/register/pharmacy | Public | Pharmacy registration (pending approval) |
| POST | /api/auth/login | Public | Login → returns JWT |
| GET | /api/auth/me | All | Get current user |
| GET | /api/prescriptions | Auth | List prescriptions (role-filtered) |
| POST | /api/prescriptions | Doctor | Create prescription |
| GET | /api/prescriptions/:id | Auth | View single prescription |
| POST | /api/prescriptions/:id/send | Doctor | Send to pharmacy |
| POST | /api/prescriptions/:id/receive | Pharmacy | Mark received |
| POST | /api/prescriptions/:id/dispense | Pharmacy | Mark dispensed |
| POST | /api/prescriptions/:id/cancel | Doctor/Admin | Cancel |
| GET | /api/prescriptions/verify/:code | Public | QR code verification |
| GET | /api/pharmacies | Auth | List approved pharmacies |
| GET | /api/patients/search?nic= | Doctor | Find patient by NIC |
| PATCH | /api/patients/preferred-pharmacy | Patient | Set preferred pharmacy |
| GET | /api/notifications | Auth | Get notifications |
| GET | /api/admin/dashboard | Admin | System stats |
| GET | /api/admin/pending-approvals | Admin | Pending doctor/pharmacy |
| POST | /api/admin/approve/:userId | Admin | Approve or reject |
| GET | /api/admin/audit-logs | Admin | View all logs |
| GET | /api/admin/reports | Admin | Analytics report |

---

## Prescription Lifecycle

```
Doctor Creates (status: created)
    ↓
Doctor Sends to Pharmacy (status: sent)
    ↓
Pharmacy Receives (status: received)
    ↓
Pharmacy Dispenses (status: dispensed)
    ↓ Patient gets SMS/email notification
```

---

## Security Features
- JWT authentication with role-based access
- Rate limiting (100 req/15min, 10 logins/15min)
- Helmet.js security headers
- bcrypt password hashing (12 rounds)
- Full audit log trail
- QR code + digital signature on every prescription
- Doctor/pharmacy must be approved by admin before access

---

## Next Steps (Enhancements)
- [ ] SMS integration (Dialog/Mobitel/Twilio)
- [ ] WhatsApp Business API notifications
- [ ] Prescription PDF print view
- [ ] Medicine autocomplete from catalogue
- [ ] SLMC API verification
- [ ] Two-factor authentication (OTP)
- [ ] Mobile app (React Native)
- [ ] Offline mode for pharmacies

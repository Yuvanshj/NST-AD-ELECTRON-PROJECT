# MahaSetu (મહાસેતુ) Production Deployment & Operations Guide
### Government of Gujarat — Higher Education & GTU Alumni Association Platform

---

## 1. Architecture Overview
MahaSetu is an enterprise-scale alumni platform connecting all state universities and technical colleges across Gujarat.
- **Frontend Web**: React 19 + Vite SPA (bundled into `dist/` and served via Express in production).
- **Desktop Application**: Electron 45 with context isolation, process sandboxing, and secure IPC.
- **Mobile Application**: Expo React Native (iOS & Android) with `expo-secure-store`.
- **Backend API**: Node.js + Express with JWT authentication, role-based access control, tenant isolation, and audit logging.
- **Database**: MongoDB with Mongoose ODM, strict schema validation, and compound indexes.
- **Payments**: Razorpay SDK with HMAC SHA-256 webhook signature verification and Section 80G tax receipt generation.
- **Event Admissions**: Verifiable QR ticket generation with HMAC SHA-256 tokens and duplicate check-in prevention.

---

## 2. Server Requirements
- **OS**: Ubuntu 22.04 LTS / 24.04 LTS / RHEL 9
- **CPU**: 4 Cores minimum (8 Cores recommended for state-wide peak traffic)
- **RAM**: 8 GB minimum (16 GB recommended)
- **Storage**: 100 GB NVMe SSD
- **Node.js**: v20 LTS or v22 LTS
- **Database**: MongoDB 6.0+ or MongoDB Atlas Cluster (M10+)

---

## 3. Environment Variables Setup
Copy `.env.example` to `.env` on your production host:
```bash
cp .env.example .env
```
Ensure the following production credentials are set:
```ini
NODE_ENV=production
PORT=5001
MONGODB_URI=mongodb+srv://<admin>:<password>@cluster0.mongodb.net/mahasetu?retryWrites=true&w=majority
JWT_SECRET=super_secret_high_entropy_key_64_chars_minimum
RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
RAZORPAY_WEBHOOK_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
EVENT_SECRET=ticket_hmac_secret_2025
OTP_SALT=otp_salt_secret_2025
```

---

## 4. Deployment via Docker & Docker Compose (Recommended)
```bash
# 1. Clone repository
git clone https://github.com/Yuvanshj/NST-AD-ELECTRON-PROJECT.git
cd NST-AD-ELECTRON-PROJECT

# 2. Build and start containers
docker compose up -d --build

# 3. Check health status
curl http://localhost:5001/api/health
```

---

## 5. Deployment via PM2 & Systemd (Native Linux)
```bash
# 1. Install dependencies
npm ci

# 2. Build React frontend bundle
npm run build

# 3. Start backend using PM2
npm install -g pm2
pm2 start server/index.js --name "mahasetu-backend" -i max
pm2 save
pm2 startup
```

---

## 6. Nginx Reverse Proxy & SSL (Certbot)
Configure `/etc/nginx/sites-available/mahasetu`:
```nginx
server {
    server_name alumni.gujarat.gov.in;

    location / {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        client_max_body_size 10M;
    }
}
```
Obtain SSL certificate:
```bash
sudo certbot --nginx -d alumni.gujarat.gov.in
```

---

## 7. Database Backup & Disaster Recovery
### Automated Daily Backup:
```bash
mongodump --uri="$MONGODB_URI" --gzip --archive=/backups/mahasetu_$(date +%Y%m%d).gz
```
### Database Restore:
```bash
mongorestore --uri="$MONGODB_URI" --gzip --archive=/backups/mahasetu_YYYYMMDD.gz --drop
```

---

## 8. Mobile App Release Process
Refer to `mobile/README.md` for building Android APK/AAB and iOS IPA via EAS Build.

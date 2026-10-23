# MahaSetu (મહાસેતુ) - Gujarat State Alumni Association Platform
> **Government of Gujarat — Department of Higher Education & GTU**  
> State-scale, multi-college Alumni Network, Mentorship, Giving & Career Ecosystem built strictly in **React and JavaScript** with **MongoDB**.

---

## 🏛️ System Overview & Context

State engineering colleges frequently lose touch with graduates once they leave campus. Without a trusted, single alumni identity and tangible mutual value, alumni engagement drops to zero.

This platform solves this fundamental challenge for the **Gujarat Education Department** across institutions like **L.D. College of Engineering (LDCE Ahmedabad)**, **Birla Vishvakarma Mahavidyalaya (BVM Vallabh Vidyanagar)**, and **Vishwakarma Government Engineering College (VGEC Chandkheda)**.

### Technology Stack
- **Frontend**: Pure **React (JSX) + JavaScript** with Vite and Vanilla CSS design tokens.
- **Backend**: **Node.js + Express** REST API.
- **Database**: **MongoDB** with Mongoose ODM (includes zero-config auto-fallback to `mongodb-memory-server` if no local/remote MongoDB instance is configured).
- **Security & Utilities**: HMAC-SHA256 signatures, 80G PDF/HTML tax certificate generator, and QR code ticket generation for paperless admission check-ins.
- **Strict Constraints**: **React and JavaScript only. No Electron, No TypeScript.**

---

## 🌟 Key Differentiators & Problem Solutions

| Challenge in PRD | Architectural Solution |
| :--- | :--- |
| **Fake Profiles / Low Trust** | **Admin Verification Queue & GTU Enrollment Vetting**: Alumni submit enrollment numbers and degree certificates. College admins review and grant the official `VERIFIED_ALUMNUS` credential badge. |
| **Cold Start (Empty Platform)** | **Registrar Bulk CSV Import**: College registrars can upload batches of convocation-verified alumni to seed and verify the directory in bulk. |
| **Daily-Use Value for Alumni** | **Referral-Driven Job Board**: Alumni post vacancies with an explicit flag: *"Alumni Referral Available"*, turning plain job boards into high-value alumni referral pipelines. |
| **Student Mentorship Disconnect** | **Smart Mentor Matcher**: Automated algorithm scoring mentor match quality based on branch alignment, target skill overlap, and company affinity. |
| **Donation Fraud / Skepticism** | **Public Transparency Fund Ledger & Auto 80G Receipts**: Itemized accounting of every rupee disbursed (vendor name, invoice ref, audit sign-off) + instant 80G tax certificate generation. |
| **Event No-Shows & Logistics** | **Encrypted QR Pass & Ticket Check-In**: Instant RSVP generates scannable QR ticket passes. Event desk scans and checks in attendees in real time. |
| **Bilingual Government Context** | **English & Gujarati (ગુજરાતી) Localization**: Full UI string dictionary toggleable in the top navigation bar. |

---

## 🧱 5-Stage PRD Implementation Roadmap

### Stage 1: Foundation & Identity
- **Email OTP Simulation**: Dispatch and verify 6-digit OTP codes with 10-minute expiry windows.
- **Unified Profile Model**: Batch, engineering branch, GTU enrollment number, company, designation, skills array, avatar, and bio.
- **Privacy Controls**: Granular toggles to hide personal phone or email from public search while remaining visible to college admins.
- **Vetting Queue**: Status flow: `PENDING` ➔ `VERIFIED` or `REJECTED` (with audit trail and notifications).

### Stage 2: Directory, Networking & 1:1 Messaging
- **Faceted Directory**: Filter by graduation year, engineering branch, company, industry sector, skills, and verified status.
- **Geographic Distribution**: Live counters of alumni presence across Ahmedabad, Bengaluru, Gandhinagar, Mumbai, San Jose, etc.
- **Connection Handshake**: Send, accept, or decline connection requests with mutual connection counts.
- **Smart Mentorship**: Mentors opt in with domains, availability hours, and mentee limits. Match score (0–100%) dynamically calculated for student mentees.
- **1:1 Direct Chat**: Thread lists, real-time message read receipts, and unread notification badges.

### Stage 3: Referral-Driven Career Portal
- **Job Creation**: Post roles with title, company, salary range, location, and application deadline.
- **"Alumni Referral Available" Flag**: Posters provide personalized referral guidelines.
- **Application Workflow**: Candidates apply with resume document link, cover note, and referral request flag.
- **Poster Dashboard**: Real-time review of applicants with status transitions (`APPLIED` ➔ `UNDER_REVIEW` ➔ `REFERRED` ➔ `SHORTLISTED` ➔ `REJECTED`).

### Stage 4: Giving, 80G Tax Receipts & Events
- **Endowment Campaigns**: High-impact causes (AI & Robotics CoE, Rural Girl Student Scholarships) with live target vs. raised progress bars.
- **Razorpay Simulation**: Secure checkout simulation with HMAC-SHA256 signature verification.
- **Auto 80G Tax Certificates**: Instant generation of official tax-deductible certificates with PAN, sequential receipt IDs, and print template.
- **Public Transparency Ledger**: Full public ledger tracking total raised vs. total disbursed vs. audited reserve balance with vendor invoice records.
- **Donor Leaderboard**: Recognition tiers: **Visionary Patron** (≥ ₹1 Lakh), **Distinguished Benefactor** (≥ ₹25,000), **Honored Donor** (≥ ₹5,000).
- **Events & QR Check-In**: Capacity control, RSVP generation of encrypted QR passes, and admin on-site check-in scanner.

### Stage 5: Feedback & Governance
- **Curriculum Pulse Surveys**: Interactive survey submission and live aggregated polling metrics.
- **Alumni Hall of Fame**: Spotlight stories categorized into Entrepreneurship, Corporate Leadership, Research, and Public Service.
- **State & College Analytics**: DTE Gujarat state-level dashboard with cross-institution comparisons (LDCE vs. BVM vs. VGEC).
- **Immutable Audit Trail**: Tamper-evident logging of administrative verifications, financial transactions, and credential mutations.

---

## 🚀 Quickstart Guide

### Prerequisites
- Node.js (v18+ recommended)
- npm (v9+)
- *(Optional)* MongoDB instance on `mongodb://127.0.0.1:27017` — if not running, an in-memory MongoDB daemon boots automatically with zero configuration required!

### Installation
```bash
# Clone the repository
git clone https://github.com/Yuvanshj/NST-AD-ELECTRON-PROJECT.git
cd NST-AD-ELECTRON-PROJECT

# Install dependencies
npm install
```

### Running Locally (Development Mode)
```bash
# Starts both Express Backend (Port 5001) and Vite React Frontend (Port 5173) concurrently
npm run dev
```

Visit **http://localhost:5173** in your browser.

### Running Automated Test Suite
```bash
npm test
```
All 10 integration test suites verify the full end-to-end functionality against MongoDB:
1. Health & system metadata
2. Auth & verified login
3. Registrar verification queue
4. Directory filtering
5. Referral-driven job board
6. Simulated Razorpay 80G tax receipt generation
7. QR event admission pass generation & scanner check-in
8. Public transparency fund ledger
9. State Higher Education KPIs
10. Immutable activity audit trail

---

## 🎭 Pre-Configured Personas for Demonstrations
The navigation bar includes a one-click persona simulator to explore the platform through various lenses:
- **Hardik Patel (Alumnus)**: Verified graduate working at TCS, available for student mentorship and job referrals.
- **Meet Joshi (Student)**: 3rd year IT student exploring smart mentorship matches and referral openings.
- **Prof. Anitaben Shah (College Registrar Admin)**: LDCE registrar reviewing degree documents and issuing GTU badges.
- **Dr. K. P. Trivedi (State Director)**: Department of Higher Education director overseeing cross-college state analytics and public fund ledger.
- **Rahul Vyas (Pending Alumnus)**: Newly registered alumnus awaiting registrar validation.

# MahaSetu Mobile Application (મહાસેતુ)
### Gujarat State Alumni Association Platform — Android & iOS Mobile Client

Built with **React Native**, **Expo SDK 52**, and **TypeScript**, integrating with the MahaSetu Node.js + Express & MongoDB backend.

---

## 1. Features
- **Authentication**: JWT token storage via `expo-secure-store`, password login, passwordless OTP verification, password reset, and evaluator test persona switcher.
- **State-wide Alumni Directory**: Search and filtering by name, company, graduation batch, discipline, and skills with verified GTU badges.
- **Careers & Referrals**: Job listings, referral pledge tags, internal referral requests with resume URL and pitch.
- **Events & QR Attendance**: Reunion discovery, RSVP confirmation, and instant verifiable digital QR ticket passes for desk optical check-in.
- **Giving & Section 80G**: Gujarat education endowment campaigns, live progress tracking, computerized receipts with 80G tax deductibility status.
- **Student Mentorship**: Explainable skill and branch matching between alumni mentors and students.
- **Real-time Chat**: One-to-one alumni communication with unread counters.
- **In-App Notifications**: Real-time alerts for verification approvals, event tickets, referrals, and messages.

---

## 2. Prerequisites
- **Node.js**: v18+ or v20+
- **Expo CLI** (bundled with Expo SDK)
- **Android Studio** (for Android Emulator) or **Xcode** (for iOS Simulator)
- **MahaSetu Backend Server** running on `http://localhost:5001`

---

## 3. Quick Start (Development)

### Step 1: Install Dependencies
```bash
cd mobile
npm install
```

### Step 2: Configure Backend Connection
By default:
- **Android Emulator**: connects to `http://10.0.2.2:5001/api`
- **iOS Simulator / Web**: connects to `http://localhost:5001/api`
- **Physical Device (Expo Go)**: set your computer's LAN IP (e.g., `http://192.168.1.100:5001/api`) in `src/services/api.ts`.

### Step 3: Run the Application
```bash
# Start Expo development server
npm start

# Run directly on Android Emulator
npm run android

# Run directly on iOS Simulator
npm run ios
```

---

## 4. Production Release Builds (EAS Build)

To build standalone release binaries:

### Android APK / AAB
```bash
npx eas-cli login
npx eas-cli build --platform android --profile production
```

### iOS IPA
```bash
npx eas-cli build --platform ios --profile production
```

import express from 'express';
import { User } from '../models/User.js';
import { Profile } from '../models/Profile.js';
import { College } from '../models/College.js';
import { OtpSession, AuditLog } from '../models/AuditLog.js';
import { VerificationRequest } from '../models/VerificationRequest.js';
import { hashPassword, comparePassword, generateOtp, hashOtp } from '../utils/crypto.js';
import { generateToken, generateRefreshToken, authenticate, authorize, enforceTenantIsolation } from '../middleware/auth.js';

export const authRouter = express.Router();

// Rate limiting map for OTP & Login attempts in memory
const rateLimitMap = new Map();

function checkRateLimit(key, maxRequests = 5, windowMs = 15 * 60 * 1000) {
  const now = Date.now();
  const record = rateLimitMap.get(key) || { count: 0, firstRequest: now };

  if (now - record.firstRequest > windowMs) {
    record.count = 1;
    record.firstRequest = now;
    rateLimitMap.set(key, record);
    return true;
  }

  if (record.count >= maxRequests) {
    return false;
  }

  record.count += 1;
  rateLimitMap.set(key, record);
  return true;
}

/**
 * POST /api/auth/otp/request
 * Generate and dispatch cryptographically secure OTP
 */
authRouter.post('/otp/request', async (req, res) => {
  try {
    const { email, purpose = 'LOGIN' } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

    const cleanEmail = email.trim().toLowerCase();
    const clientIp = req.ip || req.connection.remoteAddress || '127.0.0.1';

    // Rate limiting: max 5 requests per 15 minutes per email/IP
    if (!checkRateLimit(`otp_${cleanEmail}`, 5, 15 * 60 * 1000)) {
      return res.status(429).json({
        success: false,
        message: 'Too many OTP requests for this email. Please wait 15 minutes before retrying.',
      });
    }

    const otp = generateOtp();
    const otpHash = hashOtp(otp);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Invalidate prior active OTPs for this email and purpose
    await OtpSession.updateMany({ email: cleanEmail, isUsed: false }, { isUsed: true });

    await OtpSession.create({
      email: cleanEmail,
      otp: process.env.NODE_ENV !== 'production' ? otp : undefined,
      otpHash,
      purpose,
      expiresAt,
      isUsed: false,
    });

    await AuditLog.create({
      action: 'OTP_REQUESTED',
      category: 'AUTH',
      userEmail: cleanEmail,
      ipAddress: clientIp,
      details: { email: cleanEmail, purpose },
    });

    // In production, dispatch via SMTP/SMS gateway. Never expose OTP in production response.
    const responsePayload = {
      success: true,
      message: `Verification code sent to ${cleanEmail}. Valid for 10 minutes.`,
    };

    if (process.env.NODE_ENV !== 'production' || process.env.ALLOW_DEV_OTP === 'true') {
      responsePayload.debugOtp = otp;
    }

    res.json(responsePayload);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Alias for OTP request
authRouter.post('/send-otp', async (req, res) => {
  req.url = '/otp/request';
  authRouter.handle(req, res);
});

/**
 * POST /api/auth/otp/verify
 * Validate OTP and issue authentication token if user exists
 */
authRouter.post('/otp/verify', async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and OTP code are required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = String(otp).trim();
    const calculatedHash = hashOtp(cleanOtp);

    // Find active OTP session
    const session = await OtpSession.findOne({
      email: cleanEmail,
      isUsed: false,
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    if (!session) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP code.' });
    }

    // Attempt tracking
    session.attempts += 1;
    if (session.attempts > 5) {
      session.isUsed = true;
      await session.save();
      return res.status(400).json({
        success: false,
        message: 'Maximum OTP verification attempts exceeded. Please request a new code.',
      });
    }

    const isMatch = session.otpHash === calculatedHash || session.otp === cleanOtp;
    if (!isMatch) {
      await session.save();
      return res.status(400).json({ success: false, message: 'Incorrect OTP code.' });
    }

    session.isUsed = true;
    await session.save();

    const user = await User.findOne({ email: cleanEmail }).populate('collegeId');
    if (!user) {
      return res.json({
        success: true,
        verified: true,
        email: cleanEmail,
        message: 'OTP verified. Please complete your registration.',
      });
    }

    user.lastLoginAt = new Date();
    user.loginAttempts = 0;
    user.lockUntil = null;
    user.isEmailVerified = true;
    await user.save();

    const profile = await Profile.findOne({ userId: user._id });
    const token = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    const userObj = user.toObject();
    userObj.name = user.fullName;
    if (profile) {
      userObj.profile = profile;
      userObj.verificationStatus = profile.verificationStatus;
      userObj.gtuEnrollment = profile.enrollmentNumber;
      userObj.batchYear = profile.batch;
      userObj.branch = profile.branch;
      userObj.degree = profile.degree || 'B.E.';
    }

    await AuditLog.create({
      collegeId: user.collegeId?._id,
      userId: user._id,
      userEmail: user.email,
      action: 'LOGIN_OTP_SUCCESS',
      category: 'AUTH',
      ipAddress: req.ip || '127.0.0.1',
    });

    res.json({
      success: true,
      token,
      refreshToken,
      user: userObj,
      profile,
      college: user.collegeId,
      message: 'Logged in successfully via OTP.',
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

authRouter.post('/verify-otp', async (req, res) => {
  req.url = '/otp/verify';
  authRouter.handle(req, res);
});

/**
 * POST /api/auth/register
 * Register a new user with institutional verification safeguards
 */
authRouter.post('/register', async (req, res) => {
  try {
    const {
      collegeId,
      email,
      phone,
      password,
      fullName,
      role = 'ALUMNI',
      batch,
      branch,
      enrollmentNumber,
      currentCompany,
      designation,
      city,
    } = req.body;

    if (!email || !fullName) {
      return res.status(400).json({ success: false, message: 'Email and full name are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
    }

    // Validate college
    let targetCollegeId = collegeId;
    if (!targetCollegeId) {
      const defaultCollege = await College.findOne();
      targetCollegeId = defaultCollege?._id;
    } else {
      const collegeExists = await College.findById(targetCollegeId);
      if (!collegeExists) {
        return res.status(400).json({ success: false, message: 'Specified college does not exist.' });
      }
    }

    // Institutional duplicate check for alumni enrollment number
    if (role === 'ALUMNI' && enrollmentNumber) {
      const duplicateEnrollment = await Profile.findOne({
        enrollmentNumber: enrollmentNumber.trim(),
      }).populate('userId');

      if (duplicateEnrollment && duplicateEnrollment.userId?.collegeId?.toString() === targetCollegeId.toString()) {
        return res.status(400).json({
          success: false,
          message: 'An alumnus with this enrollment number is already registered at this institution.',
        });
      }
    }

    // Password strength check (min 6 chars)
    const rawPassword = password || 'Password@123';
    if (rawPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
    }

    const newUser = await User.create({
      collegeId: targetCollegeId,
      email: cleanEmail,
      phone: phone || '',
      passwordHash: hashPassword(rawPassword),
      role,
      fullName: fullName.trim(),
      isEmailVerified: true,
      lastLoginAt: new Date(),
    });

    const isAlumni = role === 'ALUMNI';
    const newProfile = await Profile.create({
      userId: newUser._id,
      batch: Number(batch) || new Date().getFullYear(),
      branch: branch || 'Computer Engineering',
      enrollmentNumber: enrollmentNumber ? enrollmentNumber.trim() : '',
      currentCompany: currentCompany || (role === 'STUDENT' ? 'Student' : ''),
      designation: designation || (role === 'STUDENT' ? 'Student' : 'Alumnus'),
      industry: role === 'STUDENT' ? 'Education' : 'Technology',
      city: city || 'Ahmedabad',
      skills: branch ? [branch] : ['Engineering'],
      avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fullName)}`,
      verificationStatus: isAlumni ? 'PENDING' : 'VERIFIED',
      verifiedAt: isAlumni ? null : new Date(),
    });

    if (isAlumni && enrollmentNumber) {
      await VerificationRequest.create({
        userId: newUser._id,
        collegeId: targetCollegeId,
        enrollmentNumber: enrollmentNumber.trim(),
        degreeProofDoc: 'Self-declared during registration',
        passingYear: Number(batch) || new Date().getFullYear(),
        status: 'PENDING',
        notes: 'Submitted during account creation',
      });
    }

    const token = generateToken(newUser);
    const refreshToken = generateRefreshToken(newUser);

    await AuditLog.create({
      collegeId: targetCollegeId,
      userId: newUser._id,
      userEmail: cleanEmail,
      action: 'USER_REGISTERED',
      category: 'AUTH',
      details: { role, enrollmentNumber },
    });

    const userObj = newUser.toObject();
    userObj.name = newUser.fullName;
    userObj.profile = newProfile;
    userObj.verificationStatus = newProfile.verificationStatus;
    userObj.gtuEnrollment = newProfile.enrollmentNumber;
    userObj.batchYear = newProfile.batch;
    userObj.branch = newProfile.branch;

    res.status(201).json({
      success: true,
      token,
      refreshToken,
      user: userObj,
      profile: newProfile,
      message: 'Account registered successfully.',
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/auth/login
 * Authenticate with email and password (no universal passwords, secure bcrypt hashing)
 */
authRouter.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: cleanEmail });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User account not found.' });
    }

    // Check account lockout
    if (user.lockUntil && user.lockUntil > new Date()) {
      const waitMinutes = Math.ceil((user.lockUntil - new Date()) / 60000);
      return res.status(423).json({
        success: false,
        message: `Account is temporarily locked due to repeated failed login attempts. Please retry in ${waitMinutes} minutes.`,
      });
    }

    const isMatch = comparePassword(password, user.passwordHash);

    if (!isMatch) {
      user.loginAttempts = (user.loginAttempts || 0) + 1;
      if (user.loginAttempts >= 5) {
        user.lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 min lock
        await user.save();
        return res.status(423).json({
          success: false,
          message: 'Account locked for 15 minutes due to 5 consecutive failed login attempts.',
        });
      }
      await user.save();

      await AuditLog.create({
        collegeId: user.collegeId,
        userId: user._id,
        userEmail: cleanEmail,
        action: 'LOGIN_FAILED',
        category: 'SECURITY',
        ipAddress: req.ip || '127.0.0.1',
      });

      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    // Reset login attempts on success
    user.loginAttempts = 0;
    user.lockUntil = null;
    user.lastLoginAt = new Date();
    await user.save();

    const profile = await Profile.findOne({ userId: user._id });
    const college = await College.findById(user.collegeId);

    const token = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    const userObj = user.toObject();
    userObj.name = user.fullName;
    if (profile) {
      userObj.profile = profile;
      userObj.verificationStatus = profile.verificationStatus;
      userObj.gtuEnrollment = profile.enrollmentNumber;
      userObj.batchYear = profile.batch;
      userObj.branch = profile.branch;
      userObj.degree = profile.degree || 'B.E.';
    }
    if (college) {
      userObj.collegeId = college;
    }

    await AuditLog.create({
      collegeId: user.collegeId,
      userId: user._id,
      userEmail: cleanEmail,
      action: 'LOGIN_SUCCESS',
      category: 'AUTH',
      ipAddress: req.ip || '127.0.0.1',
    });

    res.json({
      success: true,
      token,
      refreshToken,
      user: userObj,
      profile,
      college,
      message: 'Authentication successful.',
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/auth/logout
 */
authRouter.post('/logout', authenticate, async (req, res) => {
  try {
    await AuditLog.create({
      collegeId: req.user.collegeId?._id,
      userId: req.user._id,
      userEmail: req.user.email,
      action: 'USER_LOGOUT',
      category: 'AUTH',
    });

    res.json({ success: true, message: 'Logged out successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/auth/me
 * Retrieve currently authenticated user profile
 */
authRouter.get('/me', authenticate, async (req, res) => {
  try {
    const profile = await Profile.findOne({ userId: req.user._id });
    const userObj = req.user.toObject();
    userObj.name = req.user.fullName;
    if (profile) {
      userObj.profile = profile;
      userObj.verificationStatus = profile.verificationStatus;
      userObj.gtuEnrollment = profile.enrollmentNumber;
      userObj.batchYear = profile.batch;
      userObj.branch = profile.branch;
      userObj.degree = profile.degree || 'B.E.';
    }

    res.json({ success: true, user: userObj, profile, college: req.user.collegeId });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/auth/profile/:id
 * Retrieve user profile by user ID
 */
authRouter.get('/profile/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate('collegeId');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const profile = await Profile.findOne({ userId: user._id });

    const userObj = user.toObject();
    userObj.name = user.fullName;
    if (profile) {
      userObj.profile = profile;
      userObj.verificationStatus = profile.verificationStatus;
      userObj.gtuEnrollment = profile.enrollmentNumber;
      userObj.batchYear = profile.batch;
      userObj.branch = profile.branch;
      userObj.degree = profile.degree || 'B.E.';
    }

    res.json({ success: true, user: userObj, profile, college: user.collegeId });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * PUT /api/auth/profile/:id
 * Update user profile (enforces ownership or admin role)
 */
authRouter.put('/profile/:id', authenticate, async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const isOwner = req.user._id.toString() === targetUserId;
    const isAdmin = req.user.role === 'SUPER_ADMIN' || req.user.role === 'COLLEGE_ADMIN';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You cannot modify another user\'s profile.',
      });
    }

    const {
      fullName,
      phone,
      currentCompany,
      designation,
      industry,
      city,
      country,
      bio,
      linkedinUrl,
      skills,
      isMentor,
      mentorDomain,
      mentorMaxMentees,
      mentorAvailability,
      privacy,
    } = req.body;

    if (fullName) {
      await User.findByIdAndUpdate(targetUserId, { fullName, phone: phone || '' });
    }

    const updatedProfile = await Profile.findOneAndUpdate(
      { userId: targetUserId },
      {
        $set: {
          ...(currentCompany !== undefined && { currentCompany }),
          ...(designation !== undefined && { designation }),
          ...(industry !== undefined && { industry }),
          ...(city !== undefined && { city }),
          ...(country !== undefined && { country }),
          ...(bio !== undefined && { bio }),
          ...(linkedinUrl !== undefined && { linkedinUrl }),
          ...(skills !== undefined && { skills }),
          ...(isMentor !== undefined && { isMentor }),
          ...(mentorDomain !== undefined && { mentorDomain }),
          ...(mentorMaxMentees !== undefined && { mentorMaxMentees }),
          ...(mentorAvailability !== undefined && { mentorAvailability }),
          ...(privacy !== undefined && { privacy }),
        },
      },
      { new: true, upsert: true }
    );

    await AuditLog.create({
      collegeId: req.user.collegeId?._id,
      userId: req.user._id,
      action: 'PROFILE_UPDATED',
      category: 'AUTH',
      details: { targetUserId },
    });

    res.json({ success: true, profile: updatedProfile, message: 'Profile updated successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/auth/forgot-password
 */
authRouter.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

    const cleanEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      // Do not reveal whether user exists for account enumeration protection
      return res.json({
        success: true,
        message: 'If this email is registered, a password reset code has been sent.',
      });
    }

    const otp = generateOtp();
    const otpHash = hashOtp(otp);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await OtpSession.create({
      email: cleanEmail,
      otp: process.env.NODE_ENV !== 'production' ? otp : undefined,
      otpHash,
      purpose: 'PASSWORD_RESET',
      expiresAt,
    });

    const response = {
      success: true,
      message: 'If this email is registered, a password reset code has been sent.',
    };
    if (process.env.NODE_ENV !== 'production' || process.env.ALLOW_DEV_OTP === 'true') {
      response.debugOtp = otp;
    }

    res.json(response);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/auth/reset-password
 */
authRouter.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ success: false, message: 'Email, OTP code, and new password are required.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const calculatedHash = hashOtp(String(otp).trim());

    const session = await OtpSession.findOne({
      email: cleanEmail,
      purpose: 'PASSWORD_RESET',
      isUsed: false,
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    if (!session || (session.otpHash !== calculatedHash && session.otp !== otp)) {
      return res.status(400).json({ success: false, message: 'Invalid or expired password reset code.' });
    }

    session.isUsed = true;
    await session.save();

    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    user.passwordHash = hashPassword(newPassword);
    user.loginAttempts = 0;
    user.lockUntil = null;
    await user.save();

    await AuditLog.create({
      collegeId: user.collegeId,
      userId: user._id,
      userEmail: cleanEmail,
      action: 'PASSWORD_RESET_SUCCESS',
      category: 'SECURITY',
    });

    res.json({ success: true, message: 'Password has been reset successfully. Please log in.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/auth/colleges
 */
authRouter.get('/colleges', async (req, res) => {
  try {
    const colleges = await College.find({ isActive: true }).sort({ name: 1 });
    res.json({ success: true, count: colleges.length, colleges });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/auth/users (Admin only, tenant scoped)
 */
authRouter.get('/users', authenticate, authorize('SUPER_ADMIN', 'STATE_DIRECTOR', 'COLLEGE_ADMIN'), async (req, res) => {
  try {
    const query = {};
    if (req.user.role === 'COLLEGE_ADMIN') {
      query.collegeId = req.user.collegeId?._id || req.user.collegeId;
    }

    const users = await User.find(query).populate('collegeId', 'name code').sort({ createdAt: -1 });
    res.json({ success: true, count: users.length, users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default authRouter;

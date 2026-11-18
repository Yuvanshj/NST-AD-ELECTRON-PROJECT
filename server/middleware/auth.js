import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

const JWT_SECRET = process.env.JWT_SECRET || 'mahasetu-gujarat-state-alumni-jwt-secret-key-2025';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

/**
 * Generate signed JWT Access Token
 */
export function generateToken(user) {
  return jwt.sign(
    {
      userId: user._id,
      email: user.email,
      role: user.role,
      collegeId: user.collegeId,
      fullName: user.fullName,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

/**
 * Generate Refresh Token
 */
export function generateRefreshToken(user) {
  return jwt.sign(
    { userId: user._id, type: 'refresh' },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

/**
 * Authenticate JWT token from headers or cookie
 */
export async function authenticate(req, res, next) {
  try {
    let token = null;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.headers['x-access-token']) {
      token = req.headers['x-access-token'];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. No authorization token provided.',
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          code: 'TOKEN_EXPIRED',
          message: 'Session expired. Please log in again.',
        });
      }
      return res.status(401).json({
        success: false,
        message: 'Invalid or forged authentication token.',
      });
    }

    const user = await User.findById(decoded.userId).populate('collegeId');
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User account not found or deactivated.',
      });
    }

    req.user = user;
    req.tokenPayload = decoded;
    next();
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * Optional authentication: populates req.user if valid token present, allows through otherwise
 */
export async function optionalAuthenticate(req, res, next) {
  try {
    let token = null;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.headers['x-access-token']) {
      token = req.headers['x-access-token'];
    }

    if (!token) {
      req.user = null;
      return next();
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await User.findById(decoded.userId).populate('collegeId');
      if (user && user.isActive) {
        req.user = user;
      } else {
        req.user = null;
      }
    } catch (e) {
      req.user = null;
    }
    next();
  } catch (err) {
    req.user = null;
    next();
  }
}

/**
 * Role-Based Access Control Middleware
 */
export function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required for this operation.',
      });
    }

    // Super Administrator and State Director have global administrative rights
    if (req.user.role === 'SUPER_ADMIN' || req.user.role === 'STATE_DIRECTOR') {
      return next();
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: role '${req.user.role}' lacks permission for this resource.`,
      });
    }

    next();
  };
}

/**
 * Tenant Isolation Helper: Checks if college admin belongs to the target college
 */
export function enforceTenantIsolation(req, targetCollegeId) {
  if (!req.user) return false;
  if (req.user.role === 'SUPER_ADMIN' || req.user.role === 'STATE_DIRECTOR') return true;

  const userCollegeId = req.user.collegeId?._id?.toString() || req.user.collegeId?.toString();
  const targetId = targetCollegeId?.toString();

  return userCollegeId === targetId;
}

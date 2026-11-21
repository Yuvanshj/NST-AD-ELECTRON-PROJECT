import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { api } from '../services/api.js';
import {
  X,
  Mail,
  Lock,
  User,
  Building2,
  GraduationCap,
  Briefcase,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

export default function AuthModal() {
  const {
    showAuthModal,
    setShowAuthModal,
    authModalMode,
    setAuthModalMode,
    login,
    loginWithOtp,
    register,
    colleges,
    quickLoginPersona,
  } = useAuth();

  const [mode, setMode] = useState(authModalMode || 'login'); // 'login' | 'register' | 'otp' | 'forgot'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Sign In state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // OTP Login state
  const [otpEmail, setOtpEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  // Register state
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regCollegeId, setRegCollegeId] = useState(colleges[0]?._id || '');
  const [regRole, setRegRole] = useState('ALUMNI');
  const [regBatch, setRegBatch] = useState(new Date().getFullYear() - 4);
  const [regBranch, setRegBranch] = useState('Computer Engineering');
  const [regEnrollment, setRegEnrollment] = useState('');
  const [regCompany, setRegCompany] = useState('');
  const [regDesignation, setRegDesignation] = useState('');
  const [regCity, setRegCity] = useState('Ahmedabad');

  // Forgot password state
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [forgotStep, setForgotStep] = useState(1); // 1: request, 2: reset

  if (!showAuthModal) return null;

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(loginEmail, loginPassword);
    } catch (err) {
      setError(err.message || 'Login failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    if (!otpEmail) return;
    setError('');
    setLoading(true);
    try {
      const res = await api.auth.sendOtp(otpEmail);
      setOtpSent(true);
      setSuccessMsg(res.message || `OTP dispatched to ${otpEmail}`);
    } catch (err) {
      setError(err.message || 'Failed to dispatch OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otpEmail || !otpCode) return;
    setError('');
    setLoading(true);
    try {
      await loginWithOtp(otpEmail, otpCode);
    } catch (err) {
      setError(err.message || 'Invalid or expired OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register({
        fullName: regFullName,
        email: regEmail,
        phone: regPhone,
        password: regPassword,
        collegeId: regCollegeId || colleges[0]?._id,
        role: regRole,
        batch: Number(regBatch),
        branch: regBranch,
        enrollmentNumber: regEnrollment,
        currentCompany: regCompany,
        designation: regDesignation,
        city: regCity,
      });
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasswordRequest = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.auth.forgotPassword(forgotEmail);
      setForgotStep(2);
      setSuccessMsg(res.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.auth.resetPassword({
        email: forgotEmail,
        otp: forgotOtp,
        newPassword,
      });
      setSuccessMsg(res.message);
      setTimeout(() => {
        setMode('login');
        setForgotStep(1);
      }, 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(5, 10, 24, 0.85)',
        backdropFilter: 'blur(10px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
      }}
    >
      <div
        className="glass-panel animate-fade-in"
        style={{
          width: '100%',
          maxWidth: mode === 'register' ? 620 : 440,
          maxHeight: '90vh',
          overflowY: 'auto',
          background: '#0a1024',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          borderRadius: 16,
          padding: '2rem',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: 'linear-gradient(135deg, #1e3a8a, #0d9488)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 800,
              }}
            >
              મ
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', margin: 0 }}>MahaSetu Access</h2>
              <span style={{ fontSize: '0.72rem', color: '#60a5fa' }}>Gujarat State Higher Education Portal</span>
            </div>
          </div>

          <button
            onClick={() => setShowAuthModal(false)}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div
          style={{
            display: 'flex',
            background: 'rgba(255, 255, 255, 0.04)',
            padding: 4,
            borderRadius: 8,
            marginBottom: '1.5rem',
            border: '1px solid var(--border-color)',
          }}
        >
          <button
            onClick={() => {
              setMode('login');
              setError('');
            }}
            style={{
              flex: 1,
              padding: '0.5rem',
              borderRadius: 6,
              border: 'none',
              background: mode === 'login' ? '#2563eb' : 'transparent',
              color: mode === 'login' ? '#fff' : 'var(--text-muted)',
              fontWeight: 600,
              fontSize: '0.8rem',
              cursor: 'pointer',
            }}
          >
            Sign In
          </button>
          <button
            onClick={() => {
              setMode('otp');
              setError('');
            }}
            style={{
              flex: 1,
              padding: '0.5rem',
              borderRadius: 6,
              border: 'none',
              background: mode === 'otp' ? '#2563eb' : 'transparent',
              color: mode === 'otp' ? '#fff' : 'var(--text-muted)',
              fontWeight: 600,
              fontSize: '0.8rem',
              cursor: 'pointer',
            }}
          >
            OTP Login
          </button>
          <button
            onClick={() => {
              setMode('register');
              setError('');
            }}
            style={{
              flex: 1,
              padding: '0.5rem',
              borderRadius: 6,
              border: 'none',
              background: mode === 'register' ? '#2563eb' : 'transparent',
              color: mode === 'register' ? '#fff' : 'var(--text-muted)',
              fontWeight: 600,
              fontSize: '0.8rem',
              cursor: 'pointer',
            }}
          >
            Register
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div
            style={{
              padding: '0.75rem',
              borderRadius: 8,
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid #ef4444',
              color: '#fca5a5',
              fontSize: '0.825rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '1rem',
            }}
          >
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}
        {successMsg && (
          <div
            style={{
              padding: '0.75rem',
              borderRadius: 8,
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid #10b981',
              color: '#6ee7b7',
              fontSize: '0.825rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '1rem',
            }}
          >
            <CheckCircle2 size={16} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* MODE: Password Login */}
        {mode === 'login' && (
          <form onSubmit={handleLoginSubmit}>
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label className="form-label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  className="form-input"
                  placeholder="alumnus@alum.ldce.ac.in"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <label className="form-label" style={{ margin: 0 }}>Password</label>
                <button
                  type="button"
                  onClick={() => {
                    setMode('forgot');
                    setForgotEmail(loginEmail);
                  }}
                  style={{ background: 'none', border: 'none', color: '#60a5fa', fontSize: '0.75rem', cursor: 'pointer' }}
                >
                  Forgot password?
                </button>
              </div>
              <input
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.75rem' }}
              disabled={loading}
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>
        )}

        {/* MODE: OTP Login */}
        {mode === 'otp' && (
          <div>
            {!otpSent ? (
              <form onSubmit={handleRequestOtp}>
                <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                  Enter your registered email address to receive a secure 6-digit one-time verification password.
                </p>
                <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                  <label className="form-label">Registered Email</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="hardik.patel@alum.ldce.ac.in"
                    value={otpEmail}
                    onChange={(e) => setOtpEmail(e.target.value)}
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '0.75rem' }}
                  disabled={loading}
                >
                  {loading ? 'Dispatching OTP...' : 'Send Verification OTP'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp}>
                <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                  Verification code sent to <strong>{otpEmail}</strong>. Enter the 6-digit code below:
                </p>
                <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                  <label className="form-label">6-Digit OTP Code</label>
                  <input
                    type="text"
                    maxLength={6}
                    className="form-input"
                    placeholder="123456"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    style={{ textAlign: 'center', letterSpacing: '0.3em', fontSize: '1.25rem', fontWeight: 700 }}
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="btn btn-success"
                  style={{ width: '100%', padding: '0.75rem' }}
                  disabled={loading}
                >
                  {loading ? 'Verifying OTP...' : 'Verify Code & Sign In'}
                </button>
                <button
                  type="button"
                  onClick={() => setOtpSent(false)}
                  style={{
                    width: '100%',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    fontSize: '0.75rem',
                    marginTop: '0.75rem',
                    cursor: 'pointer',
                  }}
                >
                  Change Email or Resend Code
                </button>
              </form>
            )}
          </div>
        )}

        {/* MODE: Register */}
        {mode === 'register' && (
          <form onSubmit={handleRegisterSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', marginBottom: '0.85rem' }}>
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Bhavesh Joshi"
                  value={regFullName}
                  onChange={(e) => setRegFullName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Email Address *</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="bhavesh.joshi@alum.ldce.ac.in"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', marginBottom: '0.85rem' }}>
              <div className="form-group">
                <label className="form-label">Select Institution *</label>
                <select
                  className="form-select"
                  value={regCollegeId}
                  onChange={(e) => setRegCollegeId(e.target.value)}
                  required
                >
                  {colleges.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Portal Role *</label>
                <select
                  className="form-select"
                  value={regRole}
                  onChange={(e) => setRegRole(e.target.value)}
                  required
                >
                  <option value="ALUMNI">Alumni</option>
                  <option value="STUDENT">Current Student</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.85rem', marginBottom: '0.85rem' }}>
              <div className="form-group">
                <label className="form-label">Passing / Batch Year</label>
                <input
                  type="number"
                  className="form-input"
                  value={regBatch}
                  onChange={(e) => setRegBatch(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Branch / Department</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Computer Engineering"
                  value={regBranch}
                  onChange={(e) => setRegBranch(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Enrollment No.</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="180280107045"
                  value={regEnrollment}
                  onChange={(e) => setRegEnrollment(e.target.value)}
                  required={regRole === 'ALUMNI'}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', marginBottom: '0.85rem' }}>
              <div className="form-group">
                <label className="form-label">Current Company / Organization</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Infosys, TCS, L&T"
                  value={regCompany}
                  onChange={(e) => setRegCompany(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Designation</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Senior Software Architect"
                  value={regDesignation}
                  onChange={(e) => setRegDesignation(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label className="form-label">Password *</label>
              <input
                type="password"
                className="form-input"
                placeholder="At least 6 characters"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.75rem' }}
              disabled={loading}
            >
              {loading ? 'Creating Account & Submitting to Verification...' : 'Register on MahaSetu'}
            </button>
          </form>
        )}

        {/* MODE: Forgot Password */}
        {mode === 'forgot' && (
          <div>
            {forgotStep === 1 ? (
              <form onSubmit={handleForgotPasswordRequest}>
                <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                  Enter your email address to receive a secure recovery code.
                </p>
                <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    className="form-input"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '0.75rem' }}
                  disabled={loading}
                >
                  {loading ? 'Sending Code...' : 'Send Recovery Code'}
                </button>
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  style={{
                    width: '100%',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    fontSize: '0.75rem',
                    marginTop: '0.75rem',
                    cursor: 'pointer',
                  }}
                >
                  Back to Sign In
                </button>
              </form>
            ) : (
              <form onSubmit={handleResetPasswordSubmit}>
                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label className="form-label">Recovery Code</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Enter 6-digit code"
                    value={forgotOtp}
                    onChange={(e) => setForgotOtp(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                  <label className="form-label">New Password</label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="New secure password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
                <button
                  type="submit"
                  className="btn btn-success"
                  style={{ width: '100%', padding: '0.75rem' }}
                  disabled={loading}
                >
                  {loading ? 'Resetting Password...' : 'Reset Password'}
                </button>
              </form>
            )}
          </div>
        )}

        {/* Quick Evaluator Access Section (explicit, safe, for hackathon testing) */}
        <div
          style={{
            marginTop: '1.5rem',
            paddingTop: '1rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginBottom: '0.5rem', fontWeight: 600 }}>
            EVALUATOR QUICK ACCESS (AUTHENTICATED WITH SEEDED CREDENTIALS):
          </div>
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => quickLoginPersona('ALUMNI')}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem' }}
            >
              Hardik Patel (Alumnus)
            </button>
            <button
              type="button"
              onClick={() => quickLoginPersona('STUDENT')}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem' }}
            >
              Meet Joshi (Student)
            </button>
            <button
              type="button"
              onClick={() => quickLoginPersona('COLLEGE_ADMIN')}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem' }}
            >
              Prof. Shah (Registrar)
            </button>
            <button
              type="button"
              onClick={() => quickLoginPersona('STATE_DIRECTOR')}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem' }}
            >
              Dr. Patel (State Dir)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

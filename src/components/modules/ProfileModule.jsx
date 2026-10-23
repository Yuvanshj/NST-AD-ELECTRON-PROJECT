import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { api } from '../../services/api.js';
import {
  User,
  ShieldCheck,
  Clock,
  Briefcase,
  GraduationCap,
  MapPin,
  Sparkles,
  Save,
  CheckCircle2,
} from 'lucide-react';

export default function ProfileModule() {
  const { currentUser, refreshProfile } = useAuth();
  const [formData, setFormData] = useState({
    bio: '',
    headline: '',
    company: '',
    designation: '',
    industry: '',
    location: '',
    skills: '',
    isMentorAvailable: false,
    linkedinUrl: '',
    githubUrl: '',
  });
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (currentUser) {
      const p = currentUser.profile || {};
      setFormData({
        bio: p.bio || '',
        headline: p.headline || '',
        company: p.company || '',
        designation: p.designation || '',
        industry: p.industry || '',
        location: p.location || '',
        skills: Array.isArray(p.skills) ? p.skills.join(', ') : '',
        isMentorAvailable: p.isMentorAvailable ?? true,
        linkedinUrl: p.socialLinks?.linkedin || '',
        githubUrl: p.socialLinks?.github || '',
      });
    }
  }, [currentUser]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');
    try {
      const payload = {
        ...formData,
        skills: formData.skills.split(',').map((s) => s.trim()).filter(Boolean),
        socialLinks: {
          linkedin: formData.linkedinUrl,
          github: formData.githubUrl,
        },
      };
      await api.auth.updateProfile(currentUser._id, payload);
      await refreshProfile();
      setSuccessMsg('Profile updated successfully!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      alert('Error updating profile: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!currentUser) {
    return <div className="page-wrapper">Please select a persona or log in.</div>;
  }

  const isVerified = currentUser.verificationStatus === 'VERIFIED';

  return (
    <div className="page-wrapper animate-fade-in">
      {/* Header Banner */}
      <div
        className="glass-panel"
        style={{
          padding: '2rem',
          marginBottom: '2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1.5rem',
          background: 'linear-gradient(135deg, rgba(16, 25, 46, 0.9) 0%, rgba(30, 58, 138, 0.25) 100%)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2rem',
              fontWeight: 800,
              boxShadow: '0 8px 24px rgba(59, 130, 246, 0.4)',
            }}
          >
            {currentUser.name?.charAt(0) || 'U'}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>{currentUser.name}</h1>
              {isVerified ? (
                <span className="badge badge-verified">
                  <ShieldCheck size={14} /> GTU Verified Alumnus
                </span>
              ) : (
                <span className="badge badge-pending">
                  <Clock size={14} /> Verification Under Review
                </span>
              )}
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              {currentUser.email} • {currentUser.role}
            </p>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', fontSize: '0.8rem', color: '#94a3b8' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <GraduationCap size={14} color="#60a5fa" />
                GTU Enrollment: <strong>{currentUser.gtuEnrollment || 'N/A'}</strong>
              </span>
              <span>•</span>
              <span>Batch {currentUser.batchYear || 'N/A'}</span>
              <span>•</span>
              <span>{currentUser.degree || 'B.E.'} ({currentUser.branch || 'Eng'})</span>
            </div>
          </div>
        </div>

        {/* Institution Stamp */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid var(--border-color)',
            borderRadius: 12,
            padding: '1rem 1.5rem',
            textAlign: 'right',
          }}
        >
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Affiliated Institute
          </div>
          <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc' }}>
            {currentUser.collegeId?.name || 'L.D. College of Engineering'}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#38bdf8' }}>
            Affiliated to Gujarat Technological University (GTU)
          </div>
        </div>
      </div>

      {successMsg && (
        <div
          style={{
            background: 'rgba(16, 185, 129, 0.2)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            color: '#34d399',
            padding: '0.75rem 1.25rem',
            borderRadius: 8,
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <CheckCircle2 size={16} /> {successMsg}
        </div>
      )}

      {/* Main Profile Edit Form */}
      <div className="glass-panel" style={{ padding: '2rem' }}>
        <h3 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', fontWeight: 600 }}>
          Professional Background & Mentorship Status
        </h3>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            <div className="form-group">
              <label className="form-label">Professional Headline</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Senior Software Engineer at TCS | Cloud Architect"
                value={formData.headline}
                onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Current Company / Organization</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Tata Consultancy Services"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Designation / Role</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Senior Software Engineer"
                value={formData.designation}
                onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Industry Domain</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Information Technology & Services"
                value={formData.industry}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Location (City, State)</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Ahmedabad, Gujarat"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Technical & Professional Skills (comma-separated)</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. React, Node.js, Cloud Architecture, Python, System Design"
                value={formData.skills}
                onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">LinkedIn Profile URL</label>
              <input
                type="text"
                className="form-input"
                placeholder="https://linkedin.com/in/username"
                value={formData.linkedinUrl}
                onChange={(e) => setFormData({ ...formData, linkedinUrl: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">GitHub / Portfolio URL</label>
              <input
                type="text"
                className="form-input"
                placeholder="https://github.com/username"
                value={formData.githubUrl}
                onChange={(e) => setFormData({ ...formData, githubUrl: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginTop: '0.5rem' }}>
            <label className="form-label">Bio & College Experience</label>
            <textarea
              className="form-textarea"
              rows={3}
              placeholder="Tell fellow alumni and current students about your journey..."
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            />
          </div>

          {/* Mentorship Toggle */}
          <div
            style={{
              background: 'rgba(59, 130, 246, 0.08)',
              border: '1px solid rgba(59, 130, 246, 0.25)',
              borderRadius: 10,
              padding: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1.75rem',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
                <Sparkles size={18} color="#60a5fa" />
                Available to Mentor GTU Students
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                When enabled, your profile will appear with a high match score for students seeking guidance in {currentUser.branch || 'your branch'}.
              </p>
            </div>
            <label style={{ position: 'relative', display: 'inline-block', width: 48, height: 26 }}>
              <input
                type="checkbox"
                checked={formData.isMentorAvailable}
                onChange={(e) => setFormData({ ...formData, isMentorAvailable: e.target.checked })}
                style={{ opacity: 0, width: 0, height: 0 }}
              />
              <span
                style={{
                  position: 'absolute',
                  cursor: 'pointer',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: formData.isMentorAvailable ? '#2563eb' : '#334155',
                  borderRadius: 34,
                  transition: '0.2s',
                }}
              >
                <span
                  style={{
                    position: 'absolute',
                    content: '',
                    height: 20,
                    width: 20,
                    left: formData.isMentorAvailable ? 24 : 3,
                    bottom: 3,
                    backgroundColor: 'white',
                    borderRadius: '50%',
                    transition: '0.2s',
                  }}
                />
              </span>
            </label>
          </div>

          <button type="submit" className="btn btn-primary" disabled={saving}>
            <Save size={16} /> {saving ? 'Saving Changes...' : 'Save Profile Changes'}
          </button>
        </form>
      </div>
    </div>
  );
}

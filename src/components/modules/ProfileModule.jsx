import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { api } from '../../services/api.js';
import {
  ShieldCheck,
  Clock,
  GraduationCap,
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
          padding: '2.5rem',
          marginBottom: '2.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '2rem',
          background: 'var(--bg-secondary)',
          border: '2px solid var(--border-color)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <div
            style={{
              width: 88,
              height: 88,
              background: 'var(--accent)',
              color: '#000000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2.5rem',
              fontWeight: 900,
              fontFamily: 'Space Grotesk, sans-serif',
              border: '2px solid #000000',
            }}
          >
            {currentUser.name?.charAt(0) || 'U'}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: '2.2rem', fontWeight: 800, textTransform: 'uppercase' }}>{currentUser.name}</h1>
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
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', textTransform: 'uppercase', fontFamily: 'Space Grotesk, sans-serif' }}>
              {currentUser.email} • {currentUser.role}
            </p>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.75rem', fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <GraduationCap size={15} color="var(--accent)" />
                GTU Enrollment: <strong style={{ color: '#FAFAFA' }}>{currentUser.gtuEnrollment || 'N/A'}</strong>
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
            background: 'var(--bg-primary)',
            border: '2px solid var(--border-color)',
            padding: '1.25rem 1.75rem',
            textAlign: 'right',
          }}
        >
          <div style={{ fontSize: '0.7rem', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 800 }}>
            Affiliated Institute
          </div>
          <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#FAFAFA', textTransform: 'uppercase', marginTop: 2 }}>
            {currentUser.collegeId?.name || 'L.D. College of Engineering'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: 4 }}>
            Gujarat Technological University (GTU)
          </div>
        </div>
      </div>

      {successMsg && (
        <div
          style={{
            background: 'var(--bg-secondary)',
            border: '2px solid var(--accent)',
            color: 'var(--accent)',
            padding: '1rem 1.5rem',
            marginBottom: '2rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontFamily: 'Space Grotesk, sans-serif',
            fontWeight: 800,
            textTransform: 'uppercase',
          }}
        >
          <CheckCircle2 size={18} /> {successMsg}
        </div>
      )}

      {/* Main Profile Edit Form */}
      <div className="glass-panel" style={{ padding: '2.5rem' }}>
        <h3 style={{ fontSize: '1.35rem', marginBottom: '2rem', fontWeight: 800, textTransform: 'uppercase' }}>
          Professional Background & Mentorship Status
        </h3>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
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

          <div className="form-group" style={{ marginTop: '0.75rem' }}>
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
              background: 'var(--bg-secondary)',
              border: '2px solid var(--border-color)',
              padding: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '2rem',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', fontWeight: 800, textTransform: 'uppercase', fontFamily: 'Space Grotesk, sans-serif' }}>
                <Sparkles size={20} color="var(--accent)" />
                Available to Mentor GTU Students
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                When enabled, your profile will appear with a high match score for students seeking guidance in {currentUser.branch || 'your branch'}.
              </p>
            </div>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                cursor: 'pointer',
                fontFamily: 'Space Grotesk, sans-serif',
                fontWeight: 800,
                textTransform: 'uppercase',
                color: formData.isMentorAvailable ? 'var(--accent)' : 'var(--text-muted)',
              }}
            >
              <input
                type="checkbox"
                checked={formData.isMentorAvailable}
                onChange={(e) => setFormData({ ...formData, isMentorAvailable: e.target.checked })}
                style={{ width: 20, height: 20, accentColor: 'var(--accent)' }}
              />
              <span>{formData.isMentorAvailable ? 'ACTIVE' : 'INACTIVE'}</span>
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

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { api } from '../../services/api.js';
import {
  Users,
  Search,
  Building2,
  GraduationCap,
  Briefcase,
  MapPin,
  CheckCircle2,
  Sparkles,
  UserPlus,
  MessageSquare,
  Filter,
} from 'lucide-react';

export default function DirectoryModule({ onStartChat }) {
  const { currentUser, colleges } = useAuth();
  const [alumni, setAlumni] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCollege, setSelectedCollege] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('');
  const [mentorOnly, setMentorOnly] = useState(false);
  const [connectedIds, setConnectedIds] = useState(new Set());

  useEffect(() => {
    loadDirectory();
    loadStats();
  }, [selectedCollege, selectedBranch, selectedBatch, mentorOnly]);

  const loadDirectory = async () => {
    setLoading(true);
    try {
      const filters = {
        q: searchQuery,
        collegeId: selectedCollege,
        branch: selectedBranch,
        batchYear: selectedBatch,
        isMentor: mentorOnly ? 'true' : '',
      };
      const res = await api.directory.search(filters);
      if (res.alumni) {
        setAlumni(res.alumni);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const res = await api.directory.getStats(selectedCollege);
      if (res.stats) {
        setStats(res.stats);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadDirectory();
  };

  const handleConnect = async (recipientId) => {
    try {
      await api.directory.connect(currentUser._id, recipientId);
      setConnectedIds((prev) => new Set([...prev, recipientId]));
    } catch (e) {
      alert('Connection notice: ' + e.message);
    }
  };

  return (
    <div className="page-wrapper animate-fade-in">
      {/* Top Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Registered Alumni</div>
          <div className="stat-val">{stats?.totalAlumni || 1248}</div>
          <div className="stat-trend">Across Gujarat Technical Institutions</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">GTU Verified Records</div>
          <div className="stat-val" style={{ color: '#34d399' }}>
            {stats?.verifiedAlumni || 1180}
          </div>
          <div className="stat-trend">94.5% Identity Trust Score</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Active Alumni Mentors</div>
          <div className="stat-val" style={{ color: '#60a5fa' }}>
            {stats?.activeMentors || 342}
          </div>
          <div className="stat-trend">Ready for Student Guidance</div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        <form onSubmit={handleSearchSubmit}>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ flex: '1 1 280px', position: 'relative' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Search alumni by name, company, technical skill, or keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '2.5rem' }}
              />
              <Search
                size={16}
                color="var(--text-muted)"
                style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }}
              />
            </div>

            <div style={{ flex: '0 1 200px' }}>
              <select
                className="form-select"
                value={selectedCollege}
                onChange={(e) => setSelectedCollege(e.target.value)}
              >
                <option value="">All Institutions</option>
                {colleges.map((col) => (
                  <option key={col._id} value={col._id}>
                    {col.code} - {col.name.split(' ')[0]}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ flex: '0 1 180px' }}>
              <select
                className="form-select"
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
              >
                <option value="">All Branches</option>
                <option value="Computer Engineering">Computer Eng</option>
                <option value="Information Technology">Information Tech</option>
                <option value="Mechanical Engineering">Mechanical Eng</option>
                <option value="Electrical Engineering">Electrical Eng</option>
              </select>
            </div>

            <div style={{ flex: '0 1 140px' }}>
              <select
                className="form-select"
                value={selectedBatch}
                onChange={(e) => setSelectedBatch(e.target.value)}
              >
                <option value="">All Batches</option>
                <option value="2023">2023</option>
                <option value="2022">2022</option>
                <option value="2021">2021</option>
                <option value="2020">2020</option>
                <option value="2019">2019</option>
                <option value="2018">2018</option>
              </select>
            </div>

            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.85rem',
                cursor: 'pointer',
                color: mentorOnly ? '#60a5fa' : 'var(--text-muted)',
              }}
            >
              <input
                type="checkbox"
                checked={mentorOnly}
                onChange={(e) => setMentorOnly(e.target.checked)}
              />
              <Sparkles size={16} /> Mentors Only
            </label>

            <button type="submit" className="btn btn-primary" style={{ padding: '0.65rem 1.25rem' }}>
              Filter
            </button>
          </div>
        </form>
      </div>

      {/* Alumni Cards Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          Searching Gujarat state alumni directory...
        </div>
      ) : alumni.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
          <Users size={40} style={{ margin: '0 auto 1rem', display: 'block', opacity: 0.5 }} />
          <h3>No alumni matched your current filter criteria</h3>
          <p style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>
            Try expanding your search query or selecting "All Institutions".
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {alumni.map((alumnus) => {
            const isUserVerified = alumnus.verificationStatus === 'VERIFIED';
            const profile = alumnus.profile || {};
            const isConnected = connectedIds.has(alumnus._id);

            return (
              <div
                key={alumnus._id}
                className="glass-panel"
                style={{
                  padding: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  position: 'relative',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', gap: '0.85rem' }}>
                      <div
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #1e3a8a, #0d9488)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '1.1rem',
                        }}
                      >
                        {alumnus.name?.charAt(0)}
                      </div>
                      <div>
                        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          {alumnus.name}
                          {isUserVerified && (
                            <CheckCircle2 size={15} color="#10b981" title="GTU Verified" />
                          )}
                        </h3>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {profile.designation || 'Alumnus'} {profile.company && `@ ${profile.company}`}
                        </p>
                      </div>
                    </div>

                    {profile.isMentorAvailable && (
                      <span className="badge badge-referral" title="Available for mentorship">
                        <Sparkles size={12} /> MENTOR
                      </span>
                    )}
                  </div>

                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
                      <Building2 size={14} color="#60a5fa" />
                      <span>{alumnus.collegeId?.name || 'GTU Engineering College'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <GraduationCap size={14} color="#a78bfa" />
                      <span>
                        {alumnus.degree || 'B.E.'} • {alumnus.branch} (Class of {alumnus.batchYear})
                      </span>
                    </div>
                  </div>

                  {profile.headline && (
                    <p style={{ fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '1rem', fontStyle: 'italic' }}>
                      "{profile.headline}"
                    </p>
                  )}

                  {profile.skills && profile.skills.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '1.25rem' }}>
                      {profile.skills.slice(0, 4).map((sk, idx) => (
                        <span
                          key={idx}
                          style={{
                            fontSize: '0.7rem',
                            background: 'rgba(255, 255, 255, 0.05)',
                            padding: '0.15rem 0.5rem',
                            borderRadius: 4,
                            color: '#94a3b8',
                          }}
                        >
                          {sk}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                  <button
                    onClick={() => handleConnect(alumnus._id)}
                    className="btn btn-secondary btn-sm"
                    style={{ flex: 1 }}
                    disabled={isConnected}
                  >
                    <UserPlus size={14} /> {isConnected ? 'Connected' : 'Connect'}
                  </button>
                  <button
                    onClick={() => onStartChat && onStartChat(alumnus)}
                    className="btn btn-primary btn-sm"
                    style={{ flex: 1 }}
                  >
                    <MessageSquare size={14} /> Message
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

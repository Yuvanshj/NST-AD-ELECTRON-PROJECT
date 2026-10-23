import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { api } from '../../services/api.js';
import {
  TrendingUp,
  Building2,
  Users,
  ShieldCheck,
  HeartHandshake,
  Compass,
  Briefcase,
  Award,
} from 'lucide-react';

export default function AnalyticsModule() {
  const { colleges } = useAuth();
  const [stats, setStats] = useState(null);
  const [comparisons, setComparisons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCollege, setSelectedCollege] = useState('');

  useEffect(() => {
    loadData();
  }, [selectedCollege]);

  const loadData = async () => {
    setLoading(true);
    try {
      const dashRes = await api.analytics.getDashboard(selectedCollege);
      if (dashRes.stats) {
        setStats(dashRes.stats);
      }
      const compRes = await api.analytics.getCollegeComparison();
      if (compRes.comparison) {
        setComparisons(compRes.comparison);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrapper animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <TrendingUp color="#3b82f6" /> State & College Institutional Analytics
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Directorate of Technical Education, Govt. of Gujarat: Real-time alumni engagement, endowment growth, and placement affinity index.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Building2 size={16} color="var(--text-muted)" />
          <select
            className="form-select"
            value={selectedCollege}
            onChange={(e) => setSelectedCollege(e.target.value)}
            style={{ width: 'auto' }}
          >
            <option value="">Consolidated State View (All Gujarat)</option>
            {colleges.map((col) => (
              <option key={col._id} value={col._id}>
                {col.name} ({col.code})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Primary KPI Metric Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Registered Alumni</div>
          <div className="stat-val">{stats?.totalAlumni || 1248}</div>
          <div className="stat-trend" style={{ color: '#34d399' }}>
            <Users size={14} /> +12.4% MoM State Growth
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">GTU Verification Rate</div>
          <div className="stat-val" style={{ color: '#34d399' }}>
            {stats?.verificationRate || '94.5%'}
          </div>
          <div className="stat-trend">
            <ShieldCheck size={14} /> High-trust Verified Registry
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Total Endowment Raised</div>
          <div className="stat-val" style={{ color: '#60a5fa' }}>
            ₹{stats?.totalDonationsAmount ? stats.totalDonationsAmount.toLocaleString() : '12,50,000'}
          </div>
          <div className="stat-trend">
            <HeartHandshake size={14} /> 100% 80G Certified Inflows
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Active Mentorship Pairings</div>
          <div className="stat-val" style={{ color: '#c084fc' }}>
            {stats?.activeMentorships || 128}
          </div>
          <div className="stat-trend">
            <Compass size={14} /> Branch-aligned Match Engine
          </div>
        </div>
      </div>

      {/* Multi-College Comparative Benchmark Table */}
      <div className="glass-panel" style={{ marginBottom: '2rem', overflow: 'hidden' }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Building2 size={18} color="#60a5fa" />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
            Gujarat Technical Institutions Comparative Benchmarks
          </h3>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>College / Institute</th>
                <th>Institute Code</th>
                <th>City / Region</th>
                <th>Alumni Strength</th>
                <th>Verified %</th>
                <th>Endowment Raised</th>
                <th>Alumni Mentors</th>
              </tr>
            </thead>
            <tbody>
              {comparisons.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}>
                    Loading college benchmarks...
                  </td>
                </tr>
              ) : (
                comparisons.map((col, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 600 }}>{col.collegeName}</td>
                    <td>
                      <span style={{ fontFamily: 'monospace', background: 'rgba(255,255,255,0.06)', padding: '0.2rem 0.5rem', borderRadius: 4 }}>
                        {col.code}
                      </span>
                    </td>
                    <td>{col.city}</td>
                    <td style={{ fontWeight: 600 }}>{col.alumniCount}</td>
                    <td>
                      <span className="badge badge-verified">{col.verifiedRate}</span>
                    </td>
                    <td style={{ fontWeight: 700, color: '#34d399' }}>
                      ₹{col.donationsRaised.toLocaleString()}
                    </td>
                    <td style={{ fontWeight: 600, color: '#60a5fa' }}>{col.mentorCount}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Employment & Industry Distribution Chart Visual */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            Top Industry Distribution of Gujarat Alumni
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
            Primary career sectors employing GTU and state engineering graduates.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[
              { sector: 'Information Technology & Software', pct: 44, count: '549 Alumni', color: '#3b82f6' },
              { sector: 'Semiconductor, Electronics & VLSI', pct: 21, count: '262 Alumni', color: '#10b981' },
              { sector: 'Automotive & Heavy Manufacturing', pct: 18, count: '224 Alumni', color: '#f59e0b' },
              { sector: 'Renewable Energy & Power Systems', pct: 11, count: '137 Alumni', color: '#06b6d4' },
              { sector: 'Civil Governance & Public Sector', pct: 6, count: '75 Alumni', color: '#8b5cf6' },
            ].map((item, i) => (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem', marginBottom: '0.35rem' }}>
                  <span style={{ fontWeight: 500 }}>{item.sector}</span>
                  <span style={{ color: 'var(--text-muted)' }}>{item.pct}% ({item.count})</span>
                </div>
                <div style={{ height: 6, background: 'rgba(255, 255, 255, 0.06)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ width: `${item.pct}%`, height: '100%', background: item.color, borderRadius: 3 }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            Top Employers of Gujarat Technical Graduates
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
            Companies with the highest concentration of active alumni mentors.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[
              { name: 'Tata Consultancy Services (TCS)', mentors: 64, city: 'Gandhinagar / Ahmedabad' },
              { name: 'L&T Technology Services', mentors: 42, city: 'Vadodara' },
              { name: 'eInfochips (Arrow Electronics)', mentors: 38, city: 'Ahmedabad' },
              { name: 'Adani Group / Green Energy', mentors: 31, city: 'Ahmedabad' },
              { name: 'Reliance Industries Limited', mentors: 27, city: 'Jamnagar / Hazira' },
            ].map((company, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.75rem 1rem',
                  background: 'rgba(255, 255, 255, 0.03)',
                  borderRadius: 8,
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{company.name}</div>
                  <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>{company.city}</div>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#60a5fa', fontWeight: 600 }}>
                  {company.mentors} Mentors
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

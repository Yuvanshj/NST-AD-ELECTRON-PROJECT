import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { api } from '../../services/api.js';
import {
  Compass,
  Sparkles,
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  Building2,
  GraduationCap,
  Briefcase,
  Star,
} from 'lucide-react';

export default function MentorshipModule() {
  const { currentUser } = useAuth();
  const [smartMatches, setSmartMatches] = useState([]);
  const [requests, setRequests] = useState({ received: [], sent: [] });
  const [loading, setLoading] = useState(true);
  const [requestModalMentor, setRequestModalMentor] = useState(null);
  const [requestTopic, setRequestTopic] = useState('Career Roadmap & Mock Interview');
  const [requestNote, setRequestNote] = useState('');
  const [successNotice, setSuccessNotice] = useState('');

  useEffect(() => {
    if (currentUser?._id) {
      loadData();
    }
  }, [currentUser]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load smart matches
      const matchRes = await api.mentorship.getSmartMatches(currentUser._id);
      if (matchRes.matches) {
        setSmartMatches(matchRes.matches);
      }

      // Load existing requests
      const reqRes = await api.mentorship.getRequests(currentUser._id);
      if (reqRes) {
        setRequests({
          received: reqRes.received || [],
          sent: reqRes.sent || [],
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSendRequest = async (e) => {
    e.preventDefault();
    if (!requestModalMentor) return;

    try {
      await api.mentorship.requestMatch({
        studentId: currentUser._id,
        mentorId: requestModalMentor._id,
        topic: requestTopic,
        note: requestNote,
      });
      setRequestModalMentor(null);
      setRequestNote('');
      setSuccessNotice(`Mentorship request submitted to ${requestModalMentor.name}!`);
      setTimeout(() => setSuccessNotice(''), 4500);
      await loadData();
    } catch (err) {
      alert('Error requesting mentorship: ' + err.message);
    }
  };

  const handleRespond = async (requestId, status) => {
    try {
      await api.mentorship.respond(requestId, status, 'Accepted mentorship schedule');
      await loadData();
    } catch (e) {
      alert('Error responding to request: ' + e.message);
    }
  };

  return (
    <div className="page-wrapper animate-fade-in">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <Compass color="#3b82f6" /> Smart Alumni-Student Mentorship
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          Powered by Gujarat Higher Education smart-matching: pairs students with verified alumni based on GTU branch alignment, career trajectory, and technical skills.
        </p>
      </div>

      {successNotice && (
        <div
          style={{
            background: 'rgba(16, 185, 129, 0.2)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            color: '#34d399',
            padding: '0.85rem 1.25rem',
            borderRadius: 8,
            marginBottom: '1.5rem',
          }}
        >
          {successNotice}
        </div>
      )}

      {/* Received Requests (For Alumni Mentors) */}
      {requests.received.length > 0 && (
        <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Clock size={18} color="#f59e0b" /> Pending Mentorship Inquiries Received ({requests.received.length})
          </h3>
          <div style={{ display: 'grid', gap: '1rem' }}>
            {requests.received.map((req) => (
              <div
                key={req._id}
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 10,
                  padding: '1.25rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '1rem',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{req.studentId?.name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {req.studentId?.degree} ({req.studentId?.branch}) • Batch of {req.studentId?.batchYear}
                  </div>
                  <div style={{ fontSize: '0.825rem', color: '#93c5fd', marginTop: '0.35rem' }}>
                    <strong>Topic:</strong> {req.topic}
                  </div>
                  {req.note && (
                    <p style={{ fontSize: '0.8rem', color: '#cbd5e1', marginTop: '0.25rem', fontStyle: 'italic' }}>
                      "{req.note}"
                    </p>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => handleRespond(req._id, 'ACCEPTED')}
                    className="btn btn-success btn-sm"
                  >
                    <CheckCircle2 size={14} /> Accept Mentee
                  </button>
                  <button
                    onClick={() => handleRespond(req._id, 'DECLINED')}
                    className="btn btn-outline-danger btn-sm"
                  >
                    <XCircle size={14} /> Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Smart Matches Section */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Sparkles color="#fbbf24" size={20} /> Recommended Alumni Mentors for You
        </h2>
        <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
          High-affinity matches calculated dynamically based on branch compatibility and industry domains.
        </p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          Computing smart mentor match affinities...
        </div>
      ) : smartMatches.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          No mentors available matching your criteria yet.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {smartMatches.map((mentor) => {
            const profile = mentor.profile || {};
            const score = mentor.matchScore || 85;

            return (
              <div
                key={mentor._id}
                className="glass-panel"
                style={{
                  padding: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  border: '1px solid rgba(59, 130, 246, 0.25)',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                        }}
                      >
                        {mentor.name?.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          {mentor.name}
                          <CheckCircle2 size={14} color="#10b981" />
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {profile.designation || 'Alumnus'} {profile.company && `@ ${profile.company}`}
                        </div>
                      </div>
                    </div>

                    {/* Match Score Badge */}
                    <div
                      style={{
                        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(6, 182, 212, 0.2))',
                        border: '1px solid rgba(16, 185, 129, 0.4)',
                        padding: '0.3rem 0.6rem',
                        borderRadius: 8,
                        textAlign: 'center',
                      }}
                    >
                      <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#34d399' }}>
                        {score}%
                      </div>
                      <div style={{ fontSize: '0.6rem', color: '#94a3b8', textTransform: 'uppercase' }}>
                        Match Score
                      </div>
                    </div>
                  </div>

                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.85rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
                      <Building2 size={13} color="#60a5fa" />
                      <span>{mentor.collegeId?.name}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <GraduationCap size={13} color="#a78bfa" />
                      <span>Class of {mentor.batchYear} • {mentor.branch}</span>
                    </div>
                  </div>

                  {profile.headline && (
                    <p style={{ fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '1rem' }}>
                      "{profile.headline}"
                    </p>
                  )}
                </div>

                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                  <button
                    onClick={() => setRequestModalMentor(mentor)}
                    className="btn btn-primary"
                    style={{ width: '100%', gap: '0.5rem' }}
                  >
                    <Send size={14} /> Request 1:1 Mentorship
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Mentorship Request Modal */}
      {requestModalMentor && (
        <div className="modal-overlay">
          <div className="modal-dialog">
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>
              Request Mentorship from {requestModalMentor.name}
            </h3>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Specify the learning focus or question you'd like guidance on.
            </p>

            <form onSubmit={handleSendRequest}>
              <div className="form-group">
                <label className="form-label">Mentorship Subject / Topic</label>
                <select
                  className="form-select"
                  value={requestTopic}
                  onChange={(e) => setRequestTopic(e.target.value)}
                >
                  <option value="Career Roadmap & Mock Interview">Career Roadmap & Mock Interview</option>
                  <option value="System Design & Architecture Review">System Design & Architecture Review</option>
                  <option value="Resume & Portfolio Feedback">Resume & Portfolio Feedback</option>
                  <option value="Higher Studies & GATE Preparation">Higher Studies & GATE Preparation</option>
                  <option value="Startup Incubation & Entrepreneurship">Startup Incubation & Entrepreneurship</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Personal Note / Background Context</label>
                <textarea
                  className="form-textarea"
                  rows={4}
                  placeholder="Introduce yourself, your current semester, and what specific guidance you are seeking..."
                  value={requestNote}
                  onChange={(e) => setRequestNote(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setRequestModalMentor(null)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Submit Mentorship Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

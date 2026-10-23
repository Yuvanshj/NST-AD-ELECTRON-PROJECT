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
      const matchRes = await api.mentorship.getSmartMatches(currentUser._id);
      if (matchRes.matches) {
        setSmartMatches(matchRes.matches);
      }

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
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <span>Smart Alumni-Student Mentorship</span>
          <span className="badge badge-referral" style={{ fontSize: '0.8rem' }}>AI MATCH ENGINE</span>
        </h1>
        <p style={{ marginTop: '0.5rem', fontSize: '1.05rem', maxWidth: '75ch' }}>
          Pairs students with verified GTU alumni based on academic branch alignment, career trajectory, and technical skills.
        </p>
      </div>

      {successNotice && (
        <div
          style={{
            background: 'var(--bg-secondary)',
            border: '2px solid var(--accent)',
            color: 'var(--accent)',
            padding: '1.25rem 1.75rem',
            marginBottom: '2rem',
            fontFamily: 'Space Grotesk, sans-serif',
            fontWeight: 800,
            textTransform: 'uppercase',
          }}
        >
          {successNotice}
        </div>
      )}

      {/* Received Requests (For Alumni Mentors) */}
      {requests.received.length > 0 && (
        <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2.5rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <Clock size={20} color="var(--accent)" /> Pending Mentorship Inquiries Received ({requests.received.length})
          </h3>
          <div style={{ display: 'grid', gap: '1.25rem' }}>
            {requests.received.map((req) => (
              <div
                key={req._id}
                style={{
                  background: 'var(--bg-secondary)',
                  border: '2px solid var(--border-color)',
                  padding: '1.5rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '1.25rem',
                }}
              >
                <div>
                  <div style={{ fontWeight: 800, fontSize: '1.1rem', textTransform: 'uppercase', color: '#FAFAFA' }}>{req.studentId?.name}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: 2 }}>
                    {req.studentId?.degree} ({req.studentId?.branch}) • Batch of {req.studentId?.batchYear}
                  </div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--accent)', marginTop: '0.5rem', fontWeight: 700, textTransform: 'uppercase' }}>
                    <strong>Topic:</strong> {req.topic}
                  </div>
                  {req.note && (
                    <p style={{ fontSize: '0.85rem', color: '#FAFAFA', marginTop: '0.4rem', fontStyle: 'italic' }}>
                      "{req.note}"
                    </p>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    onClick={() => handleRespond(req._id, 'ACCEPTED')}
                    className="btn btn-primary btn-sm"
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
      <div style={{ marginBottom: '1.75rem' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.65rem', textTransform: 'uppercase' }}>
          <Sparkles color="var(--accent)" size={22} /> Recommended Alumni Mentors for You
        </h2>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          High-affinity matches calculated dynamically based on branch compatibility and industry domains.
        </p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
          Computing smart mentor match affinities...
        </div>
      ) : smartMatches.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
          No mentors available matching your criteria yet.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.75rem' }}>
          {smartMatches.map((mentor) => {
            const profile = mentor.profile || {};
            const score = mentor.matchScore || 85;

            return (
              <div
                key={mentor._id}
                className="glass-panel interactive"
                style={{
                  padding: '2rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      <div
                        style={{
                          width: 48,
                          height: 48,
                          background: 'var(--accent)',
                          color: '#000000',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 900,
                          fontSize: '1.2rem',
                          fontFamily: 'Space Grotesk, sans-serif',
                          border: '2px solid #000000',
                        }}
                      >
                        {mentor.name?.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.45rem', textTransform: 'uppercase', color: '#FAFAFA' }}>
                          <span>{mentor.name}</span>
                          <CheckCircle2 size={15} color="#10b981" />
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--accent)', fontWeight: 700, textTransform: 'uppercase', marginTop: 2 }}>
                          {profile.designation || 'Alumnus'} {profile.company && `@ ${profile.company}`}
                        </div>
                      </div>
                    </div>

                    {/* Match Score Badge */}
                    <div
                      style={{
                        background: 'var(--bg-secondary)',
                        border: '2px solid var(--accent)',
                        padding: '0.35rem 0.75rem',
                        textAlign: 'center',
                      }}
                    >
                      <div style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--accent)', fontFamily: 'Space Grotesk, sans-serif' }}>
                        {score}%
                      </div>
                      <div style={{ fontSize: '0.62rem', color: '#FAFAFA', textTransform: 'uppercase', fontWeight: 700 }}>
                        Match Score
                      </div>
                    </div>
                  </div>

                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)', padding: '0.85rem 0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.3rem' }}>
                      <Building2 size={14} color="var(--accent)" />
                      <span>{mentor.collegeId?.name}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <GraduationCap size={14} color="var(--text-main)" />
                      <span>Class of {mentor.batchYear} • {mentor.branch}</span>
                    </div>
                  </div>

                  {profile.headline && (
                    <p style={{ fontSize: '0.85rem', color: '#FAFAFA', marginBottom: '1.25rem', fontStyle: 'italic' }}>
                      "{profile.headline}"
                    </p>
                  )}
                </div>

                <div style={{ borderTop: '2px solid var(--border-color)', paddingTop: '1.25rem' }}>
                  <button
                    onClick={() => setRequestModalMentor(mentor)}
                    className="btn btn-primary"
                    style={{ width: '100%', gap: '0.5rem' }}
                  >
                    <Send size={15} /> Request 1:1 Mentorship
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
            <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
              Request Mentorship: {requestModalMentor.name}
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.75rem' }}>
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

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
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

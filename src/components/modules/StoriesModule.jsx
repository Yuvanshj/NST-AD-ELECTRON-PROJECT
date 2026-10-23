import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { api } from '../../services/api.js';
import {
  Sparkles,
  Award,
  Plus,
  Building2,
  GraduationCap,
  CheckCircle2,
  Share2,
} from 'lucide-react';

export default function StoriesModule() {
  const { currentUser, colleges } = useAuth();
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [storyForm, setStoryForm] = useState({
    title: '',
    category: 'ENTREPRENEURSHIP',
    summary: '',
    content: '',
    metrics: '',
  });
  const [successNotice, setSuccessNotice] = useState('');

  useEffect(() => {
    loadStories();
  }, []);

  const loadStories = async () => {
    setLoading(true);
    try {
      const res = await api.stories.getAll();
      if (res.stories) {
        setStories(res.stories);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.stories.create({
        ...storyForm,
        alumniId: currentUser._id,
        collegeId: currentUser.collegeId?._id || (colleges[0] ? colleges[0]._id : null),
      });
      setShowSubmitModal(false);
      setSuccessNotice('Story submitted for editorial review!');
      setTimeout(() => setSuccessNotice(''), 4000);
      await loadStories();
    } catch (err) {
      alert('Error submitting story: ' + err.message);
    }
  };

  return (
    <div className="page-wrapper animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <Sparkles color="#fbbf24" /> Alumni Hall of Fame & Success Stories
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Inspiring the next generation: Celebrating Gujarat state graduates excelling in innovation, civil governance, and global enterprise.
          </p>
        </div>

        <button onClick={() => setShowSubmitModal(true)} className="btn btn-primary" style={{ gap: '0.5rem' }}>
          <Plus size={16} /> Share Your Milestone
        </button>
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

      {/* Stories Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          Loading Gujarat alumni spotlights...
        </div>
      ) : stories.length === 0 ? (
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          No published spotlights yet. Be the first to submit a story!
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.75rem' }}>
          {stories.map((story) => (
            <div
              key={story._id}
              className="glass-panel"
              style={{
                padding: '1.75rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                background: 'linear-gradient(135deg, rgba(16, 25, 46, 0.85) 0%, rgba(30, 41, 59, 0.6) 100%)',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span className="badge badge-primary">{story.category}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {story.collegeId?.name}
                  </span>
                </div>

                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', lineHeight: 1.3 }}>
                  {story.title}
                </h3>

                <p style={{ fontSize: '0.875rem', color: '#cbd5e1', marginBottom: '1.25rem', lineHeight: 1.5 }}>
                  {story.summary}
                </p>

                {story.metrics && (
                  <div
                    style={{
                      background: 'rgba(59, 130, 246, 0.1)',
                      border: '1px solid rgba(59, 130, 246, 0.25)',
                      borderRadius: 8,
                      padding: '0.65rem 1rem',
                      marginBottom: '1.25rem',
                      fontSize: '0.8rem',
                      color: '#93c5fd',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    <Award size={16} color="#60a5fa" />
                    <strong>Impact Metric:</strong> {story.metrics}
                  </div>
                )}
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  borderTop: '1px solid var(--border-color)',
                  paddingTop: '1rem',
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    background: '#2563eb',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                  }}
                >
                  {story.alumniId?.name?.charAt(0) || 'A'}
                </div>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    {story.alumniId?.name}
                    <CheckCircle2 size={13} color="#10b981" />
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    Class of {story.alumniId?.batchYear} • {story.alumniId?.branch}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Submit Story Modal */}
      {showSubmitModal && (
        <div className="modal-overlay">
          <div className="modal-dialog">
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Submit Alumni Milestone</h3>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Share your startup launch, patent grant, civil service qualification, or corporate leadership promotion.
            </p>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Story Headline / Title</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Scaling a FinTech Venture from Gandhinagar to $10M ARR"
                  value={storyForm.title}
                  onChange={(e) => setStoryForm({ ...storyForm, title: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select
                    className="form-select"
                    value={storyForm.category}
                    onChange={(e) => setStoryForm({ ...storyForm, category: e.target.value })}
                  >
                    <option value="ENTREPRENEURSHIP">Startup & Entrepreneurship</option>
                    <option value="CAREER">Corporate Leadership</option>
                    <option value="RESEARCH">Scientific & Patent Research</option>
                    <option value="SOCIAL_IMPACT">Public Service & Governance</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Key Metric / Milestone</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Raised $2M Seed or AIR 42 in UPSC"
                    value={storyForm.metrics}
                    onChange={(e) => setStoryForm({ ...storyForm, metrics: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Executive Summary</label>
                <textarea
                  className="form-textarea"
                  rows={2}
                  placeholder="A concise 2-sentence snapshot of this journey..."
                  value={storyForm.summary}
                  onChange={(e) => setStoryForm({ ...storyForm, summary: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Full Narrative & Advice for GTU Students</label>
                <textarea
                  className="form-textarea"
                  rows={5}
                  placeholder="Describe challenges faced during early semesters, lessons learned, and key advice for current students..."
                  value={storyForm.content}
                  onChange={(e) => setStoryForm({ ...storyForm, content: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" onClick={() => setShowSubmitModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Submit for Editorial Publication
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

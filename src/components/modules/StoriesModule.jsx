import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { api } from '../../services/api.js';
import {
  Sparkles,
  Award,
  Plus,
  CheckCircle2,
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1.5rem' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <span>Hall of Fame & Alumni Stories</span>
            <span className="badge badge-referral" style={{ fontSize: '0.8rem' }}>SPOTLIGHTS</span>
          </h1>
          <p style={{ marginTop: '0.5rem', fontSize: '1.05rem', maxWidth: '75ch' }}>
            Celebrating Gujarat state graduates excelling in deep tech innovation, civil governance, and global enterprise.
          </p>
        </div>

        <button onClick={() => setShowSubmitModal(true)} className="btn btn-primary" style={{ gap: '0.5rem' }}>
          <Plus size={16} /> Share Your Milestone
        </button>
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

      {/* Stories Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
          Loading Gujarat alumni spotlights...
        </div>
      ) : stories.length === 0 ? (
        <div className="glass-panel" style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          No published spotlights yet. Be the first to submit a story!
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '2rem' }}>
          {stories.map((story) => (
            <div
              key={story._id}
              className="glass-panel interactive"
              style={{
                padding: '2.25rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <span className="badge badge-referral">{story.category}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                    {story.collegeId?.name}
                  </span>
                </div>

                <h3 style={{ fontSize: '1.35rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.75rem', lineHeight: 1.25 }}>
                  {story.title}
                </h3>

                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
                  {story.summary}
                </p>

                {story.metrics && (
                  <div
                    style={{
                      background: 'var(--bg-secondary)',
                      border: '2px solid var(--accent)',
                      padding: '0.85rem 1.15rem',
                      marginBottom: '1.5rem',
                      fontSize: '0.85rem',
                      color: 'var(--accent)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.65rem',
                      fontFamily: 'Space Grotesk, sans-serif',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                    }}
                  >
                    <Award size={18} color="var(--accent)" />
                    <span>Impact Metric: {story.metrics}</span>
                  </div>
                )}
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  borderTop: '2px solid var(--border-color)',
                  paddingTop: '1.25rem',
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    background: 'var(--accent)',
                    color: '#000000',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 900,
                    fontSize: '1.1rem',
                    fontFamily: 'Space Grotesk, sans-serif',
                    border: '2px solid #000000',
                  }}
                >
                  {story.alumniId?.name?.charAt(0) || 'A'}
                </div>
                <div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 800, textTransform: 'uppercase', color: '#FAFAFA', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span>{story.alumniId?.name}</span>
                    <CheckCircle2 size={14} color="#10b981" />
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
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
            <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Submit Alumni Milestone</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.75rem' }}>
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
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
                  placeholder="A concise snapshot of this journey..."
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

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
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

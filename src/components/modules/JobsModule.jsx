import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { api } from '../../services/api.js';
import {
  Briefcase,
  MapPin,
  Sparkles,
  Plus,
  Send,
} from 'lucide-react';

export default function JobsModule() {
  const { currentUser, colleges } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState(null);
  const [showPostModal, setShowPostModal] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(null);
  const [referralOnly, setReferralOnly] = useState(false);
  const [applyForm, setApplyForm] = useState({ resumeUrl: '', coverLetter: '', requestReferral: true });
  const [applySuccess, setApplySuccess] = useState('');

  const [jobForm, setJobForm] = useState({
    title: '',
    company: '',
    location: '',
    jobType: 'FULL_TIME',
    experienceLevel: 'MID',
    salaryRange: '',
    description: '',
    skillsRequired: '',
    isReferralAvailable: true,
  });

  useEffect(() => {
    loadJobs();
  }, [referralOnly]);

  const loadJobs = async () => {
    setLoading(true);
    try {
      const filters = {};
      if (referralOnly) filters.hasReferral = 'true';
      const res = await api.jobs.getAll(filters);
      if (res.jobs) {
        setJobs(res.jobs);
        if (res.jobs.length > 0 && !selectedJob) {
          setSelectedJob(res.jobs[0]);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (e) => {
    e.preventDefault();
    if (!showApplyModal) return;

    try {
      await api.jobs.apply({
        jobId: showApplyModal._id,
        applicantId: currentUser._id,
        resumeUrl: applyForm.resumeUrl,
        coverLetter: applyForm.coverLetter,
        requestReferral: applyForm.requestReferral,
      });

      setShowApplyModal(null);
      setApplySuccess(`Application & Referral Request sent to ${showApplyModal.postedBy?.name || 'Alumnus'}!`);
      setTimeout(() => setApplySuccess(''), 5000);
    } catch (err) {
      alert('Application failed: ' + err.message);
    }
  };

  const handleCreateJob = async (e) => {
    e.preventDefault();
    try {
      await api.jobs.create({
        ...jobForm,
        postedBy: currentUser._id,
        collegeId: currentUser.collegeId?._id || (colleges[0] ? colleges[0]._id : null),
        skillsRequired: jobForm.skillsRequired.split(',').map((s) => s.trim()).filter(Boolean),
      });

      setShowPostModal(false);
      setJobForm({
        title: '',
        company: '',
        location: '',
        jobType: 'FULL_TIME',
        experienceLevel: 'MID',
        salaryRange: '',
        description: '',
        skillsRequired: '',
        isReferralAvailable: true,
      });
      await loadJobs();
      setApplySuccess('Job opportunity posted to Gujarat State Alumni Network!');
      setTimeout(() => setApplySuccess(''), 4000);
    } catch (err) {
      alert('Error creating job: ' + err.message);
    }
  };

  return (
    <div className="page-wrapper animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1.5rem' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <span>Careers & Internal Referrals</span>
            <span className="badge badge-referral" style={{ fontSize: '0.8rem' }}>GTU PIPELINE</span>
          </h1>
          <p style={{ marginTop: '0.5rem', fontSize: '1.05rem', maxWidth: '75ch' }}>
            Exclusive openings shared by GTU alumni. Request verified internal employee referrals to accelerate hiring.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              fontSize: '0.85rem',
              cursor: 'pointer',
              color: referralOnly ? 'var(--accent)' : 'var(--text-muted)',
              fontFamily: 'Space Grotesk, sans-serif',
              textTransform: 'uppercase',
              fontWeight: 700,
              letterSpacing: '0.04em',
              userSelect: 'none',
            }}
          >
            <input
              type="checkbox"
              checked={referralOnly}
              onChange={(e) => setReferralOnly(e.target.checked)}
              style={{ width: 16, height: 16, accentColor: 'var(--accent)' }}
            />
            <Sparkles size={16} /> Alumni Referral Only
          </label>

          <button onClick={() => setShowPostModal(true)} className="btn btn-primary" style={{ gap: '0.5rem' }}>
            <Plus size={16} /> Post Opportunity
          </button>
        </div>
      </div>

      {applySuccess && (
        <div
          style={{
            background: 'rgba(223, 225, 4, 0.12)',
            border: '2px solid var(--accent)',
            color: 'var(--accent)',
            padding: '1.25rem 1.75rem',
            marginBottom: '2rem',
            fontFamily: 'Space Grotesk, sans-serif',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.03em',
          }}
        >
          {applySuccess}
        </div>
      )}

      {/* Main Split Layout: Job List & Detail View */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(340px, 1fr) minmax(420px, 1.4fr)', gap: '1.75rem' }}>
        {/* Left: Job Cards List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Loading job board...
            </div>
          ) : jobs.length === 0 ? (
            <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              No openings posted yet. Be the first alumnus to post a job!
            </div>
          ) : (
            jobs.map((job) => {
              const isSelected = selectedJob?._id === job._id;
              return (
                <div
                  key={job._id}
                  onClick={() => setSelectedJob(job)}
                  className="glass-panel interactive"
                  style={{
                    padding: '1.75rem',
                    cursor: 'pointer',
                    borderColor: isSelected ? 'var(--accent)' : 'var(--border-color)',
                    background: isSelected ? '#141419' : 'var(--bg-card)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <div>
                      <h3 style={{ fontSize: '1.15rem', fontWeight: 800, textTransform: 'uppercase' }}>{job.title}</h3>
                      <div style={{ fontSize: '0.9rem', color: 'var(--accent)', fontWeight: 700, textTransform: 'uppercase', marginTop: 2 }}>
                        {job.company}
                      </div>
                    </div>
                    {job.isReferralAvailable && (
                      <span className="badge badge-referral" title="Alumni referral available">
                        <Sparkles size={12} /> REFERRAL
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.85rem', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem', textTransform: 'uppercase', fontFamily: 'Space Grotesk, sans-serif' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <MapPin size={14} color="var(--accent)" /> {job.location}
                    </span>
                    <span>•</span>
                    <span>{job.jobType.replace('_', ' ')}</span>
                    {job.salaryRange && (
                      <>
                        <span>•</span>
                        <span style={{ color: '#FAFAFA', fontWeight: 700 }}>{job.salaryRange}</span>
                      </>
                    )}
                  </div>

                  <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', textTransform: 'uppercase' }}>
                    Posted by <strong style={{ color: '#FAFAFA' }}>{job.postedBy?.name || 'Alumnus'}</strong> ({job.postedBy?.collegeId?.code || 'GTU'})
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right: Selected Job Details */}
        <div>
          {selectedJob ? (
            <div className="glass-panel" style={{ padding: '2.5rem', position: 'sticky', top: 'calc(var(--navbar-height) + 2rem)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1.25rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.85rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.4rem' }}>{selectedJob.title}</h2>
                  <div style={{ fontSize: '1.2rem', color: 'var(--accent)', fontWeight: 700, textTransform: 'uppercase' }}>{selectedJob.company}</div>
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '0.75rem', fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    <span><MapPin size={14} style={{ display: 'inline', marginRight: 4, color: 'var(--accent)' }} />{selectedJob.location}</span>
                    <span>•</span>
                    <span>{selectedJob.jobType}</span>
                    <span>•</span>
                    <span style={{ color: '#FAFAFA', fontWeight: 700 }}>{selectedJob.salaryRange || 'Competitive'}</span>
                  </div>
                </div>

                <button
                  onClick={() => setShowApplyModal(selectedJob)}
                  className="btn btn-primary"
                  style={{ gap: '0.5rem', padding: '0.85rem 1.85rem' }}
                >
                  <Send size={16} /> Request Referral & Apply
                </button>
              </div>

              {selectedJob.isReferralAvailable && (
                <div
                  style={{
                    background: 'var(--bg-secondary)',
                    border: '2px solid var(--accent)',
                    padding: '1.25rem 1.5rem',
                    marginBottom: '2rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                  }}
                >
                  <Sparkles color="var(--accent)" size={24} />
                  <div>
                    <div style={{ fontWeight: 800, color: '#FAFAFA', fontSize: '0.95rem', textTransform: 'uppercase', fontFamily: 'Space Grotesk, sans-serif' }}>
                      Internal Alumni Referral Supported
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 2 }}>
                      {selectedJob.postedBy?.name} has pledged to review profiles of GTU graduates and submit their credentials through their company's internal employee referral portal.
                    </div>
                  </div>
                </div>
              )}

              <div style={{ marginBottom: '2rem' }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Role Overview & Responsibilities
                </h4>
                <p style={{ fontSize: '0.95rem', color: '#FAFAFA', lineHeight: 1.7, whiteSpace: 'pre-line' }}>
                  {selectedJob.description}
                </p>
              </div>

              {selectedJob.skillsRequired && selectedJob.skillsRequired.length > 0 && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Required Technical Skills
                  </h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {selectedJob.skillsRequired.map((skill, i) => (
                      <span
                        key={i}
                        style={{
                          background: 'var(--bg-secondary)',
                          border: '1px solid var(--border-color)',
                          padding: '0.4rem 0.85rem',
                          fontSize: '0.8rem',
                          color: '#FAFAFA',
                          fontFamily: 'Space Grotesk, sans-serif',
                          textTransform: 'uppercase',
                          fontWeight: 700,
                        }}
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="glass-panel" style={{ padding: '5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              Select a job listing to view complete requirements and request an internal referral.
            </div>
          )}
        </div>
      </div>

      {/* Apply / Request Referral Modal */}
      {showApplyModal && (
        <div className="modal-overlay">
          <div className="modal-dialog">
            <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
              Apply & Request Referral: {showApplyModal.title}
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.75rem' }}>
              Your application goes directly to <strong style={{ color: 'var(--accent)' }}>{showApplyModal.postedBy?.name || 'the posting alumnus'}</strong>.
            </p>

            <form onSubmit={handleApply}>
              <div className="form-group">
                <label className="form-label">Resume / CV Link (Google Drive / GitHub / Portfolio)</label>
                <input
                  type="url"
                  className="form-input"
                  placeholder="https://drive.google.com/your-resume.pdf"
                  value={applyForm.resumeUrl}
                  onChange={(e) => setApplyForm({ ...applyForm, resumeUrl: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Pitch / Introduction for the Alumni Referrer</label>
                <textarea
                  className="form-textarea"
                  rows={4}
                  placeholder="Share a concise paragraph explaining why you're a good fit, your GTU GPA/projects, and what makes you excited about this role..."
                  value={applyForm.coverLetter}
                  onChange={(e) => setApplyForm({ ...applyForm, coverLetter: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="button" onClick={() => setShowApplyModal(null)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Submit Referral Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Post Job Modal */}
      {showPostModal && (
        <div className="modal-overlay">
          <div className="modal-dialog" style={{ maxWidth: 700 }}>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Post Job & Provide Alumni Referral</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.75rem' }}>
              Help your college juniors and fellow GTU alumni break into top tech and engineering companies.
            </p>

            <form onSubmit={handleCreateJob}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                <div className="form-group">
                  <label className="form-label">Job Title</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. SDE-2 Fullstack Engineer"
                    value={jobForm.title}
                    onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Company Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. TCS / Infochip / L&T"
                    value={jobForm.company}
                    onChange={(e) => setJobForm({ ...jobForm, company: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                <div className="form-group">
                  <label className="form-label">Job Location</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Gandhinagar, Gujarat (Hybrid)"
                    value={jobForm.location}
                    onChange={(e) => setJobForm({ ...jobForm, location: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Compensation / CTC Range</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. ₹8 - 14 LPA"
                    value={jobForm.salaryRange}
                    onChange={(e) => setJobForm({ ...jobForm, salaryRange: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Key Technical Skills (comma separated)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. React, Node.js, MongoDB, AWS, Docker"
                  value={jobForm.skillsRequired}
                  onChange={(e) => setJobForm({ ...jobForm, skillsRequired: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Job Description & Responsibilities</label>
                <textarea
                  className="form-textarea"
                  rows={4}
                  placeholder="Outline responsibilities, team culture, and qualifications..."
                  value={jobForm.description}
                  onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="button" onClick={() => setShowPostModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Publish Opening
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

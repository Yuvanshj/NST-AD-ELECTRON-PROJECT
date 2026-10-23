import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { api } from '../../services/api.js';
import {
  Briefcase,
  MapPin,
  Building2,
  DollarSign,
  Clock,
  Sparkles,
  Plus,
  Send,
  CheckCircle2,
  Share2,
} from 'lucide-react';

export default function JobsModule() {
  const { currentUser, colleges } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState(null);
  const [showPostModal, setShowPostModal] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(null); // job to apply to
  const [referralOnly, setReferralOnly] = useState(false);
  const [applyForm, setApplyForm] = useState({ resumeUrl: '', coverLetter: '', requestReferral: true });
  const [applySuccess, setApplySuccess] = useState('');

  // Post Job form state
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <Briefcase color="#3b82f6" /> Referral-Driven Careers & Jobs
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Exclusive openings shared by GTU alumni. Request internal referrals to fast-track hiring pipelines.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.85rem',
              cursor: 'pointer',
              color: referralOnly ? '#c084fc' : 'var(--text-muted)',
            }}
          >
            <input
              type="checkbox"
              checked={referralOnly}
              onChange={(e) => setReferralOnly(e.target.checked)}
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
            background: 'rgba(16, 185, 129, 0.2)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            color: '#34d399',
            padding: '0.85rem 1.25rem',
            borderRadius: 8,
            marginBottom: '1.5rem',
          }}
        >
          {applySuccess}
        </div>
      )}

      {/* Main Split Layout: Job List & Detail View */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(340px, 1fr) minmax(400px, 1.4fr)', gap: '1.5rem' }}>
        {/* Left: Job Cards List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
              Loading job board...
            </div>
          ) : jobs.length === 0 ? (
            <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              No openings posted yet. Be the first alumnus to post a job!
            </div>
          ) : (
            jobs.map((job) => {
              const isSelected = selectedJob?._id === job._id;
              return (
                <div
                  key={job._id}
                  onClick={() => setSelectedJob(job)}
                  className="glass-panel"
                  style={{
                    padding: '1.25rem',
                    cursor: 'pointer',
                    border: isSelected ? '1px solid #3b82f6' : '1px solid var(--border-color)',
                    background: isSelected ? 'rgba(59, 130, 246, 0.12)' : 'var(--bg-card)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <div>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>{job.title}</h3>
                      <div style={{ fontSize: '0.85rem', color: '#93c5fd', fontWeight: 600 }}>{job.company}</div>
                    </div>
                    {job.isReferralAvailable && (
                      <span className="badge badge-referral" title="Alumni referral available">
                        <Sparkles size={12} /> REFERRAL AVAILABLE
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <MapPin size={13} /> {job.location}
                    </span>
                    <span>•</span>
                    <span>{job.jobType.replace('_', ' ')}</span>
                    {job.salaryRange && (
                      <>
                        <span>•</span>
                        <span style={{ color: '#34d399', fontWeight: 600 }}>{job.salaryRange}</span>
                      </>
                    )}
                  </div>

                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    Posted by <strong style={{ color: '#cbd5e1' }}>{job.postedBy?.name || 'Alumnus'}</strong> ({job.postedBy?.collegeId?.code || 'GTU'})
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right: Selected Job Details */}
        <div>
          {selectedJob ? (
            <div className="glass-panel" style={{ padding: '2rem', position: 'sticky', top: 'calc(var(--navbar-height) + 1rem)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>{selectedJob.title}</h2>
                  <div style={{ fontSize: '1.1rem', color: '#60a5fa', fontWeight: 600 }}>{selectedJob.company}</div>
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    <span><MapPin size={14} style={{ display: 'inline', marginRight: 4 }} />{selectedJob.location}</span>
                    <span>•</span>
                    <span>{selectedJob.jobType}</span>
                    <span>•</span>
                    <span style={{ color: '#34d399', fontWeight: 600 }}>{selectedJob.salaryRange || 'Competitive'}</span>
                  </div>
                </div>

                <button
                  onClick={() => setShowApplyModal(selectedJob)}
                  className="btn btn-primary"
                  style={{ gap: '0.5rem', padding: '0.75rem 1.5rem' }}
                >
                  <Send size={16} /> Request Referral & Apply
                </button>
              </div>

              {selectedJob.isReferralAvailable && (
                <div
                  style={{
                    background: 'rgba(139, 92, 246, 0.12)',
                    border: '1px solid rgba(139, 92, 246, 0.3)',
                    borderRadius: 10,
                    padding: '1rem 1.25rem',
                    marginBottom: '1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                  }}
                >
                  <Sparkles color="#c084fc" size={24} />
                  <div>
                    <div style={{ fontWeight: 600, color: '#e9d5ff', fontSize: '0.9rem' }}>
                      Internal Alumni Referral Supported
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#c4b5fd' }}>
                      {selectedJob.postedBy?.name} has pledged to review profiles of GTU graduates and submit their credentials through their company's internal employee referral portal.
                    </div>
                  </div>
                </div>
              )}

              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Role Overview & Responsibilities
                </h4>
                <p style={{ fontSize: '0.9rem', color: '#cbd5e1', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                  {selectedJob.description}
                </p>
              </div>

              {selectedJob.skillsRequired && selectedJob.skillsRequired.length > 0 && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Required Technical Skills
                  </h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {selectedJob.skillsRequired.map((skill, i) => (
                      <span
                        key={i}
                        style={{
                          background: 'rgba(255, 255, 255, 0.06)',
                          border: '1px solid var(--border-color)',
                          padding: '0.3rem 0.75rem',
                          borderRadius: 6,
                          fontSize: '0.8rem',
                          color: '#f8fafc',
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
            <div className="glass-panel" style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              Select a job listing to view complete requirements and request an internal referral.
            </div>
          )}
        </div>
      </div>

      {/* Apply / Request Referral Modal */}
      {showApplyModal && (
        <div className="modal-overlay">
          <div className="modal-dialog">
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>
              Apply & Request Referral: {showApplyModal.title}
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Your application goes directly to <strong>{showApplyModal.postedBy?.name || 'the posting alumnus'}</strong>.
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

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
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
          <div className="modal-dialog" style={{ maxWidth: 650 }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Post Job & Provide Alumni Referral</h3>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Help your college juniors and fellow GTU alumni break into top tech and engineering companies.
            </p>

            <form onSubmit={handleCreateJob}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
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

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
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

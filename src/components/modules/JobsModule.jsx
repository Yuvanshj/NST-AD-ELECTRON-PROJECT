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
  Search,
  ExternalLink,
  Users,
  FileText,
  Filter,
  Check,
  X,
  AlertCircle,
} from 'lucide-react';

export default function JobsModule() {
  const { currentUser, colleges } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState(null);
  const [activeSubTab, setActiveSubTab] = useState('explore'); // 'explore' | 'my_applications' | 'manage_referrals'
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & form state
  const [showPostModal, setShowPostModal] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(null); // job to apply to
  const [referralOnly, setReferralOnly] = useState(false);
  const [applyForm, setApplyForm] = useState({
    resumeUrl: '',
    coverNote: '',
    requestReferral: true,
  });
  const [applySuccess, setApplySuccess] = useState('');
  const [actionError, setActionError] = useState('');

  // My Applications
  const [myApplications, setMyApplications] = useState([]);
  const [loadingMyApps, setLoadingMyApps] = useState(false);

  // Poster Pipeline
  const [myPostings, setMyPostings] = useState([]);
  const [loadingPostings, setLoadingPostings] = useState(false);

  // Post Job form state
  const [jobForm, setJobForm] = useState({
    title: '',
    company: '',
    location: '',
    employmentType: 'FULL_TIME',
    experienceYears: '1-3 Years',
    salaryRange: '₹12 - 18 LPA',
    description: '',
    skillsRequired: '',
    canRefer: true,
    referralInstructions: 'I will submit internal referrals for candidates with solid fundamentals and a strong project portfolio.',
    deadline: '2026-12-31',
  });

  useEffect(() => {
    loadJobs();
  }, [referralOnly]);

  useEffect(() => {
    if (activeSubTab === 'my_applications' && currentUser?._id) {
      loadMyApplications();
    } else if (activeSubTab === 'manage_referrals' && currentUser?._id) {
      loadMyPostings();
    }
  }, [activeSubTab, currentUser]);

  const loadJobs = async () => {
    setLoading(true);
    setActionError('');
    try {
      const filters = {};
      if (referralOnly) filters.hasReferral = 'true';
      if (searchQuery.trim()) filters.query = searchQuery.trim();
      if (currentUser?._id) filters.currentUserId = currentUser._id;

      const res = await api.jobs.getAll(filters);
      const jobList = res.jobs || res.data || [];
      setJobs(jobList);
      if (jobList.length > 0) {
        setSelectedJob((prev) => {
          if (!prev) return jobList[0];
          const found = jobList.find((j) => j._id === prev._id);
          return found || jobList[0];
        });
      } else {
        setSelectedJob(null);
      }
    } catch (e) {
      console.error('Failed to load jobs:', e);
      setActionError('Could not connect to jobs server. Please check backend connection.');
    } finally {
      setLoading(false);
    }
  };

  const loadMyApplications = async () => {
    if (!currentUser?._id) return;
    setLoadingMyApps(true);
    try {
      const res = await api.jobs.getMyApplications(currentUser._id);
      setMyApplications(res.applications || []);
    } catch (e) {
      console.error('Failed to load user applications:', e);
    } finally {
      setLoadingMyApps(false);
    }
  };

  const loadMyPostings = async () => {
    if (!currentUser?._id) return;
    setLoadingPostings(true);
    try {
      const res = await api.jobs.getPosterJobs(currentUser._id);
      setMyPostings(res.postings || []);
    } catch (e) {
      console.error('Failed to load poster jobs:', e);
    } finally {
      setLoadingPostings(false);
    }
  };

  const handleApply = async (e) => {
    e.preventDefault();
    if (!showApplyModal || !currentUser?._id) return;

    try {
      await api.jobs.apply({
        jobId: showApplyModal._id,
        applicantId: currentUser._id,
        resumeUrl: applyForm.resumeUrl || 'https://drive.google.com/sample-resume.pdf',
        coverNote: applyForm.coverNote,
        coverLetter: applyForm.coverNote,
        referralRequested: applyForm.requestReferral,
        requestReferral: applyForm.requestReferral,
      });

      setShowApplyModal(null);
      setApplySuccess(
        `Application & Referral Request submitted to ${showApplyModal.postedBy?.name || 'Alumnus'}!`
      );
      setApplyForm({ resumeUrl: '', coverNote: '', requestReferral: true });
      loadJobs();
      setTimeout(() => setApplySuccess(''), 5000);
    } catch (err) {
      alert('Application failed: ' + (err.message || 'Unknown error'));
    }
  };

  const handleCreateJob = async (e) => {
    e.preventDefault();
    if (!currentUser?._id) {
      alert('Please select an active persona to post a job');
      return;
    }

    try {
      const fallbackCollegeId =
        currentUser.collegeId?._id ||
        (typeof currentUser.collegeId === 'string' ? currentUser.collegeId : null) ||
        (colleges[0] ? colleges[0]._id : null);

      await api.jobs.create({
        title: jobForm.title,
        company: jobForm.company,
        location: jobForm.location,
        employmentType: jobForm.employmentType,
        experienceYears: jobForm.experienceYears,
        salaryRange: jobForm.salaryRange,
        description: jobForm.description,
        canRefer: jobForm.canRefer,
        isReferralAvailable: jobForm.canRefer,
        referralInstructions: jobForm.referralInstructions,
        deadline: jobForm.deadline || '2026-12-31',
        posterId: currentUser._id,
        postedBy: currentUser._id,
        collegeId: fallbackCollegeId,
        skillsRequired: jobForm.skillsRequired
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
      });

      setShowPostModal(false);
      setJobForm({
        title: '',
        company: '',
        location: '',
        employmentType: 'FULL_TIME',
        experienceYears: '1-3 Years',
        salaryRange: '₹12 - 18 LPA',
        description: '',
        skillsRequired: '',
        canRefer: true,
        referralInstructions: 'I will submit internal referrals for candidates with solid fundamentals and a strong project portfolio.',
        deadline: '2026-12-31',
      });
      await loadJobs();
      setApplySuccess('Job opening posted to Gujarat State Alumni Referral Board!');
      setTimeout(() => setApplySuccess(''), 4500);
    } catch (err) {
      alert('Error creating job: ' + err.message);
    }
  };

  const handleUpdateApplicantStatus = async (appId, newStatus) => {
    try {
      await api.jobs.updateStatus(appId, newStatus);
      await loadMyPostings();
      setApplySuccess(`Candidate status updated to: ${newStatus.replace('_', ' ')}`);
      setTimeout(() => setApplySuccess(''), 4000);
    } catch (err) {
      alert('Status update failed: ' + err.message);
    }
  };

  const filteredJobs = jobs.filter((j) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const titleMatch = (j.title || '').toLowerCase().includes(q);
    const companyMatch = (j.company || '').toLowerCase().includes(q);
    const locationMatch = (j.location || '').toLowerCase().includes(q);
    const skillsMatch = (j.skillsRequired || []).some((s) => (s || '').toLowerCase().includes(q));
    return titleMatch || companyMatch || locationMatch || skillsMatch;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'REFERRED':
        return (
          <span style={{ background: 'rgba(168, 85, 247, 0.2)', color: '#c084fc', border: '1px solid rgba(168, 85, 247, 0.4)', padding: '0.2rem 0.6rem', borderRadius: 4, fontSize: '0.75rem', fontWeight: 600 }}>
            ★ REFERRED BY ALUMNUS
          </span>
        );
      case 'SHORTLISTED':
        return (
          <span style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.4)', padding: '0.2rem 0.6rem', borderRadius: 4, fontSize: '0.75rem', fontWeight: 600 }}>
            SHORTLISTED
          </span>
        );
      case 'UNDER_REVIEW':
        return (
          <span style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.4)', padding: '0.2rem 0.6rem', borderRadius: 4, fontSize: '0.75rem', fontWeight: 600 }}>
            UNDER REVIEW
          </span>
        );
      case 'REJECTED':
        return (
          <span style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.4)', padding: '0.2rem 0.6rem', borderRadius: 4, fontSize: '0.75rem', fontWeight: 600 }}>
            NOT PROCEEDED
          </span>
        );
      default:
        return (
          <span style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.4)', padding: '0.2rem 0.6rem', borderRadius: 4, fontSize: '0.75rem', fontWeight: 600 }}>
            APPLIED
          </span>
        );
    }
  };

  return (
    <div className="page-wrapper animate-fade-in">
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <h1
            style={{
              fontSize: '1.75rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
            }}
          >
            <Briefcase color="#3b82f6" /> Referral-Driven Careers & Jobs
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Exclusive vacancies shared by GTU alumni. Request internal referrals to skip automated resume screening.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowPostModal(true)}
            className="btn btn-primary"
            style={{ gap: '0.5rem' }}
          >
            <Plus size={16} /> Post Opportunity
          </button>
        </div>
      </div>

      {/* Sub Tabs Navigation */}
      <div
        style={{
          display: 'flex',
          gap: '1rem',
          borderBottom: '1px solid var(--border-color)',
          marginBottom: '1.5rem',
          paddingBottom: '0.5rem',
        }}
      >
        <button
          onClick={() => setActiveSubTab('explore')}
          style={{
            background: 'none',
            border: 'none',
            padding: '0.5rem 1rem',
            fontSize: '0.9rem',
            fontWeight: 600,
            cursor: 'pointer',
            color: activeSubTab === 'explore' ? '#60a5fa' : 'var(--text-muted)',
            borderBottom: activeSubTab === 'explore' ? '2px solid #3b82f6' : 'none',
            marginBottom: '-0.55rem',
          }}
        >
          Explore Openings ({jobs.length})
        </button>
        <button
          onClick={() => setActiveSubTab('my_applications')}
          style={{
            background: 'none',
            border: 'none',
            padding: '0.5rem 1rem',
            fontSize: '0.9rem',
            fontWeight: 600,
            cursor: 'pointer',
            color: activeSubTab === 'my_applications' ? '#60a5fa' : 'var(--text-muted)',
            borderBottom: activeSubTab === 'my_applications' ? '2px solid #3b82f6' : 'none',
            marginBottom: '-0.55rem',
          }}
        >
          My Referral Requests
        </button>
        <button
          onClick={() => setActiveSubTab('manage_referrals')}
          style={{
            background: 'none',
            border: 'none',
            padding: '0.5rem 1rem',
            fontSize: '0.9rem',
            fontWeight: 600,
            cursor: 'pointer',
            color: activeSubTab === 'manage_referrals' ? '#60a5fa' : 'var(--text-muted)',
            borderBottom: activeSubTab === 'manage_referrals' ? '2px solid #3b82f6' : 'none',
            marginBottom: '-0.55rem',
          }}
        >
          Alumni Referral Pipeline
        </button>
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
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
          }}
        >
          <CheckCircle2 size={18} />
          <span>{applySuccess}</span>
        </div>
      )}

      {actionError && (
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.2)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            color: '#f87171',
            padding: '0.85rem 1.25rem',
            borderRadius: 8,
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
          }}
        >
          <AlertCircle size={18} />
          <span>{actionError}</span>
        </div>
      )}

      {/* TAB 1: EXPLORE OPENINGS */}
      {activeSubTab === 'explore' && (
        <>
          {/* Filter Bar */}
          <div
            style={{
              display: 'flex',
              gap: '1rem',
              alignItems: 'center',
              marginBottom: '1.25rem',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ position: 'relative', flex: '1 1 280px' }}>
              <Search
                size={16}
                style={{
                  position: 'absolute',
                  left: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                }}
              />
              <input
                type="text"
                className="form-input"
                placeholder="Search by job title, company (e.g. Google, AWS), or skill..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '2.4rem' }}
              />
            </div>

            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.85rem',
                cursor: 'pointer',
                color: referralOnly ? '#c084fc' : 'var(--text-muted)',
                background: 'rgba(255, 255, 255, 0.04)',
                padding: '0.55rem 0.9rem',
                borderRadius: 6,
                border: '1px solid var(--border-color)',
              }}
            >
              <input
                type="checkbox"
                checked={referralOnly}
                onChange={(e) => setReferralOnly(e.target.checked)}
              />
              <Sparkles size={16} /> Alumni Referral Only
            </label>
          </div>

          {/* Main Split Layout: Job List & Detail View */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(340px, 1fr) minmax(420px, 1.4fr)',
              gap: '1.5rem',
            }}
          >
            {/* Left: Job Cards List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  Loading GTU referral board...
                </div>
              ) : filteredJobs.length === 0 ? (
                <div
                  className="glass-panel"
                  style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}
                >
                  No matching openings found. Be the first alumnus to post an opportunity!
                </div>
              ) : (
                filteredJobs.map((job) => {
                  const isSelected = selectedJob?._id === job._id;
                  const empTypeStr = String(job.employmentType || job.jobType || 'FULL_TIME').replace(
                    '_',
                    ' '
                  );

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
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          marginBottom: '0.5rem',
                        }}
                      >
                        <div>
                          <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>{job.title}</h3>
                          <div style={{ fontSize: '0.85rem', color: '#93c5fa', fontWeight: 600 }}>
                            {job.company}
                          </div>
                        </div>
                        {(job.canRefer || job.isReferralAvailable) && (
                          <span className="badge badge-referral" title="Alumni referral available">
                            <Sparkles size={12} /> REFERRAL AVAILABLE
                          </span>
                        )}
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: '0.75rem',
                          fontSize: '0.75rem',
                          color: 'var(--text-muted)',
                          marginBottom: '0.75rem',
                        }}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <MapPin size={13} /> {job.location}
                        </span>
                        <span>•</span>
                        <span>{empTypeStr}</span>
                        {job.salaryRange && (
                          <>
                            <span>•</span>
                            <span style={{ color: '#34d399', fontWeight: 600 }}>
                              {job.salaryRange}
                            </span>
                          </>
                        )}
                      </div>

                      <div
                        style={{
                          fontSize: '0.75rem',
                          color: 'var(--text-dim)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                        }}
                      >
                        Posted by{' '}
                        <strong style={{ color: '#cbd5e1' }}>
                          {job.postedBy?.name || job.posterName || 'Alumnus'}
                        </strong>{' '}
                        ({job.collegeName || job.postedBy?.collegeId?.code || 'GTU'})
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Right: Selected Job Details */}
            <div>
              {selectedJob ? (
                <div
                  className="glass-panel"
                  style={{
                    padding: '2rem',
                    position: 'sticky',
                    top: 'calc(var(--navbar-height) + 1rem)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '1.5rem',
                      flexWrap: 'wrap',
                      gap: '1rem',
                    }}
                  >
                    <div>
                      <h2
                        style={{
                          fontSize: '1.5rem',
                          fontWeight: 700,
                          marginBottom: '0.25rem',
                        }}
                      >
                        {selectedJob.title}
                      </h2>
                      <div style={{ fontSize: '1.1rem', color: '#60a5fa', fontWeight: 600 }}>
                        {selectedJob.company}
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          gap: '1rem',
                          marginTop: '0.5rem',
                          fontSize: '0.85rem',
                          color: 'var(--text-muted)',
                          flexWrap: 'wrap',
                        }}
                      >
                        <span>
                          <MapPin size={14} style={{ display: 'inline', marginRight: 4 }} />
                          {selectedJob.location}
                        </span>
                        <span>•</span>
                        <span>
                          {String(
                            selectedJob.employmentType || selectedJob.jobType || 'FULL_TIME'
                          ).replace('_', ' ')}
                        </span>
                        <span>•</span>
                        <span style={{ color: '#34d399', fontWeight: 600 }}>
                          {selectedJob.salaryRange || 'Competitive'}
                        </span>
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

                  {(selectedJob.canRefer || selectedJob.isReferralAvailable) && (
                    <div
                      style={{
                        background: 'rgba(139, 92, 246, 0.12)',
                        border: '1px solid rgba(139, 92, 246, 0.3)',
                        borderRadius: 10,
                        padding: '1.25rem',
                        marginBottom: '1.5rem',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.65rem',
                          marginBottom: '0.5rem',
                        }}
                      >
                        <Sparkles color="#c084fc" size={20} />
                        <span style={{ fontWeight: 700, color: '#e9d5ff', fontSize: '0.95rem' }}>
                          Internal Alumni Referral Guidelines
                        </span>
                      </div>
                      <p style={{ fontSize: '0.85rem', color: '#cbd5e1', lineHeight: 1.5 }}>
                        {selectedJob.referralInstructions ||
                          `${
                            selectedJob.postedBy?.name || selectedJob.posterName || 'The posting alumnus'
                          } has pledged to review profiles of GTU graduates and submit their credentials through their company's internal employee referral portal.`}
                      </p>
                    </div>
                  )}

                  <div style={{ marginBottom: '1.5rem' }}>
                    <h4
                      style={{
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        color: 'var(--text-muted)',
                        marginBottom: '0.5rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                      }}
                    >
                      Role Overview & Responsibilities
                    </h4>
                    <p
                      style={{
                        fontSize: '0.9rem',
                        color: '#cbd5e1',
                        lineHeight: 1.6,
                        whiteSpace: 'pre-line',
                      }}
                    >
                      {selectedJob.description}
                    </p>
                  </div>

                  {selectedJob.skillsRequired && selectedJob.skillsRequired.length > 0 && (
                    <div style={{ marginBottom: '1.5rem' }}>
                      <h4
                        style={{
                          fontSize: '0.9rem',
                          fontWeight: 600,
                          color: 'var(--text-muted)',
                          marginBottom: '0.5rem',
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                        }}
                      >
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

                  {selectedJob.deadline && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Application Deadline:{' '}
                      <strong style={{ color: '#e2e8f0' }}>{selectedJob.deadline}</strong>
                    </div>
                  )}
                </div>
              ) : (
                <div
                  className="glass-panel"
                  style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}
                >
                  Select an opening from the list to view full specifications and request an internal referral.
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* TAB 2: MY REFERRAL APPLICATIONS */}
      {activeSubTab === 'my_applications' && (
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>
            My Referral Requests & Job Applications
          </h2>

          {loadingMyApps ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
              Loading your submitted applications...
            </div>
          ) : myApplications.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              You haven't submitted any job or referral requests yet. Switch to "Explore Openings" to apply!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {myApplications.map((app) => (
                <div
                  key={app._id}
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 8,
                    padding: '1.25rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '1rem',
                  }}
                >
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>{app.job?.title || 'Job Opening'}</h3>
                    <div style={{ color: '#60a5fa', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                      {app.job?.company} • {app.job?.location}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Pitch Note: "{app.coverNote || 'Direct referral request'}"
                    </div>
                    {app.resumeUrl && (
                      <a
                        href={app.resumeUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '0.75rem',
                          color: '#38bdf8',
                          marginTop: '0.35rem',
                        }}
                      >
                        <FileText size={12} /> View Submitted Resume
                      </a>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                    {getStatusBadge(app.status)}
                    {app.referralRequested && (
                      <span style={{ fontSize: '0.72rem', color: '#c084fc', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Sparkles size={11} /> Referral Requested
                      </span>
                    )}
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Applied: {new Date(app.appliedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: ALUMNI REFERRAL PIPELINE */}
      {activeSubTab === 'manage_referrals' && (
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>
            Alumni Candidate Review & Referral Pipeline
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
            Review students and juniors who requested referrals for your posted vacancies. Submit their resumes internally to your HR portal.
          </p>

          {loadingPostings ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
              Loading candidate pipeline...
            </div>
          ) : myPostings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              You haven't posted any jobs yet. Use "Post Opportunity" to publish openings and help fellow alumni!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              {myPostings.map(({ job, applications }) => (
                <div
                  key={job._id}
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 8,
                    padding: '1.5rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>{job.title}</h3>
                      <div style={{ color: '#93c5fd', fontSize: '0.85rem' }}>
                        {job.company} • {job.location} • {applications.length} Applicants
                      </div>
                    </div>
                    <span className="badge badge-referral">
                      <Sparkles size={12} /> ALUMNI REFERRAL ACTIVE
                    </span>
                  </div>

                  {applications.length === 0 ? (
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                      No candidate applications received yet for this vacancy.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {applications.map((cand) => (
                        <div
                          key={cand._id || cand.id}
                          style={{
                            background: 'rgba(0, 0, 0, 0.25)',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            borderRadius: 6,
                            padding: '1rem',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: '1rem',
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                              {cand.applicantName || 'Candidate'}
                            </div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                              {cand.applicantBranch || 'Engineering'} ({cand.applicantBatch || 'GTU'}) • {cand.applicantEmail}
                            </div>
                            <div style={{ fontSize: '0.825rem', color: '#cbd5e1', marginTop: '0.25rem' }}>
                              "{cand.coverNote || 'Candidate applied for internal referral'}"
                            </div>
                            {cand.resumeUrl && (
                              <a
                                href={cand.resumeUrl}
                                target="_blank"
                                rel="noreferrer"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  fontSize: '0.75rem',
                                  color: '#38bdf8',
                                  marginTop: '0.25rem',
                                }}
                              >
                                <ExternalLink size={12} /> Open Candidate Resume
                              </a>
                            )}
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                            {getStatusBadge(cand.status)}

                            {/* Status changer buttons */}
                            <select
                              value={cand.status}
                              onChange={(e) => handleUpdateApplicantStatus(cand._id || cand.id, e.target.value)}
                              className="form-select"
                              style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', width: 'auto' }}
                            >
                              <option value="APPLIED">Applied</option>
                              <option value="UNDER_REVIEW">Under Review</option>
                              <option value="REFERRED">Referred internally</option>
                              <option value="SHORTLISTED">Shortlisted for HR</option>
                              <option value="REJECTED">Declined</option>
                            </select>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Apply / Request Referral Modal */}
      {showApplyModal && (
        <div className="modal-overlay">
          <div className="modal-dialog">
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>
              Apply & Request Referral: {showApplyModal.title}
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Your application goes directly to{' '}
              <strong>{showApplyModal.postedBy?.name || showApplyModal.posterName || 'the posting alumnus'}</strong>.
            </p>

            <form onSubmit={handleApply}>
              <div className="form-group">
                <label className="form-label">Resume / CV Link (Google Drive / GitHub / PDF)</label>
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
                  value={applyForm.coverNote}
                  onChange={(e) => setApplyForm({ ...applyForm, coverNote: e.target.value })}
                  required
                />
              </div>

              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <input
                  type="checkbox"
                  id="reqReferral"
                  checked={applyForm.requestReferral}
                  onChange={(e) => setApplyForm({ ...applyForm, requestReferral: e.target.checked })}
                />
                <label htmlFor="reqReferral" style={{ fontSize: '0.85rem', cursor: 'pointer', color: '#c084fc', fontWeight: 600 }}>
                  <Sparkles size={14} style={{ display: 'inline', marginRight: 4 }} />
                  Request Internal Alumni Employee Referral
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowApplyModal(null)}
                  className="btn btn-secondary"
                >
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
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>
              Post Job & Provide Alumni Referral
            </h3>
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
                    placeholder="e.g. Google / TCS / L&T"
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
                  <label className="form-label">Employment Type</label>
                  <select
                    className="form-select"
                    value={jobForm.employmentType}
                    onChange={(e) => setJobForm({ ...jobForm, employmentType: e.target.value })}
                  >
                    <option value="FULL_TIME">Full Time</option>
                    <option value="INTERNSHIP">Internship</option>
                    <option value="PART_TIME">Part Time</option>
                    <option value="CONTRACT">Contract</option>
                    <option value="REMOTE">Remote</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Experience Required</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Freshers / 1-3 Years"
                    value={jobForm.experienceYears}
                    onChange={(e) => setJobForm({ ...jobForm, experienceYears: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Compensation / CTC Range</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. ₹12 - 18 LPA"
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
                  rows={3}
                  placeholder="Outline responsibilities, team culture, and qualifications..."
                  value={jobForm.description}
                  onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Alumni Referral Guidelines & Instructions</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Qualified candidates with 7+ CGPA and DSA projects will be referred directly to hiring manager."
                  value={jobForm.referralInstructions}
                  onChange={(e) => setJobForm({ ...jobForm, referralInstructions: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', alignItems: 'center' }}>
                <div className="form-group">
                  <label className="form-label">Application Deadline</label>
                  <input
                    type="date"
                    className="form-input"
                    value={jobForm.deadline}
                    onChange={(e) => setJobForm({ ...jobForm, deadline: e.target.value })}
                  />
                </div>
                <div className="form-group" style={{ paddingTop: '1.25rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem' }}>
                    <input
                      type="checkbox"
                      checked={jobForm.canRefer}
                      onChange={(e) => setJobForm({ ...jobForm, canRefer: e.target.checked })}
                    />
                    <Sparkles size={14} color="#c084fc" />
                    <strong>Provide Alumni Referral</strong>
                  </label>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setShowPostModal(false)}
                  className="btn btn-secondary"
                >
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

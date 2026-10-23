import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { api } from '../../services/api.js';
import {
  ShieldAlert,
  CheckCircle2,
  XCircle,
  FileText,
  Upload,
  UserCheck,
  Search,
  Building2,
  AlertCircle,
} from 'lucide-react';

export default function VerificationQueueModule() {
  const { currentUser, colleges } = useAuth();
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCollege, setSelectedCollege] = useState('');
  const [reviewNotes, setReviewNotes] = useState('');
  const [activeModal, setActiveModal] = useState(null); // request for reject modal
  const [rejectionReason, setRejectionReason] = useState('GTU Enrollment number could not be validated in convocation records.');
  const [bulkCsvText, setBulkCsvText] = useState('');
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkSuccess, setBulkSuccess] = useState('');

  useEffect(() => {
    loadPending();
  }, [selectedCollege]);

  const loadPending = async () => {
    setLoading(true);
    try {
      const res = await api.verification.getPending(selectedCollege);
      if (res.requests) {
        setPendingRequests(res.requests);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (requestId) => {
    try {
      await api.verification.verify(requestId, currentUser?._id, 'GTU convocation records verified.');
      await loadPending();
    } catch (e) {
      alert('Verification failed: ' + e.message);
    }
  };

  const handleReject = async () => {
    if (!activeModal) return;
    try {
      await api.verification.reject(activeModal._id, currentUser?._id, rejectionReason);
      setActiveModal(null);
      await loadPending();
    } catch (e) {
      alert('Rejection failed: ' + e.message);
    }
  };

  const handleBulkUpload = async (e) => {
    e.preventDefault();
    try {
      // Parse CSV lines: name, email, gtuEnrollment, batchYear, degree, branch
      const lines = bulkCsvText.trim().split('\n');
      const records = [];
      for (const line of lines) {
        const parts = line.split(',').map((s) => s.trim());
        if (parts.length >= 4) {
          records.push({
            name: parts[0],
            email: parts[1],
            gtuEnrollment: parts[2],
            batchYear: Number(parts[3]),
            degree: parts[4] || 'B.E.',
            branch: parts[5] || 'Information Technology',
          });
        }
      }

      const collegeId = selectedCollege || (colleges[0] ? colleges[0]._id : null);
      const res = await api.auth.bulkRegister({ collegeId, alumniRecords: records });
      setBulkSuccess(`Successfully pre-verified & imported ${res.createdCount} alumni from GTU Convocation Master Data!`);
      setShowBulkModal(false);
      setBulkCsvText('');
      setTimeout(() => setBulkSuccess(''), 5000);
    } catch (err) {
      alert('Bulk import error: ' + err.message);
    }
  };

  return (
    <div className="page-wrapper animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <ShieldAlert color="#f59e0b" /> Registrar Verification Queue
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Verify alumni credentials against Gujarat Technological University (GTU) academic records before conferring trusted voting & networking rights.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={() => setShowBulkModal(true)}
            className="btn btn-secondary"
            style={{ gap: '0.5rem' }}
          >
            <Upload size={16} /> Bulk Import Master Records
          </button>
        </div>
      </div>

      {bulkSuccess && (
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
          {bulkSuccess}
        </div>
      )}

      {/* Filter Bar */}
      <div className="glass-panel" style={{ padding: '1.25rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <Building2 size={18} color="var(--text-muted)" />
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Filter by Institution:</span>
        <select
          className="form-select"
          value={selectedCollege}
          onChange={(e) => setSelectedCollege(e.target.value)}
          style={{ maxWidth: 320 }}
        >
          <option value="">All Gujarat Engineering Colleges</option>
          {colleges.map((col) => (
            <option key={col._id} value={col._id}>
              {col.name} ({col.code})
            </option>
          ))}
        </select>
        <div style={{ marginLeft: 'auto', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Pending In Queue: <strong style={{ color: '#fbbf24' }}>{pendingRequests.length}</strong>
        </div>
      </div>

      {/* Pending Table */}
      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Applicant / Alumni</th>
                <th>Institute</th>
                <th>GTU Enrollment #</th>
                <th>Graduation Batch</th>
                <th>Proof Document</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}>
                    Loading verification records...
                  </td>
                </tr>
              ) : pendingRequests.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    <CheckCircle2 size={36} color="#10b981" style={{ margin: '0 auto 0.75rem', display: 'block' }} />
                    All alumni verification requests are up to date!
                  </td>
                </tr>
              ) : (
                pendingRequests.map((req) => (
                  <tr key={req._id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{req.userId?.name || 'Alumnus'}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{req.userId?.email}</div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.85rem' }}>{req.collegeId?.code || 'GTU'}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{req.collegeId?.name}</div>
                    </td>
                    <td>
                      <span
                        style={{
                          fontFamily: 'monospace',
                          background: 'rgba(255, 255, 255, 0.08)',
                          padding: '0.2rem 0.5rem',
                          borderRadius: 4,
                          fontSize: '0.85rem',
                        }}
                      >
                        {req.gtuEnrollment}
                      </span>
                    </td>
                    <td>
                      {req.batchYear} ({req.branch})
                    </td>
                    <td>
                      <a
                        href={req.proofDocumentUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          color: '#60a5fa',
                          textDecoration: 'none',
                          fontSize: '0.8rem',
                        }}
                      >
                        <FileText size={14} /> GTU Degree Doc
                      </a>
                    </td>
                    <td>
                      <span className="badge badge-pending">PENDING REGISTRAR</span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => handleVerify(req._id)}
                          className="btn btn-success btn-sm"
                          title="Verify and confer GTU Verified badge"
                        >
                          <CheckCircle2 size={14} /> Accept
                        </button>
                        <button
                          onClick={() => setActiveModal(req)}
                          className="btn btn-outline-danger btn-sm"
                          title="Reject application"
                        >
                          <XCircle size={14} /> Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reject Modal */}
      {activeModal && (
        <div className="modal-overlay">
          <div className="modal-dialog">
            <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: '#f87171' }}>
              Reject Verification: {activeModal.userId?.name}
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Specify the reason for rejection. This explanation will be logged to the immutable audit trail and emailed to the applicant.
            </p>
            <div className="form-group">
              <label className="form-label">Rejection Reason</label>
              <textarea
                className="form-textarea"
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button onClick={() => setActiveModal(null)} className="btn btn-secondary">
                Cancel
              </button>
              <button onClick={handleReject} className="btn btn-outline-danger">
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Master Import Modal */}
      {showBulkModal && (
        <div className="modal-overlay">
          <div className="modal-dialog" style={{ maxWidth: 650 }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>
              Registrar Batch CSV Import (Convocation Master Data)
            </h3>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Import historical graduation data provided by the examination controller. Alumni matching these enrollment records are immediately auto-verified.
            </p>

            <form onSubmit={handleBulkUpload}>
              <div className="form-group">
                <label className="form-label">CSV Format: Name, Email, GTU Enrollment, Batch Year, Degree, Branch</label>
                <textarea
                  className="form-textarea"
                  rows={6}
                  style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}
                  placeholder={`Anand Dave, anand.dave@example.com, 170280116045, 2021, B.E., Computer Engineering\nBhavik Shah, bhavik.shah@example.com, 180280116099, 2022, B.E., Information Technology`}
                  value={bulkCsvText}
                  onChange={(e) => setBulkCsvText(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" onClick={() => setShowBulkModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Import & Pre-Verify Alumni
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

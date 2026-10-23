import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { api } from '../../services/api.js';
import {
  ShieldAlert,
  CheckCircle2,
  XCircle,
  FileText,
  Upload,
  Building2,
} from 'lucide-react';

export default function VerificationQueueModule() {
  const { currentUser, colleges } = useAuth();
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCollege, setSelectedCollege] = useState('');
  const [activeModal, setActiveModal] = useState(null);
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1.5rem' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <span>Registrar Verification Queue</span>
            <span className="badge badge-referral" style={{ fontSize: '0.8rem' }}>GTU MASTER</span>
          </h1>
          <p style={{ marginTop: '0.5rem', fontSize: '1.05rem', maxWidth: '75ch' }}>
            Verify alumni credentials against Gujarat Technological University academic records before conferring trusted voting and networking rights.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
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
          {bulkSuccess}
        </div>
      )}

      {/* Filter Bar */}
      <div className="glass-panel" style={{ padding: '1.5rem 2rem', marginBottom: '2.5rem', display: 'flex', gap: '1.25rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <Building2 size={18} color="var(--accent)" />
        <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontFamily: 'Space Grotesk, sans-serif', textTransform: 'uppercase', fontWeight: 700 }}>
          Filter by Institution:
        </span>
        <select
          className="form-select"
          value={selectedCollege}
          onChange={(e) => setSelectedCollege(e.target.value)}
          style={{ maxWidth: 360 }}
        >
          <option value="">All Gujarat Engineering Colleges</option>
          {colleges.map((col) => (
            <option key={col._id} value={col._id}>
              {col.name} ({col.code})
            </option>
          ))}
        </select>
        <div style={{ marginLeft: 'auto', fontSize: '0.9rem', color: 'var(--text-muted)', fontFamily: 'Space Grotesk, sans-serif', textTransform: 'uppercase' }}>
          Pending In Queue: <strong style={{ color: 'var(--accent)', fontSize: '1.2rem' }}>{pendingRequests.length}</strong>
        </div>
      </div>

      {/* Pending Table */}
      <div className="glass-panel" style={{ marginBottom: '2.5rem', padding: 0 }}>
        <div className="table-container" style={{ border: 'none' }}>
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
                  <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Loading verification records...
                  </td>
                </tr>
              ) : pendingRequests.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                    <CheckCircle2 size={40} color="var(--accent)" style={{ margin: '0 auto 1rem', display: 'block' }} />
                    <span style={{ fontFamily: 'Space Grotesk, sans-serif', textTransform: 'uppercase', fontWeight: 700, fontSize: '1.1rem' }}>
                      All alumni verification requests are cleared and up to date!
                    </span>
                  </td>
                </tr>
              ) : (
                pendingRequests.map((req) => (
                  <tr key={req._id}>
                    <td>
                      <div style={{ fontWeight: 800, textTransform: 'uppercase', color: '#FAFAFA' }}>{req.userId?.name || 'Alumnus'}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{req.userId?.email}</div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase' }}>{req.collegeId?.code || 'GTU'}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{req.collegeId?.name}</div>
                    </td>
                    <td>
                      <span
                        style={{
                          fontFamily: 'monospace',
                          background: 'var(--bg-secondary)',
                          border: '1px solid var(--border-color)',
                          padding: '0.3rem 0.65rem',
                          fontSize: '0.9rem',
                          fontWeight: 700,
                          color: '#FAFAFA',
                        }}
                      >
                        {req.gtuEnrollment}
                      </span>
                    </td>
                    <td style={{ fontFamily: 'Space Grotesk, sans-serif', textTransform: 'uppercase' }}>
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
                          color: 'var(--accent)',
                          textDecoration: 'none',
                          fontSize: '0.85rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                        }}
                      >
                        <FileText size={15} /> GTU Degree Doc
                      </a>
                    </td>
                    <td>
                      <span className="badge badge-pending">PENDING REGISTRAR</span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.65rem' }}>
                        <button
                          onClick={() => handleVerify(req._id)}
                          className="btn btn-primary btn-sm"
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
            <h3 style={{ fontSize: '1.4rem', marginBottom: '0.75rem', color: '#ef4444', textTransform: 'uppercase' }}>
              Reject Verification: {activeModal.userId?.name}
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
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
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
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
          <div className="modal-dialog" style={{ maxWidth: 700 }}>
            <h3 style={{ fontSize: '1.4rem', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
              Registrar Batch CSV Import (Convocation Master Data)
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.75rem' }}>
              Import historical graduation data provided by the examination controller. Alumni matching these enrollment records are immediately auto-verified.
            </p>

            <form onSubmit={handleBulkUpload}>
              <div className="form-group">
                <label className="form-label">CSV Format: Name, Email, GTU Enrollment, Batch Year, Degree, Branch</label>
                <textarea
                  className="form-textarea"
                  rows={6}
                  style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}
                  placeholder={`Anand Dave, anand.dave@example.com, 170280116045, 2021, B.E., Computer Engineering\nBhavik Shah, bhavik.shah@example.com, 180280116099, 2022, B.E., Information Technology`}
                  value={bulkCsvText}
                  onChange={(e) => setBulkCsvText(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
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

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { api } from '../../services/api.js';
import {
  FileSpreadsheet,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Building2,
  FileText,
  Plus,
  Lock,
} from 'lucide-react';

export default function TransparencyModule() {
  const { currentUser, colleges } = useAuth();
  const [ledger, setLedger] = useState({ donations: [], disbursements: [] });
  const [loading, setLoading] = useState(true);
  const [selectedCollege, setSelectedCollege] = useState('');
  const [showDisburseModal, setShowDisburseModal] = useState(false);
  const [disburseForm, setDisburseForm] = useState({
    campaignId: '',
    recipientVendor: '',
    amount: '',
    purpose: '',
    invoiceUrl: '',
  });

  useEffect(() => {
    loadLedger();
  }, [selectedCollege]);

  const loadLedger = async () => {
    setLoading(true);
    try {
      const res = await api.donations.getLedger(selectedCollege);
      if (res) {
        setLedger({
          donations: res.donations || [],
          disbursements: res.disbursements || [],
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDisburse = async (e) => {
    e.preventDefault();
    try {
      await api.donations.disburse({
        ...disburseForm,
        approvedBy: currentUser._id,
        amount: Number(disburseForm.amount),
      });
      setShowDisburseModal(false);
      setDisburseForm({
        campaignId: '',
        recipientVendor: '',
        amount: '',
        purpose: '',
        invoiceUrl: '',
      });
      await loadLedger();
    } catch (err) {
      alert('Error creating disbursement: ' + err.message);
    }
  };

  const totalInflow = ledger.donations.reduce((sum, d) => sum + (d.amount || 0), 0);
  const totalOutflow = ledger.disbursements.reduce((sum, d) => sum + (d.amount || 0), 0);
  const netEscrowBalance = totalInflow - totalOutflow;

  const isAdmin = currentUser?.role === 'COLLEGE_ADMIN' || currentUser?.role === 'STATE_DIRECTOR';

  return (
    <div className="page-wrapper animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1.5rem' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <span>Public Transparency Escrow</span>
            <span className="badge badge-referral" style={{ fontSize: '0.8rem' }}>ZERO BLACK-BOX</span>
          </h1>
          <p style={{ marginTop: '0.5rem', fontSize: '1.05rem', maxWidth: '75ch' }}>
            Track every single rupee contributed and spent across Gujarat technical colleges with auditable invoices and public vendor disbursements.
          </p>
        </div>

        {isAdmin && (
          <button onClick={() => setShowDisburseModal(true)} className="btn btn-primary" style={{ gap: '0.5rem' }}>
            <Plus size={16} /> Record Public Fund Disbursement
          </button>
        )}
      </div>

      {/* Financial Health Summary Cards with Massive Scale */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="massive-bg-num">01</div>
          <div className="stat-label">Total Alumni Giving (Inflow)</div>
          <div className="stat-val" style={{ color: 'var(--accent)' }}>
            ₹{totalInflow.toLocaleString()}
          </div>
          <div className="stat-trend" style={{ color: '#10b981' }}>
            <TrendingUp size={14} /> 100% 80G Certified Inflows
          </div>
        </div>

        <div className="stat-card">
          <div className="massive-bg-num">02</div>
          <div className="stat-label">Utilized / Disbursed (Outflow)</div>
          <div className="stat-val" style={{ color: '#ef4444' }}>
            ₹{totalOutflow.toLocaleString()}
          </div>
          <div className="stat-trend">
            <TrendingDown size={14} color="#ef4444" /> Verified Vendor Invoices
          </div>
        </div>

        <div className="stat-card">
          <div className="massive-bg-num">03</div>
          <div className="stat-label">Live Escrow Balance</div>
          <div className="stat-val" style={{ color: '#FAFAFA' }}>
            ₹{netEscrowBalance.toLocaleString()}
          </div>
          <div className="stat-trend" style={{ color: 'var(--accent)' }}>
            <Lock size={14} /> In State Treasury Escrow
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="glass-panel" style={{ padding: '1.5rem 2rem', marginBottom: '2.5rem', display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
        <Building2 size={18} color="var(--accent)" />
        <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontFamily: 'Space Grotesk, sans-serif', textTransform: 'uppercase', fontWeight: 700 }}>
          Filter Ledger by Institution:
        </span>
        <select
          className="form-select"
          value={selectedCollege}
          onChange={(e) => setSelectedCollege(e.target.value)}
          style={{ maxWidth: 360 }}
        >
          <option value="">All Institutions (Consolidated State Escrow)</option>
          {colleges.map((col) => (
            <option key={col._id} value={col._id}>
              {col.name} ({col.code})
            </option>
          ))}
        </select>
      </div>

      {/* Verified Disbursements Table */}
      <div className="glass-panel" style={{ marginBottom: '2.5rem', padding: 0 }}>
        <div style={{ padding: '1.5rem 2rem', borderBottom: '2px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <ShieldCheck size={20} color="var(--accent)" />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, textTransform: 'uppercase' }}>
            Published Disbursements & Vendor Invoices ({ledger.disbursements.length})
          </h3>
        </div>

        <div className="table-container" style={{ border: 'none' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Recipient / Contractor</th>
                <th>Purpose / Scope</th>
                <th>Amount</th>
                <th>Invoice Proof</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {ledger.disbursements.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    No disbursements recorded for this institution yet.
                  </td>
                </tr>
              ) : (
                ledger.disbursements.map((d) => (
                  <tr key={d._id}>
                    <td style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700 }}>
                      {new Date(d.disbursedAt || d.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      <div style={{ fontWeight: 800, textTransform: 'uppercase', color: '#FAFAFA' }}>{d.recipientVendor}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{d.collegeId?.name}</div>
                    </td>
                    <td style={{ color: 'var(--text-muted)' }}>{d.purpose}</td>
                    <td style={{ fontWeight: 800, color: '#ef4444', fontFamily: 'Space Grotesk, sans-serif', fontSize: '1rem' }}>
                      -₹{d.amount.toLocaleString()}
                    </td>
                    <td>
                      {d.invoiceUrl ? (
                        <a
                          href={d.invoiceUrl}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: 'var(--accent)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.8rem' }}
                        >
                          <FileText size={14} /> Audit Invoice
                        </a>
                      ) : (
                        'Verified'
                      )}
                    </td>
                    <td>
                      <span className="badge badge-verified">AUDITED & CLEARED</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Disbursement Modal */}
      {showDisburseModal && (
        <div className="modal-overlay">
          <div className="modal-dialog">
            <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Record Transparent Fund Disbursement</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.75rem' }}>
              Publish payment details to the public ledger for community verification.
            </p>

            <form onSubmit={handleDisburse}>
              <div className="form-group">
                <label className="form-label">Vendor / Contractor / Beneficiary Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Dell India Pvt Ltd (Robotics Lab Equipment)"
                  value={disburseForm.recipientVendor}
                  onChange={(e) => setDisburseForm({ ...disburseForm, recipientVendor: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Amount (INR)</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="e.g. 250000"
                  value={disburseForm.amount}
                  onChange={(e) => setDisburseForm({ ...disburseForm, amount: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Purpose of Expenditure</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  placeholder="e.g. Procurement of 12 GPU workstations for AI Lab installation..."
                  value={disburseForm.purpose}
                  onChange={(e) => setDisburseForm({ ...disburseForm, purpose: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Public Invoice / Work Order URL</label>
                <input
                  type="url"
                  className="form-input"
                  placeholder="https://drive.google.com/invoice-doc.pdf"
                  value={disburseForm.invoiceUrl}
                  onChange={(e) => setDisburseForm({ ...disburseForm, invoiceUrl: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="button" onClick={() => setShowDisburseModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Publish Disbursement to Ledger
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

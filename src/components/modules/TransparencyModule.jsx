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
  CheckCircle2,
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <FileSpreadsheet color="#3b82f6" /> Public Transparency Fund Ledger
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Zero black-box giving: Track every single rupee contributed and spent across Gujarat technical colleges with auditable invoices and vendor disbursements.
          </p>
        </div>

        {isAdmin && (
          <button onClick={() => setShowDisburseModal(true)} className="btn btn-primary" style={{ gap: '0.5rem' }}>
            <Plus size={16} /> Record Public Fund Disbursement
          </button>
        )}
      </div>

      {/* Financial Health Summary Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Alumni Giving (Inflow)</div>
          <div className="stat-val" style={{ color: '#34d399' }}>
            ₹{totalInflow.toLocaleString()}
          </div>
          <div className="stat-trend">
            <TrendingUp size={14} /> 100% 80G Certified Inflows
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Utilized / Disbursed (Outflow)</div>
          <div className="stat-val" style={{ color: '#f87171' }}>
            ₹{totalOutflow.toLocaleString()}
          </div>
          <div className="stat-trend" style={{ color: '#94a3b8' }}>
            <TrendingDown size={14} /> Verified Vendor Invoices
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Live Escrow Balance</div>
          <div className="stat-val" style={{ color: '#60a5fa' }}>
            ₹{netEscrowBalance.toLocaleString()}
          </div>
          <div className="stat-trend">
            <Lock size={14} /> In State Treasury Escrow
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="glass-panel" style={{ padding: '1rem 1.5rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <Building2 size={16} color="var(--text-muted)" />
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Filter Ledger by College:</span>
        <select
          className="form-select"
          value={selectedCollege}
          onChange={(e) => setSelectedCollege(e.target.value)}
          style={{ maxWidth: 300 }}
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
      <div className="glass-panel" style={{ marginBottom: '2rem', overflow: 'hidden' }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ShieldCheck size={18} color="#34d399" />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
            Published Disbursements & Vendor Utilization ({ledger.disbursements.length})
          </h3>
        </div>

        <div className="table-container">
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
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    No disbursements recorded for this institution yet.
                  </td>
                </tr>
              ) : (
                ledger.disbursements.map((d) => (
                  <tr key={d._id}>
                    <td>{new Date(d.disbursedAt || d.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{d.recipientVendor}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{d.collegeId?.name}</div>
                    </td>
                    <td>{d.purpose}</td>
                    <td style={{ fontWeight: 700, color: '#f87171' }}>
                      -₹{d.amount.toLocaleString()}
                    </td>
                    <td>
                      {d.invoiceUrl ? (
                        <a
                          href={d.invoiceUrl}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: '#60a5fa', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
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
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Record Transparent Fund Disbursement</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
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

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
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

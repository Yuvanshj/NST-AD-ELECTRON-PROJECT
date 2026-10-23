import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.js';
import {
  FileCode2,
  ShieldCheck,
  Search,
  Filter,
  Terminal,
  Clock,
  Layers,
} from 'lucide-react';

export default function AuditLogsModule() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [summary, setSummary] = useState([]);
  const [expandedLogId, setExpandedLogId] = useState(null);

  useEffect(() => {
    loadLogs();
    loadSummary();
  }, [selectedCategory]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const filters = {};
      if (selectedCategory) filters.category = selectedCategory;
      const res = await api.audit.getLogs(filters);
      if (res.logs) {
        setLogs(res.logs);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadSummary = async () => {
    try {
      const res = await api.audit.getSummary();
      if (res.summary) {
        setSummary(res.summary);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="page-wrapper animate-fade-in">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <FileCode2 color="#3b82f6" /> Immutable Activity & Governance Audit Trail
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          Tamper-evident logs of administrative verifications, financial transactions, and credential mutations required for statutory compliance.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="glass-panel" style={{ padding: '1.25rem 1.5rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <Filter size={16} color="var(--text-muted)" />
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Audit Category Filter:</span>
        <select
          className="form-select"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          style={{ maxWidth: 240 }}
        >
          <option value="">All Audit Categories</option>
          <option value="VERIFICATION">Registrar Verifications</option>
          <option value="DONATION">Donations & Disbursements</option>
          <option value="AUTH">Authentication & OTP</option>
          <option value="CAREER">Job Postings & Referrals</option>
          <option value="ADMIN">System Administration</option>
          <option value="SYSTEM">System Automations</option>
        </select>

        <div style={{ marginLeft: 'auto', fontSize: '0.825rem', color: 'var(--text-muted)' }}>
          Showing <strong>{logs.length}</strong> immutable trail entries
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Category</th>
                <th>Action Code</th>
                <th>Acting User</th>
                <th>IP Address</th>
                <th style={{ textAlign: 'right' }}>Metadata Payload</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>
                    Reading audit ledger...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    No audit records match the current filter.
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const isExpanded = expandedLogId === log._id;
                  const dateStr = new Date(log.createdAt).toLocaleString();

                  return (
                    <React.Fragment key={log._id}>
                      <tr>
                        <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                          {dateStr}
                        </td>
                        <td>
                          <span
                            className="badge"
                            style={{
                              background:
                                log.category === 'VERIFICATION'
                                  ? 'rgba(16, 185, 129, 0.15)'
                                  : log.category === 'DONATION'
                                  ? 'rgba(59, 130, 246, 0.15)'
                                  : 'rgba(255, 255, 255, 0.08)',
                              color:
                                log.category === 'VERIFICATION'
                                  ? '#34d399'
                                  : log.category === 'DONATION'
                                  ? '#60a5fa'
                                  : '#cbd5e1',
                            }}
                          >
                            {log.category}
                          </span>
                        </td>
                        <td style={{ fontWeight: 600, fontFamily: 'monospace', fontSize: '0.825rem' }}>
                          {log.action}
                        </td>
                        <td>
                          <div style={{ fontSize: '0.85rem' }}>{log.userId?.name || log.userEmail || 'System Process'}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{log.collegeId?.code || 'GTU'}</div>
                        </td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontFamily: 'monospace' }}>
                          {log.ipAddress || '127.0.0.1'}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            onClick={() => setExpandedLogId(isExpanded ? null : log._id)}
                            className="btn btn-secondary btn-sm"
                            style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                          >
                            {isExpanded ? 'Hide Payload' : 'Inspect JSON'}
                          </button>
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr>
                          <td colSpan={6} style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '1rem 1.5rem' }}>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                              Signed Execution Payload & Audit Context:
                            </div>
                            <pre
                              style={{
                                background: '#070a14',
                                padding: '0.85rem',
                                borderRadius: 6,
                                border: '1px solid var(--border-color)',
                                fontSize: '0.75rem',
                                color: '#93c5fd',
                                overflowX: 'auto',
                              }}
                            >
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

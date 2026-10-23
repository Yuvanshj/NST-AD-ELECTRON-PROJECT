import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.js';
import {
  FileCode2,
  Filter,
} from 'lucide-react';

export default function AuditLogsModule() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [expandedLogId, setExpandedLogId] = useState(null);

  useEffect(() => {
    loadLogs();
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

  return (
    <div className="page-wrapper animate-fade-in">
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <span>Immutable Audit & Governance Trail</span>
          <span className="badge badge-referral" style={{ fontSize: '0.8rem' }}>STATUTORY LOG</span>
        </h1>
        <p style={{ marginTop: '0.5rem', fontSize: '1.05rem', maxWidth: '75ch' }}>
          Tamper-evident logs of administrative verifications, financial transactions, and credential mutations required for statutory compliance.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="glass-panel" style={{ padding: '1.5rem 2rem', marginBottom: '2.5rem', display: 'flex', gap: '1.25rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <Filter size={18} color="var(--accent)" />
        <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontFamily: 'Space Grotesk, sans-serif', textTransform: 'uppercase', fontWeight: 700 }}>
          Audit Category Filter:
        </span>
        <select
          className="form-select"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          style={{ maxWidth: 300 }}
        >
          <option value="">All Audit Categories</option>
          <option value="VERIFICATION">Registrar Verifications</option>
          <option value="DONATION">Donations & Disbursements</option>
          <option value="AUTH">Authentication & OTP</option>
          <option value="CAREER">Job Postings & Referrals</option>
          <option value="ADMIN">System Administration</option>
          <option value="SYSTEM">System Automations</option>
        </select>

        <div style={{ marginLeft: 'auto', fontSize: '0.9rem', color: 'var(--text-muted)', fontFamily: 'Space Grotesk, sans-serif', textTransform: 'uppercase' }}>
          Showing <strong style={{ color: 'var(--accent)', fontSize: '1.2rem' }}>{logs.length}</strong> immutable trail entries
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="glass-panel" style={{ marginBottom: '2.5rem', padding: 0 }}>
        <div className="table-container" style={{ border: 'none' }}>
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
                  <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Reading audit ledger...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
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
                        <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                          {dateStr}
                        </td>
                        <td>
                          <span
                            className="badge"
                            style={{
                              borderColor:
                                log.category === 'VERIFICATION'
                                  ? '#10b981'
                                  : log.category === 'DONATION'
                                  ? 'var(--accent)'
                                  : 'var(--border-color)',
                              color:
                                log.category === 'VERIFICATION'
                                  ? '#10b981'
                                  : log.category === 'DONATION'
                                  ? 'var(--accent)'
                                  : '#FAFAFA',
                            }}
                          >
                            {log.category}
                          </span>
                        </td>
                        <td style={{ fontWeight: 800, fontFamily: 'monospace', fontSize: '0.88rem', color: 'var(--accent)' }}>
                          {log.action}
                        </td>
                        <td>
                          <div style={{ fontSize: '0.9rem', fontWeight: 700, textTransform: 'uppercase', color: '#FAFAFA' }}>{log.userId?.name || log.userEmail || 'System Process'}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{log.collegeId?.code || 'GTU'}</div>
                        </td>
                        <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                          {log.ipAddress || '127.0.0.1'}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            onClick={() => setExpandedLogId(isExpanded ? null : log._id)}
                            className="btn btn-secondary btn-sm"
                            style={{ fontSize: '0.75rem', padding: '0.35rem 0.85rem' }}
                          >
                            {isExpanded ? 'Hide Payload' : 'Inspect JSON'}
                          </button>
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr>
                          <td colSpan={6} style={{ background: 'var(--bg-secondary)', padding: '1.5rem 2rem' }}>
                            <div style={{ fontSize: '0.8rem', color: 'var(--accent)', marginBottom: '0.5rem', fontFamily: 'Space Grotesk, sans-serif', textTransform: 'uppercase', fontWeight: 800 }}>
                              Signed Execution Payload & Cryptographic Audit Context:
                            </div>
                            <pre
                              style={{
                                background: 'var(--bg-primary)',
                                padding: '1.25rem',
                                border: '2px solid var(--border-color)',
                                fontSize: '0.85rem',
                                color: '#FAFAFA',
                                overflowX: 'auto',
                                fontFamily: 'monospace',
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

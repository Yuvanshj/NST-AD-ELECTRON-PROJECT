import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { api } from '../../services/api.js';
import {
  HeartHandshake,
  ShieldCheck,
  Download,
  CheckCircle2,
  Sparkles,
  TrendingUp,
  Receipt,
  Eye,
  CreditCard,
  Building2,
} from 'lucide-react';

export default function DonationsModule() {
  const { currentUser } = useAuth();
  const [campaigns, setCampaigns] = useState([]);
  const [honorRoll, setHonorRoll] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [donationAmount, setDonationAmount] = useState('5000');
  const [donorPan, setDonorPan] = useState('ABCDE1234F');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [paying, setPaying] = useState(false);
  const [completedDonation, setCompletedDonation] = useState(null);
  const [activeReceiptHtml, setActiveReceiptHtml] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const campRes = await api.donations.getCampaigns();
      if (campRes.campaigns) {
        setCampaigns(campRes.campaigns);
        if (campRes.campaigns.length > 0) {
          setSelectedCampaign(campRes.campaigns[0]);
        }
      }

      const honorRes = await api.donations.getHonorRoll();
      if (honorRes.honorRoll) {
        setHonorRoll(honorRes.honorRoll);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDonate = async (e) => {
    e.preventDefault();
    if (!selectedCampaign || !currentUser) return;
    setPaying(true);

    try {
      // Step 1: Create Order
      const orderRes = await api.donations.createOrder({
        campaignId: selectedCampaign._id,
        donorId: currentUser._id,
        amount: Number(donationAmount),
        donorPan,
        isAnonymous,
      });

      // Step 2: Simulated Razorpay Payment verification
      const verifyRes = await api.donations.verifyPayment({
        donationId: orderRes.donation._id,
        razorpayPaymentId: 'pay_sim_' + Math.random().toString(36).substring(2, 10),
        razorpaySignature: 'sig_valid_' + Math.random().toString(36).substring(2, 12),
      });

      setCompletedDonation(verifyRes.donation);
      setActiveReceiptHtml(verifyRes.receiptHtml);
      await loadData();
    } catch (err) {
      alert('Donation error: ' + err.message);
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="page-wrapper animate-fade-in">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <HeartHandshake color="#10b981" /> Giving, Scholarships & 80G Tax Exemption
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          Every rupee donated by alumni is eligible for 50% tax deductions under Section 80G of the Income Tax Act, 1961, with instant computerized certificates and verifiable blockchain/hash receipts.
        </p>
      </div>

      {/* Completed Donation Success Alert */}
      {completedDonation && (
        <div
          className="glass-panel"
          style={{
            padding: '1.5rem',
            marginBottom: '2rem',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            background: 'rgba(16, 185, 129, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <CheckCircle2 color="#34d399" size={32} />
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#34d399' }}>
                Donation of ₹{completedDonation.amount.toLocaleString()} Successful!
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>
                80G Tax Exemption Certificate Issued: <strong style={{ color: '#fff' }}>{completedDonation.taxReceiptNumber}</strong>
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              const win = window.open('', '_blank');
              win.document.write(activeReceiptHtml);
              win.document.close();
            }}
            className="btn btn-success"
            style={{ gap: '0.5rem' }}
          >
            <Download size={16} /> View & Print 80G Tax Receipt
          </button>
        </div>
      )}

      {/* Active Campaigns Grid */}
      <div style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>Active Gujarat College Endowment Campaigns</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {campaigns.map((camp) => {
            const percent = Math.min(100, Math.round((camp.currentAmount / camp.targetAmount) * 100));
            const isSelected = selectedCampaign?._id === camp._id;

            return (
              <div
                key={camp._id}
                onClick={() => setSelectedCampaign(camp)}
                className="glass-panel"
                style={{
                  padding: '1.5rem',
                  cursor: 'pointer',
                  border: isSelected ? '1px solid #10b981' : '1px solid var(--border-color)',
                  background: isSelected ? 'rgba(16, 185, 129, 0.08)' : 'var(--bg-card)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span className="badge badge-primary">{camp.category}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{camp.collegeId?.name}</span>
                </div>

                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem' }}>{camp.title}</h3>
                <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginBottom: '1.25rem', minHeight: 40 }}>
                  {camp.description}
                </p>

                {/* Progress bar */}
                <div style={{ marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                    <span style={{ color: '#34d399' }}>₹{camp.currentAmount.toLocaleString()}</span>
                    <span style={{ color: 'var(--text-muted)' }}>Goal: ₹{camp.targetAmount.toLocaleString()}</span>
                  </div>
                  <div style={{ height: 8, background: 'rgba(255, 255, 255, 0.1)', borderRadius: 999, overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${percent}%`,
                        height: '100%',
                        background: 'linear-gradient(90deg, #10b981, #06b6d4)',
                        borderRadius: 999,
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                  <span>{percent}% Funded</span>
                  <span>Section 80G Certified</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Donation Form & Honor Roll Split */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(340px, 1.2fr) minmax(320px, 0.8fr)', gap: '2rem' }}>
        {/* Donation Form */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CreditCard size={18} color="#60a5fa" />
            Contribute to {selectedCampaign?.title || 'Selected Campaign'}
          </h3>
          <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
            Funds directly credited to the Gujarat Higher Education Endowment Escrow. 80G Tax receipt generated upon payment completion.
          </p>

          <form onSubmit={handleDonate}>
            {/* Quick Amount Pills */}
            <div className="form-group">
              <label className="form-label">Select Contribution Tier (INR)</label>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                {['1000', '2500', '5000', '10000', '25000', '50000'].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setDonationAmount(amt)}
                    style={{
                      padding: '0.4rem 0.85rem',
                      borderRadius: 6,
                      background: donationAmount === amt ? '#10b981' : 'rgba(255, 255, 255, 0.06)',
                      color: donationAmount === amt ? '#fff' : 'var(--text-main)',
                      border: '1px solid var(--border-color)',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    ₹{Number(amt).toLocaleString()}
                  </button>
                ))}
              </div>
              <input
                type="number"
                className="form-input"
                placeholder="Or enter custom amount in INR"
                value={donationAmount}
                onChange={(e) => setDonationAmount(e.target.value)}
                min="100"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Donor Permanent Account Number (PAN) for 80G Tax Exemption</label>
              <input
                type="text"
                className="form-input"
                placeholder="ABCDE1234F"
                value={donorPan}
                onChange={(e) => setDonorPan(e.target.value.toUpperCase())}
                style={{ textTransform: 'uppercase', letterSpacing: '0.1em' }}
                required
              />
              <span style={{ fontSize: '0.725rem', color: 'var(--text-dim)', marginTop: '0.25rem', display: 'block' }}>
                Required under Income Tax Department Rule 18AB for generating Form 10BE certificate.
              </span>
            </div>

            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                />
                Keep my name anonymous on the public Donor Honor Roll
              </label>
            </div>

            <button
              type="submit"
              className="btn btn-success"
              style={{ width: '100%', padding: '0.85rem', fontSize: '0.95rem' }}
              disabled={paying}
            >
              <HeartHandshake size={18} />
              {paying ? 'Processing Razorpay Payment...' : `Contribute ₹${Number(donationAmount || 0).toLocaleString()} (80G Deductible)`}
            </button>
          </form>
        </div>

        {/* Donor Honor Roll */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={18} color="#fbbf24" /> Alumni Donor Honor Roll
          </h3>
          <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
            Recognizing visionary alumni leaders funding scholarships and infrastructure.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {honorRoll.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Loading honor roll...</p>
            ) : (
              honorRoll.map((donor, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem 1rem',
                    background: 'rgba(255, 255, 255, 0.03)',
                    borderRadius: 8,
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        background: idx === 0 ? '#f59e0b' : idx === 1 ? '#94a3b8' : '#cd7f32',
                        color: '#000',
                        fontWeight: 800,
                        fontSize: '0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {idx + 1}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{donor.donorName}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{donor.tier}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#34d399' }}>
                    ₹{donor.totalContributed.toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

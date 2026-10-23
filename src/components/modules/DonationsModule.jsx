import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { api } from '../../services/api.js';
import {
  HeartHandshake,
  Download,
  CheckCircle2,
  Sparkles,
  CreditCard,
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
      const orderRes = await api.donations.createOrder({
        campaignId: selectedCampaign._id,
        donorId: currentUser._id,
        amount: Number(donationAmount),
        donorPan,
        isAnonymous,
      });

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
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <span>Endowments & 80G Tax Exemption</span>
          <span className="badge badge-referral" style={{ fontSize: '0.8rem' }}>50% DEDUCTION</span>
        </h1>
        <p style={{ marginTop: '0.5rem', fontSize: '1.05rem', maxWidth: '75ch' }}>
          Every rupee donated is eligible for 50% statutory tax deductions under Section 80G of the Income Tax Act, 1961, with instant computerized Form 10BE certificates.
        </p>
      </div>

      {/* Completed Donation Success Alert */}
      {completedDonation && (
        <div
          className="glass-panel"
          style={{
            padding: '2rem',
            marginBottom: '2.5rem',
            border: '2px solid var(--accent)',
            background: 'var(--bg-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1.25rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <CheckCircle2 color="var(--accent)" size={36} />
            <div>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase' }}>
                Donation of ₹{completedDonation.amount.toLocaleString()} Successful!
              </h3>
              <p style={{ fontSize: '0.9rem', color: '#FAFAFA', marginTop: '0.25rem' }}>
                80G Tax Exemption Certificate Issued: <strong style={{ color: 'var(--accent)' }}>{completedDonation.taxReceiptNumber}</strong>
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              const win = window.open('', '_blank');
              win.document.write(activeReceiptHtml);
              win.document.close();
            }}
            className="btn btn-primary"
            style={{ gap: '0.5rem' }}
          >
            <Download size={16} /> View & Print 80G Tax Receipt
          </button>
        </div>
      )}

      {/* Active Campaigns Grid */}
      <div style={{ marginBottom: '3rem' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '1.5rem', textTransform: 'uppercase' }}>
          Active Gujarat College Endowment Campaigns
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.75rem' }}>
          {campaigns.map((camp) => {
            const percent = Math.min(100, Math.round((camp.currentAmount / camp.targetAmount) * 100));
            const isSelected = selectedCampaign?._id === camp._id;

            return (
              <div
                key={camp._id}
                onClick={() => setSelectedCampaign(camp)}
                className="glass-panel interactive"
                style={{
                  padding: '2rem',
                  cursor: 'pointer',
                  borderColor: isSelected ? 'var(--accent)' : 'var(--border-color)',
                  background: isSelected ? '#141419' : 'var(--bg-card)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <span className="badge badge-referral">{camp.category}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>{camp.collegeId?.name}</span>
                </div>

                <h3 style={{ fontSize: '1.3rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.65rem' }}>{camp.title}</h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.5rem', minHeight: 45 }}>
                  {camp.description}
                </p>

                {/* Progress bar */}
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.5rem', fontFamily: 'Space Grotesk, sans-serif' }}>
                    <span style={{ color: 'var(--accent)' }}>₹{camp.currentAmount.toLocaleString()}</span>
                    <span style={{ color: 'var(--text-muted)' }}>Goal: ₹{camp.targetAmount.toLocaleString()}</span>
                  </div>
                  <div style={{ height: 10, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${percent}%`,
                        height: '100%',
                        background: 'var(--accent)',
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, fontFamily: 'Space Grotesk, sans-serif' }}>
                  <span style={{ color: '#FAFAFA' }}>{percent}% Funded</span>
                  <span style={{ color: '#10b981' }}>Section 80G Certified</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Donation Form & Honor Roll Split */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(340px, 1.2fr) minmax(320px, 0.8fr)', gap: '2rem' }}>
        {/* Donation Form */}
        <div className="glass-panel" style={{ padding: '2.5rem' }}>
          <h3 style={{ fontSize: '1.35rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <CreditCard size={20} color="var(--accent)" />
            Contribute to {selectedCampaign?.title || 'Selected Campaign'}
          </h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '2rem' }}>
            Funds directly credited to the Gujarat Higher Education Endowment Escrow. 80G Tax receipt generated upon payment completion.
          </p>

          <form onSubmit={handleDonate}>
            {/* Quick Amount Pills */}
            <div className="form-group">
              <label className="form-label">Select Contribution Tier (INR)</label>
              <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                {['1000', '2500', '5000', '10000', '25000', '50000'].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setDonationAmount(amt)}
                    style={{
                      padding: '0.55rem 1.15rem',
                      background: donationAmount === amt ? 'var(--accent)' : 'var(--bg-secondary)',
                      color: donationAmount === amt ? '#000000' : '#FAFAFA',
                      border: '2px solid',
                      borderColor: donationAmount === amt ? 'var(--accent)' : 'var(--border-color)',
                      fontSize: '0.85rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      fontFamily: 'Space Grotesk, sans-serif',
                      textTransform: 'uppercase',
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
                style={{ textTransform: 'uppercase', letterSpacing: '0.12em', fontFamily: 'monospace', fontSize: '1rem' }}
                required
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.35rem', display: 'block', textTransform: 'uppercase' }}>
                Required under Income Tax Department Rule 18AB for generating Form 10BE certificate.
              </span>
            </div>

            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', fontSize: '0.85rem', cursor: 'pointer', color: 'var(--text-muted)', fontFamily: 'Space Grotesk, sans-serif', textTransform: 'uppercase', fontWeight: 600 }}>
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  style={{ width: 16, height: 16, accentColor: 'var(--accent)' }}
                />
                Keep my name anonymous on the public Donor Honor Roll
              </label>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '1rem', fontSize: '1rem' }}
              disabled={paying}
            >
              <HeartHandshake size={20} />
              {paying ? 'Processing Payment...' : `Contribute ₹${Number(donationAmount || 0).toLocaleString()} (80G Deductible)`}
            </button>
          </form>
        </div>

        {/* Donor Honor Roll */}
        <div className="glass-panel" style={{ padding: '2.5rem' }}>
          <h3 style={{ fontSize: '1.35rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <Sparkles size={20} color="var(--accent)" /> Alumni Donor Honor Roll
          </h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.75rem' }}>
            Recognizing visionary alumni leaders funding scholarships and campus modernization.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {honorRoll.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'uppercase' }}>Loading honor roll...</p>
            ) : (
              honorRoll.map((donor, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '1rem 1.25rem',
                    background: 'var(--bg-secondary)',
                    border: '2px solid var(--border-color)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        background: idx === 0 ? 'var(--accent)' : 'var(--bg-primary)',
                        color: idx === 0 ? '#000000' : 'var(--text-main)',
                        fontWeight: 900,
                        fontSize: '0.85rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '2px solid',
                        borderColor: idx === 0 ? 'var(--accent)' : 'var(--border-color)',
                        fontFamily: 'Space Grotesk, sans-serif',
                      }}
                    >
                      {idx + 1}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 800, textTransform: 'uppercase', fontFamily: 'Space Grotesk, sans-serif' }}>{donor.donorName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--accent)', textTransform: 'uppercase', fontWeight: 600 }}>{donor.tier}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#FAFAFA', fontFamily: 'Space Grotesk, sans-serif' }}>
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

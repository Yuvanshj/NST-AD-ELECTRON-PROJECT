import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { app } from '../server/index.js';
import { connectDB, disconnectDB } from '../server/config/db.js';
import { seedDatabase } from '../server/seed/seedData.js';

let server;
let baseUrl;

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  await connectDB();
  await seedDatabase();

  await new Promise((resolve) => {
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}/api`;
      resolve();
    });
  });
});

afterAll(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  await disconnectDB();
});

describe('MahaSetu Backend API Suite (Node.js + Express + MongoDB)', () => {
  it('GET /health returns healthy status and platform metadata', async () => {
    const res = await fetch(`${baseUrl}/health`);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.status).toBe('healthy');
    expect(data.version).toBe('2.0.0-react-mongo');
  });

  it('POST /auth/login authenticates verified alumnus Hardik Patel', async () => {
    const res = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'hardik.patel@alum.ldce.ac.in',
        password: 'Password@123',
      }),
    });
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.user.name).toBe('Hardik Patel');
    expect(data.user.role).toBe('ALUMNI');
    expect(data.user.verificationStatus).toBe('VERIFIED');
    expect(data.user.gtuEnrollment).toBe('120280107042');
  });

  it('GET /verification/pending returns pending alumni verification requests for registrars', async () => {
    const res = await fetch(`${baseUrl}/verification/pending`);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(Array.isArray(data.requests)).toBe(true);
    expect(data.requests.length).toBeGreaterThan(0);
    expect(data.requests[0].gtuEnrollment).toBeDefined();
  });

  it('GET /directory returns verified alumni directory with college details', async () => {
    const res = await fetch(`${baseUrl}/directory?isMentor=true`);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(Array.isArray(data.alumni)).toBe(true);
    expect(data.alumni.length).toBeGreaterThan(0);
    expect(data.alumni[0].collegeId).toBeDefined();
  });

  it('GET /jobs returns job opportunities with alumni referral tags', async () => {
    const res = await fetch(`${baseUrl}/jobs?hasReferral=true`);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(Array.isArray(data.jobs)).toBe(true);
    expect(data.jobs.length).toBeGreaterThan(0);
    expect(data.jobs[0].isReferralAvailable).toBe(true);
  });

  it('POST /donations/create-order and /verify-payment generates instant 80G tax receipt', async () => {
    // 1. Get campaigns
    const campRes = await fetch(`${baseUrl}/donations/campaigns`);
    const campData = await campRes.json();
    const campaign = campData.campaigns[0];
    expect(campaign).toBeDefined();

    // 2. Get user
    const userRes = await fetch(`${baseUrl}/directory`);
    const userData = await userRes.json();
    const donor = userData.alumni[0];

    // 3. Create order
    const orderRes = await fetch(`${baseUrl}/donations/create-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        campaignId: campaign._id,
        donorId: donor._id,
        amount: 2500,
        donorPan: 'ABCDE1234F',
        isAnonymous: false,
      }),
    });
    const orderData = await orderRes.json();
    expect(orderRes.status).toBe(200);
    expect(orderData.success).toBe(true);

    // 4. Verify simulated payment
    const verifyRes = await fetch(`${baseUrl}/donations/verify-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        donationId: orderData.donation._id,
        razorpayPaymentId: 'pay_test_suite_123',
        razorpaySignature: 'sig_test_suite_456',
      }),
    });
    const verifyData = await verifyRes.json();
    expect(verifyRes.status).toBe(200);
    expect(verifyData.success).toBe(true);
    expect(verifyData.donation.paymentStatus).toBe('PAID');
    expect(verifyData.donation.taxReceiptNumber).toMatch(/^80G-GOG-/);
    expect(verifyData.receiptHtml).toContain('SECTION 80G TAX EXEMPTION CERTIFICATE');
  });

  it('POST /events/:id/rsvp generates QR ticket pass and verifies desk check-in', async () => {
    // 1. Get events
    const evRes = await fetch(`${baseUrl}/events`);
    const evData = await evRes.json();
    const event = evData.events[0];
    expect(event).toBeDefined();

    // 2. Get user
    const userRes = await fetch(`${baseUrl}/directory`);
    const userData = await userRes.json();
    const attendee = userData.alumni[0];

    // 3. RSVP
    const rsvpRes = await fetch(`${baseUrl}/events/${event._id}/rsvp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: attendee._id }),
    });
    const rsvpData = await rsvpRes.json();
    expect(rsvpRes.status).toBe(200);
    expect(rsvpData.success).toBe(true);
    expect(rsvpData.rsvp.ticketNumber).toMatch(/^TKT-/);
    expect(rsvpData.rsvp.qrCode).toMatch(/^data:image\/png;base64,/);

    // 4. Check-in with ticket
    const checkInRes = await fetch(`${baseUrl}/events/${event._id}/check-in`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ticketNumber: rsvpData.rsvp.ticketNumber,
        adminId: attendee._id,
      }),
    });
    const checkInData = await checkInRes.json();
    expect(checkInRes.status).toBe(200);
    expect(checkInData.success).toBe(true);
    expect(checkInData.rsvp.isCheckedIn).toBe(true);
  });

  it('GET /donations/ledger returns transparent public inflows and disbursements', async () => {
    const res = await fetch(`${baseUrl}/donations/ledger`);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(Array.isArray(data.donations)).toBe(true);
    expect(Array.isArray(data.disbursements)).toBe(true);
  });

  it('GET /analytics/dashboard returns Gujarat Technical Education KPIs', async () => {
    const res = await fetch(`${baseUrl}/analytics/dashboard`);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.stats.totalAlumni).toBeGreaterThan(0);
    expect(data.stats.verificationRate).toBeDefined();
  });

  it('GET /audit returns immutable system activity logs', async () => {
    const res = await fetch(`${baseUrl}/audit`);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.logs.length).toBeGreaterThan(0);
  });
});

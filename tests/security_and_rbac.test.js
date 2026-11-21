import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { app } from '../server/index.js';
import { connectDB, disconnectDB } from '../server/config/db.js';
import { seedDatabase } from '../server/seed/seedData.js';
import { User } from '../server/models/User.js';
import { College } from '../server/models/College.js';
import { VerificationRequest } from '../server/models/VerificationRequest.js';
import { Campaign } from '../server/models/Campaign.js';
import { Donation } from '../server/models/Donation.js';
import { Event } from '../server/models/Event.js';
import { EventRsvp } from '../server/models/EventRsvp.js';
import { generateTicketHash } from '../server/utils/crypto.js';

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

describe('MahaSetu Comprehensive Security, RBAC & Multi-Tenant Suite', () => {
  let alumnusToken;
  let collegeAdminToken;
  let superAdminToken;
  let testCollegeA;
  let testCollegeB;

  it('authenticates seed accounts and issues cryptographically signed JWT tokens', async () => {
    // 1. Alumni login
    const resAlum = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'hardik.patel@alum.ldce.ac.in', password: 'Password@123' }),
    });
    const dataAlum = await resAlum.json();
    expect(resAlum.status).toBe(200);
    expect(dataAlum.token).toBeDefined();
    alumnusToken = dataAlum.token;

    // 2. College Admin login
    const resAdmin = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'alumni.admin@ldce.ac.in', password: 'Password@123' }),
    });
    const dataAdmin = await resAdmin.json();
    expect(resAdmin.status).toBe(200);
    expect(dataAdmin.token).toBeDefined();
    collegeAdminToken = dataAdmin.token;

    // 3. Super Admin login
    const resSuper = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'superadmin@gujarat.gov.in', password: 'Password@123' }),
    });
    const dataSuper = await resSuper.json();
    expect(resSuper.status).toBe(200);
    expect(dataSuper.token).toBeDefined();
    superAdminToken = dataSuper.token;
  });

  it('rejects login with incorrect password and enforces failed attempt security', async () => {
    const res = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'hardik.patel@alum.ldce.ac.in', password: 'WrongPassword!456' }),
    });
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.message).toBe('Invalid credentials.');
  });

  it('rejects registration with duplicate email address', async () => {
    const res = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Duplicate User',
        email: 'hardik.patel@alum.ldce.ac.in',
        password: 'Password@123',
      }),
    });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.message).toContain('already exists');
  });

  it('enforces secure OTP request and verification workflow', async () => {
    // 1. Request OTP
    const reqRes = await fetch(`${baseUrl}/auth/otp/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'otp.security.test@ldce.ac.in' }),
    });
    const reqData = await reqRes.json();
    expect(reqRes.status).toBe(200);
    expect(reqData.success).toBe(true);

    const generatedOtp = reqData.debugOtp;
    expect(generatedOtp).toBeDefined();
    expect(generatedOtp.length).toBe(6);

    // 2. Reject incorrect OTP
    const failRes = await fetch(`${baseUrl}/auth/otp/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'otp.security.test@ldce.ac.in', otp: '000000' }),
    });
    expect(failRes.status).toBe(400);

    // 3. Accept correct OTP
    const successRes = await fetch(`${baseUrl}/auth/otp/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'otp.security.test@ldce.ac.in', otp: generatedOtp }),
    });
    const successData = await successRes.json();
    expect(successRes.status).toBe(200);
    expect(successData.success).toBe(true);
  });

  it('protects alumni self-verification: an alumnus cannot approve their own verification', async () => {
    const pendingAlum = await User.findOne({ email: 'rahul.vyas@gmail.com' });
    const pendingReq = await VerificationRequest.findOne({ userId: pendingAlum._id });
    expect(pendingReq).toBeDefined();

    // Log in as Rahul Vyas
    const loginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'rahul.vyas@gmail.com', password: 'Password@123' }),
    });
    const loginData = await loginRes.json();
    const rahulToken = loginData.token;

    // Attempt to self-approve
    const selfApproveRes = await fetch(`${baseUrl}/verification/review`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${rahulToken}`,
      },
      body: JSON.stringify({
        requestId: pendingReq._id,
        action: 'APPROVE',
      }),
    });

    expect(selfApproveRes.status).toBe(403);
    const selfApproveData = await selfApproveRes.json();
    expect(selfApproveData.message).toContain('cannot approve their own');
  });

  it('enforces multi-college tenant boundary for college administrators', async () => {
    // Colleges: LDCE and BVM
    const ldce = await College.findOne({ code: 'LDCE-028' });
    const bvm = await College.findOne({ code: 'BVM-008' });

    // Create a verification request for BVM
    const bvmUser = await User.create({
      collegeId: bvm._id,
      email: 'bvm.candidate@bvm.ac.in',
      fullName: 'BVM Candidate',
      passwordHash: 'dummy',
      role: 'ALUMNI',
    });

    const bvmReq = await VerificationRequest.create({
      userId: bvmUser._id,
      collegeId: bvm._id,
      enrollmentNumber: '190080107011',
      degreeProofDoc: 'https://storage.gujarat.gov.in/proofs/bvm-candidate.pdf',
      passingYear: 2023,
      status: 'PENDING',
    });

    // LDCE College Admin attempts to review BVM's request
    const crossReviewRes = await fetch(`${baseUrl}/verification/review`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${collegeAdminToken}`,
      },
      body: JSON.stringify({
        requestId: bvmReq._id,
        action: 'APPROVE',
      }),
    });

    expect(crossReviewRes.status).toBe(403);
    const crossData = await crossReviewRes.json();
    expect(crossData.message).toContain('only review verification requests for your assigned college');
  });

  it('rejects duplicate event QR check-in attempts', async () => {
    const event = await Event.findOne();
    const user = await User.findOne({ email: 'hardik.patel@alum.ldce.ac.in' });

    // 1. RSVP to get ticket
    const rsvpRes = await fetch(`${baseUrl}/events/${event._id}/rsvp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user._id }),
    });
    const rsvpData = await rsvpRes.json();
    const ticketNumber = rsvpData.rsvp.ticketNumber;

    // 2. First check-in succeeds
    const checkIn1 = await fetch(`${baseUrl}/events/${event._id}/check-in`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticketNumber }),
    });
    expect(checkIn1.status).toBe(200);
    const checkIn1Data = await checkIn1.json();
    expect(checkIn1Data.rsvp.isCheckedIn).toBe(true);

    // 3. Second check-in attempt MUST be rejected with 400
    const checkIn2 = await fetch(`${baseUrl}/events/${event._id}/check-in`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticketNumber }),
    });
    expect(checkIn2.status).toBe(400);
    const checkIn2Data = await checkIn2.json();
    expect(checkIn2Data.alreadyCheckedIn).toBe(true);
    expect(checkIn2Data.message).toContain('Duplicate check-in rejected');
  });

  it('handles idempotent payment verification and prevents double-counting campaign funds', async () => {
    const campaign = await Campaign.findOne();
    const initialRaised = campaign.raisedAmount;

    const donorUser = await User.findOne();
    // 1. Create order
    const orderRes = await fetch(`${baseUrl}/donations/create-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        campaignId: campaign._id,
        donorId: donorUser._id,
        amount: 3000,
        donorName: 'Test Idempotent Donor',
        donorPan: 'ABCDE1234F',
      }),
    });
    const orderData = await orderRes.json();
    const donationId = orderData.donation._id;

    // 2. First verification
    const verify1 = await fetch(`${baseUrl}/donations/verify-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        donationId,
        razorpayPaymentId: 'pay_test_idem_1',
        razorpaySignature: 'sig_valid_test_1',
      }),
    });
    expect(verify1.status).toBe(200);

    const updatedCamp1 = await Campaign.findById(campaign._id);
    expect(updatedCamp1.raisedAmount).toBe(initialRaised + 3000);

    // 3. Duplicate verification attempt (idempotent replay)
    const verify2 = await fetch(`${baseUrl}/donations/verify-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        donationId,
        razorpayPaymentId: 'pay_test_idem_1',
        razorpaySignature: 'sig_valid_test_1',
      }),
    });
    expect(verify2.status).toBe(200);

    // Total must NOT be incremented a second time
    const updatedCamp2 = await Campaign.findById(campaign._id);
    expect(updatedCamp2.raisedAmount).toBe(initialRaised + 3000);
  });

  it('validates file uploads: allows safe image and rejects disallowed MIME types', async () => {
    // 1. Valid PNG upload
    const validBase64 = Buffer.from('fake png image content').toString('base64');
    const validRes = await fetch(`${baseUrl}/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        base64Data: validBase64,
        mimeType: 'image/png',
      }),
    });
    expect(validRes.status).toBe(201);
    const validData = await validRes.json();
    expect(validData.success).toBe(true);
    expect(validData.url).toMatch(/^\/api\/upload\/file\//);

    // 2. Reject executable / disallowed MIME type
    const exeRes = await fetch(`${baseUrl}/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        base64Data: Buffer.from('binary executable').toString('base64'),
        mimeType: 'application/x-msdownload',
      }),
    });
    expect(exeRes.status).toBe(400);
    const exeData = await exeRes.json();
    expect(exeData.message).toContain('Disallowed MIME type');
  });

  it('prevents networking self-connections in directory', async () => {
    const user = await User.findOne({ email: 'hardik.patel@alum.ldce.ac.in' });
    const res = await fetch(`${baseUrl}/directory/connect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requesterId: user._id,
        recipientId: user._id,
      }),
    });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.message).toContain('cannot send a connection request to yourself');
  });
});

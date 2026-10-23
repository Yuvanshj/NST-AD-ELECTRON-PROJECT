import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { app } from '../server/index.js';
import { connectDB, disconnectDB } from '../server/config/db.js';
import { seedDatabase } from '../server/seed/seedData.js';
import { User } from '../server/models/User.js';

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

describe('Referral Job Board End-to-End Suite', () => {
  let alumnusUser;
  let studentUser;
  let createdJobId;
  let createdAppId;

  it('identifies test users from seeded database', async () => {
    alumnusUser = await User.findOne({ email: 'hardik.patel@alum.ldce.ac.in' });
    studentUser = await User.findOne({ email: 'meet.joshi@student.ldce.ac.in' });

    expect(alumnusUser).not.toBeNull();
    expect(studentUser).not.toBeNull();
  });

  it('POST /jobs creates a new opening with alumni referral pledge and normalized fields', async () => {
    const res = await fetch(`${baseUrl}/jobs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        postedBy: alumnusUser._id,
        title: 'Senior Cloud Platform Engineer',
        company: 'TCS Digital Gujarat',
        location: 'Gandhinagar (Gift City)',
        jobType: 'FULL_TIME',
        salaryRange: '₹18 - 24 LPA',
        description: 'Building distributed cloud services for international enterprise clients.',
        skillsRequired: 'Node.js, Docker, Kubernetes, AWS',
        isReferralAvailable: true,
        referralInstructions: 'I will personally refer top LDCE/GTU graduates with fullstack projects.',
      }),
    });

    const data = await res.json();
    expect(res.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.job).toBeDefined();
    expect(data.job.canRefer).toBe(true);
    expect(data.job.employmentType).toBe('FULL_TIME');
    createdJobId = data.job._id;
  });

  it('GET /jobs returns job with both employmentType and jobType alias for safe rendering', async () => {
    const res = await fetch(`${baseUrl}/jobs?hasReferral=true`);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.jobs.length).toBeGreaterThan(0);

    const found = data.jobs.find((j) => j._id === createdJobId);
    expect(found).toBeDefined();
    expect(found.jobType).toBe('FULL_TIME');
    expect(found.employmentType).toBe('FULL_TIME');
    expect(found.isReferralAvailable).toBe(true);
    expect(found.canRefer).toBe(true);
  });

  it('POST /jobs/apply records candidate referral request with pitch and resume', async () => {
    const res = await fetch(`${baseUrl}/jobs/apply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jobId: createdJobId,
        applicantId: studentUser._id,
        resumeUrl: 'https://drive.google.com/sample-meet-joshi.pdf',
        coverLetter: 'I have built 3 production apps with React and Node.js on GitHub.',
        requestReferral: true,
      }),
    });

    const data = await res.json();
    expect(res.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.application).toBeDefined();
    expect(data.application.referralRequested).toBe(true);
    expect(data.application.status).toBe('APPLIED');
    createdAppId = data.application._id;
  });

  it('GET /jobs/applications/:userId returns submitted applications for student', async () => {
    const res = await fetch(`${baseUrl}/jobs/applications/${studentUser._id}`);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.applications.length).toBeGreaterThan(0);
    expect(data.applications[0].job).toBeDefined();
  });

  it('GET /jobs/poster/:posterId returns candidates in alumni referral pipeline', async () => {
    const res = await fetch(`${baseUrl}/jobs/poster/${alumnusUser._id}`);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(Array.isArray(data.postings)).toBe(true);

    const myPosting = data.postings.find((p) => p.job._id === createdJobId);
    expect(myPosting).toBeDefined();
    expect(myPosting.applications.length).toBe(1);
    expect(myPosting.applications[0].applicantEmail).toBe('meet.joshi@student.ldce.ac.in');
  });

  it('PUT /jobs/application/:id/status updates referral status to REFERRED', async () => {
    const res = await fetch(`${baseUrl}/jobs/application/${createdAppId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'REFERRED' }),
    });

    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.application.status).toBe('REFERRED');
  });
});

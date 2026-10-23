import { College } from '../models/College.js';
import { User } from '../models/User.js';
import { Profile } from '../models/Profile.js';
import { VerificationRequest } from '../models/VerificationRequest.js';
import { Job } from '../models/Job.js';
import { JobApplication } from '../models/JobApplication.js';
import { Campaign } from '../models/Campaign.js';
import { Donation } from '../models/Donation.js';
import { FundDisbursement } from '../models/FundDisbursement.js';
import { Event } from '../models/Event.js';
import { EventRsvp } from '../models/EventRsvp.js';
import { Story } from '../models/Story.js';
import { Survey, SurveyResponse } from '../models/Survey.js';
import { Notification } from '../models/Notification.js';
import { Connection } from '../models/Connection.js';
import { MentorshipRequest } from '../models/MentorshipRequest.js';
import { Message } from '../models/Message.js';
import { AuditLog } from '../models/AuditLog.js';
import { hashPassword } from '../utils/crypto.js';
import { generateTicketQrCode } from '../utils/qrGenerator.js';
import { generate80GReceiptHtml } from '../utils/receiptGenerator.js';

export async function seedDatabaseIfEmpty() {
  const count = await College.countDocuments();
  if (count > 0) {
    return; // Already seeded
  }

  console.log('Seeding Gujarat State Education alumni database...');

  // 1. Colleges
  const ldce = await College.create({
    code: 'LDCE-028',
    name: 'L.D. College of Engineering (LDCE)',
    city: 'Ahmedabad',
    state: 'Gujarat',
    establishedYear: 1948,
    website: 'https://ldce.ac.in',
    logoUrl: 'https://images.unsplash.com/photo-1562774053-701939374585?w=100&auto=format&fit=crop',
  });

  const bvm = await College.create({
    code: 'BVM-008',
    name: 'Birla Vishvakarma Mahavidyalaya (BVM)',
    city: 'Vallabh Vidyanagar',
    state: 'Gujarat',
    establishedYear: 1948,
    website: 'https://bvmengineering.ac.in',
    logoUrl: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=100&auto=format&fit=crop',
  });

  const vgec = await College.create({
    code: 'VGEC-017',
    name: 'Vishwakarma Govt. Engineering College (VGEC)',
    city: 'Chandkheda, Ahmedabad',
    state: 'Gujarat',
    establishedYear: 1994,
    website: 'https://vgecg.ac.in',
    logoUrl: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=100&auto=format&fit=crop',
  });

  // 2. Users
  const superAdmin = await User.create({
    collegeId: ldce._id,
    email: 'superadmin@gujarat.gov.in',
    phone: '+91 79 23250000',
    passwordHash: hashPassword('admin123'),
    role: 'SUPER_ADMIN',
    fullName: 'Dr. Jayeshbhai Patel (State Coordinator)',
  });

  const collegeAdmin = await User.create({
    collegeId: ldce._id,
    email: 'alumni.admin@ldce.ac.in',
    phone: '+91 9825012345',
    passwordHash: hashPassword('admin123'),
    role: 'COLLEGE_ADMIN',
    fullName: 'Prof. Anitaben Shah (LDCE Alumni Dean)',
  });

  const alumni1 = await User.create({
    collegeId: ldce._id,
    email: 'hardik.patel@alum.ldce.ac.in',
    phone: '+91 9909012345',
    passwordHash: hashPassword('alumni123'),
    role: 'ALUMNI',
    fullName: 'Hardik Patel',
  });

  const alumni2 = await User.create({
    collegeId: ldce._id,
    email: 'priya.desai@alum.ldce.ac.in',
    phone: '+91 9879054321',
    passwordHash: hashPassword('alumni123'),
    role: 'ALUMNI',
    fullName: 'Priya Desai',
  });

  const alumniPending = await User.create({
    collegeId: ldce._id,
    email: 'rahul.vyas@gmail.com',
    phone: '+91 9723045678',
    passwordHash: hashPassword('alumni123'),
    role: 'ALUMNI',
    fullName: 'Rahul Vyas',
  });

  const student1 = await User.create({
    collegeId: ldce._id,
    email: 'meet.joshi@student.ldce.ac.in',
    phone: '+91 9428076543',
    passwordHash: hashPassword('student123'),
    role: 'STUDENT',
    fullName: 'Meet Joshi',
  });

  // 3. Profiles
  await Profile.create({
    userId: superAdmin._id,
    batch: 1995,
    branch: 'Mechanical Engineering',
    enrollmentNumber: '950280102001',
    currentCompany: 'Gujarat Education Department',
    designation: 'Director of Technical Education',
    industry: 'Public Sector / Higher Education',
    city: 'Gandhinagar',
    country: 'India',
    skills: ['Educational Policy', 'Institutional Leadership', 'Governance'],
    bio: 'Leading higher education digital transformation across all Gujarat state engineering colleges.',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop',
    verificationStatus: 'VERIFIED',
    verifiedAt: new Date(),
    badge: 'DISTINGUISHED_ALUMNUS',
  });

  await Profile.create({
    userId: collegeAdmin._id,
    batch: 2002,
    branch: 'Computer Engineering',
    enrollmentNumber: '020280107011',
    currentCompany: 'L.D. College of Engineering',
    designation: 'Associate Professor & Alumni Coordinator',
    industry: 'Higher Education',
    city: 'Ahmedabad',
    country: 'India',
    skills: ['Computer Networks', 'Alumni Relations', 'Student Welfare'],
    bio: 'Managing LDCE alumni affairs and empowering future engineers.',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop',
    verificationStatus: 'VERIFIED',
    verifiedAt: new Date(),
    isMentor: true,
    mentorDomain: 'Higher Studies & Academics',
    mentorMaxMentees: 5,
    mentorAvailability: 'Saturdays 3 PM - 5 PM',
    badge: 'FOUNDING_MEMBER',
  });

  await Profile.create({
    userId: alumni1._id,
    batch: 2016,
    branch: 'Computer Engineering',
    enrollmentNumber: '120280107042',
    currentCompany: 'Google India',
    designation: 'Staff Software Engineer',
    industry: 'Information Technology',
    city: 'Bengaluru',
    country: 'India',
    skills: ['Distributed Systems', 'Go', 'Kubernetes', 'Cloud Infrastructure', 'System Design'],
    bio: 'Alumnus from 2016 batch. Passionate about mentoring students and giving back to LDCE.',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop',
    verificationStatus: 'VERIFIED',
    verifiedAt: new Date(),
    verifiedBy: collegeAdmin._id,
    isMentor: true,
    mentorDomain: 'Software Engineering & Cloud Computing',
    mentorMaxMentees: 4,
    mentorAvailability: 'Weekends 10 AM - 12 PM',
    badge: 'VERIFIED_ALUMNUS',
  });

  await Profile.create({
    userId: alumni2._id,
    batch: 2018,
    branch: 'Information Technology',
    enrollmentNumber: '140280116029',
    currentCompany: 'Amazon Web Services (AWS)',
    designation: 'Senior Solutions Architect',
    industry: 'Cloud & DevOps',
    city: 'Ahmedabad',
    country: 'India',
    skills: ['AWS', 'Serverless', 'DevOps', 'Fintech', 'Microservices'],
    bio: 'Helping startups and enterprises build secure resilient architectures.',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop',
    verificationStatus: 'VERIFIED',
    verifiedAt: new Date(),
    verifiedBy: collegeAdmin._id,
    isMentor: true,
    mentorDomain: 'Cloud Architecture & Career Transitions',
    mentorMaxMentees: 3,
    mentorAvailability: 'Sunday Mornings',
    badge: 'VERIFIED_ALUMNUS',
  });

  await Profile.create({
    userId: alumniPending._id,
    batch: 2021,
    branch: 'Mechanical Engineering',
    enrollmentNumber: '170280119098',
    currentCompany: 'Adani Green Energy',
    designation: 'Assistant Manager (Turbine Dynamics)',
    industry: 'Renewable Energy',
    city: 'Ahmedabad',
    country: 'India',
    skills: ['Renewable Energy', 'Thermodynamics', 'AutoCAD', 'SolidWorks'],
    bio: 'Working on wind turbine optimization at Khavda Renewable Park.',
    avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop',
    verificationStatus: 'PENDING',
    badge: 'NONE',
  });

  await Profile.create({
    userId: student1._id,
    batch: 2027,
    branch: 'Computer Engineering',
    enrollmentNumber: '230280107088',
    currentCompany: 'Student at LDCE (Final Year)',
    designation: 'Student / Aspiring Software Engineer',
    industry: 'Information Technology',
    city: 'Ahmedabad',
    country: 'India',
    skills: ['React', 'TypeScript', 'Node.js', 'Data Structures & Algorithms'],
    bio: 'Final year CE student looking for mentorship in Distributed Systems.',
    avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop',
    verificationStatus: 'VERIFIED',
    badge: 'NONE',
  });

  // 4. Verification Requests
  await VerificationRequest.create({
    userId: alumniPending._id,
    collegeId: ldce._id,
    enrollmentNumber: '170280119098',
    degreeProofDoc: 'https://docs.gujarat.gov.in/degrees/ldce_170280119098_provisional.pdf',
    passingYear: 2021,
    status: 'PENDING',
    notes: 'Submitted GTU provisional degree certificate and final semester mark sheet.',
  });

  // 5. Connections
  await Connection.create({
    requesterId: alumni1._id,
    receiverId: alumni2._id,
    status: 'ACCEPTED',
    respondedAt: new Date(),
  });

  // 6. Mentorship Request
  await MentorshipRequest.create({
    mentorId: alumni1._id,
    menteeId: student1._id,
    topic: 'Cracking Product Company Interviews & Distributed Systems',
    message: 'Respected Hardik Sir, I would love guidance on preparing for System Design interviews.',
    status: 'ACCEPTED',
    respondedAt: new Date(),
  });

  // 7. Messages
  await Message.create({
    senderId: student1._id,
    receiverId: alumni1._id,
    content: 'Hello Hardik Sir, thank you for accepting my mentorship request! When would you be free for an introductory call?',
    isRead: true,
  });

  await Message.create({
    senderId: alumni1._id,
    receiverId: student1._id,
    content: 'Hi Meet! Happy to help a fellow LDCEian. Let us sync this Saturday at 11 AM.',
    isRead: true,
  });

  // 8. Jobs
  const job1 = await Job.create({
    posterId: alumni1._id,
    collegeId: ldce._id,
    title: 'Software Engineer II - Cloud Backend',
    company: 'Google',
    location: 'Bengaluru / Hybrid',
    employmentType: 'FULL_TIME',
    experienceYears: '1-3 Years',
    skillsRequired: ['Go', 'Distributed Systems', 'gRPC', 'PostgreSQL'],
    salaryRange: '₹28,00,000 - ₹35,00,000 PA',
    description: 'Building high-throughput storage orchestration infrastructure. Strong algorithmic fundamentals required.',
    canRefer: true,
    referralInstructions: 'I will personally refer qualified LDCE alumni and students who solve medium LeetCode and have solid fundamentals.',
    deadline: '2026-12-31',
    status: 'ACTIVE',
  });

  const job2 = await Job.create({
    posterId: alumni2._id,
    collegeId: ldce._id,
    title: 'Associate Cloud Architect Intern',
    company: 'Amazon Web Services (AWS)',
    location: 'Ahmedabad / Remote',
    employmentType: 'INTERNSHIP',
    experienceYears: 'Freshers / Final Year',
    skillsRequired: ['AWS Basics', 'Python', 'Linux', 'Networking'],
    salaryRange: '₹45,00,000 / month Stipend',
    description: '6-month pre-placement internship for pre-final and final year Gujarat engineering graduates.',
    canRefer: true,
    referralInstructions: 'Submit your resume and github profile. Shortlisted applicants will receive direct HR referral.',
    deadline: '2026-11-30',
    status: 'ACTIVE',
  });

  await JobApplication.create({
    jobId: job2._id,
    applicantId: student1._id,
    resumeUrl: 'https://storage.gujarat.gov.in/resumes/meet_joshi_cv.pdf',
    resumeFileName: 'meet_joshi_resume_2026.pdf',
    coverNote: 'Hands-on experience deploying full-stack React and Node applications on AWS EC2 and S3.',
    referralRequested: true,
    status: 'UNDER_REVIEW',
  });

  // 9. Campaigns & Donations
  const camp1 = await Campaign.create({
    collegeId: ldce._id,
    title: 'State-of-the-Art Generative AI & High Performance GPU Lab',
    category: 'LAB_EQUIPMENT',
    description: 'Equipping the Computer Engineering and IT departments with 8x NVIDIA H100 GPU cluster to enable student research.',
    targetAmount: 5000000,
    raisedAmount: 3250000,
    donorCount: 48,
    imageUrl: 'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=600&auto=format&fit=crop',
    startDate: '2026-08-01',
    endDate: '2026-12-31',
    status: 'ACTIVE',
  });

  const camp2 = await Campaign.create({
    collegeId: ldce._id,
    title: 'Gujarat Rural Talent Engineering Scholarship Fund 2026',
    category: 'SCHOLARSHIP',
    description: 'Full tuition fee waiver and living stipend for 50 talented girl and underprivileged students from rural talukas of Gujarat.',
    targetAmount: 2500000,
    raisedAmount: 1800000,
    donorCount: 112,
    imageUrl: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=600&auto=format&fit=crop',
    startDate: '2026-07-01',
    endDate: '2026-11-30',
    status: 'ACTIVE',
  });

  const r1Html = generate80GReceiptHtml({
    receiptNumber: '80G-LDCE-2026-0042',
    donorName: 'Hardik Patel',
    donorPan: 'ABCDE1234F',
    amount: 250000,
    date: new Date().toISOString(),
    campaignTitle: camp1.title,
    collegeName: ldce.name,
    paymentId: 'pay_ldce_774129',
  });

  await Donation.create({
    campaignId: camp1._id,
    userId: alumni1._id,
    amount: 250000,
    donorPan: 'ABCDE1234F',
    donorName: 'Hardik Patel',
    paymentMethod: 'UPI',
    razorpayOrderId: 'order_ldce_998231',
    razorpayPaymentId: 'pay_ldce_774129',
    razorpaySignature: 'sig_mock_verified',
    receiptNumber: '80G-LDCE-2026-0042',
    receiptPdfContent: r1Html,
    badgeAwarded: 'GOLD_PATRON',
  });

  await FundDisbursement.create({
    campaignId: camp1._id,
    collegeId: ldce._id,
    amount: 1500000,
    purpose: 'Advance payment for 4x NVIDIA GPU Server Nodes and 10Gbps switch',
    vendorName: 'Netweb Technologies India Ltd.',
    invoiceRef: 'INV-NET-2026-4491',
    approvedBy: superAdmin._id,
    auditNotes: 'Verified with Govt. GeM portal procurement guidelines.',
  });

  // 10. Events
  const event1 = await Event.create({
    collegeId: ldce._id,
    creatorId: collegeAdmin._id,
    title: 'Grand Platinum Jubilee Alumni Homecoming 2026',
    type: 'REUNION',
    description: 'Annual gathering of LDCE alumni across all batches (1950 to 2025). Featuring keynote addresses, campus nostalgia tours, and networking dinner.',
    date: '2026-12-25',
    time: '04:00 PM IST',
    venue: 'Kashiram Aggarwal Auditorium, LDCE Campus, Ahmedabad',
    capacity: 1000,
    registeredCount: 380,
    ticketPrice: 0,
    bannerUrl: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=600&auto=format&fit=crop',
    status: 'UPCOMING',
  });

  const qr1 = await generateTicketQrCode({
    ticketNumber: 'TCK-LDCE-2026-001',
    eventId: event1._id.toString(),
    userId: alumni1._id.toString(),
    verificationHash: 'hash_tck_1',
  });

  await EventRsvp.create({
    eventId: event1._id,
    userId: alumni1._id,
    ticketNumber: 'TCK-LDCE-2026-001',
    qrCodeData: qr1,
    verificationHash: 'hash_tck_1',
    status: 'REGISTERED',
  });

  // 11. Stories
  await Story.create({
    userId: alumni1._id,
    collegeId: ldce._id,
    title: 'From LDCE Hostel 4 to Architecting Global Cloud Systems at Google',
    summary: 'Hardik Patel shares his journey through open source and scaling distributed infrastructure.',
    content: 'I still recall coding until 3 AM in the hostel lab. The foundations laid by our professors in Algorithms and Operating Systems proved pivotal during my Silicon Valley interviews.',
    milestone: 'Staff Software Engineer at Google & 3 US Cloud Patents',
    imageUrl: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=600&auto=format&fit=crop',
    isFeatured: true,
    isAlumniOfTheYear: true,
    status: 'APPROVED',
    approvedBy: collegeAdmin._id,
  });

  // 12. Surveys
  const survey1 = await Survey.create({
    collegeId: ldce._id,
    title: 'Gujarat Technical Education Curriculum Industry Alignment Survey 2026',
    description: 'Help the Board of Studies modernize college syllabi to match current industry demands.',
    targetRole: 'ALUMNI',
    questions: [
      {
        id: 'q1',
        text: 'Which emerging technologies should be mandated in third-year engineering curriculum?',
        type: 'MCQ',
        options: ['Cloud Native & Kubernetes', 'Generative AI & LLM Engineering', 'Rust & Systems Programming', 'IoT & Embedded Robotics'],
      },
      {
        id: 'q2',
        text: 'How prepared are fresh graduates joining your engineering teams today? (1 = Poor, 5 = Exceptional)',
        type: 'RATING',
      },
      {
        id: 'q3',
        text: 'What specific practical lab component would you advise the Gujarat Education Department to fund?',
        type: 'TEXT',
      },
    ],
    status: 'ACTIVE',
    deadline: '2026-12-31',
  });

  await SurveyResponse.create({
    surveyId: survey1._id,
    userId: alumni1._id,
    answers: {
      q1: 'Generative AI & LLM Engineering',
      q2: 4,
      q3: 'Cloud infrastructure credits and dedicated Linux workstation labs for hands-on systems programming.',
    },
  });

  // 13. Audit Log
  await AuditLog.create({
    collegeId: ldce._id,
    userId: superAdmin._id,
    userEmail: superAdmin.email,
    action: 'PLATFORM_INITIALIZATION',
    category: 'SYSTEM',
    ipAddress: '10.0.1.1 (SWAN Govt Secretariat)',
    details: { state: 'Gujarat', institutions: 3 },
  });

  console.log('Gujarat State Alumni database successfully seeded!');
}

export const seedDatabase = seedDatabaseIfEmpty;

export type UserRole = 'SUPER_ADMIN' | 'STATE_DIRECTOR' | 'COLLEGE_ADMIN' | 'ALUMNI' | 'STUDENT';

export interface College {
  _id: string;
  name: string;
  code: string;
  city: string;
  state?: string;
  website?: string;
  has80GExemption?: boolean;
}

export interface Profile {
  _id: string;
  userId: string;
  batch: number;
  branch: string;
  enrollmentNumber?: string;
  currentCompany?: string;
  designation?: string;
  city?: string;
  country?: string;
  skills?: string[];
  bio?: string;
  avatarUrl?: string;
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  isMentor?: boolean;
  mentorDomain?: string;
  headline?: string;
}

export interface User {
  _id: string;
  id?: string;
  fullName: string;
  name?: string;
  email: string;
  phone?: string;
  role: UserRole;
  collegeId: College | string;
  collegeName?: string;
  verificationStatus?: 'PENDING' | 'VERIFIED' | 'REJECTED';
  profile?: Profile;
}

export interface Job {
  _id: string;
  id?: string;
  posterId: string;
  posterName?: string;
  posterCompany?: string;
  collegeName?: string;
  title: string;
  company: string;
  location: string;
  employmentType: string;
  jobType?: string;
  skillsRequired: string[];
  salaryRange?: string;
  description: string;
  canRefer: boolean;
  isReferralAvailable?: boolean;
  referralInstructions?: string;
  deadline?: string;
  applicationCount?: number;
  hasApplied?: boolean;
}

export interface Event {
  _id: string;
  id?: string;
  title: string;
  type: string;
  eventType?: string;
  description: string;
  date: string;
  time?: string;
  venue: string;
  location?: string;
  isOnline?: boolean;
  capacity: number;
  registeredCount: number;
  bannerUrl?: string;
  collegeName?: string;
  isRegistered?: boolean;
  userTicket?: any;
}

export interface Campaign {
  _id: string;
  id?: string;
  title: string;
  category: string;
  description: string;
  targetAmount: number;
  raisedAmount: number;
  currentAmount?: number;
  donorCount: number;
  collegeName?: string;
  percentAchieved?: number;
  imageUrl?: string;
  has80GExemption?: boolean;
}

export interface Story {
  _id: string;
  id?: string;
  authorName?: string;
  authorBatch?: number;
  authorBranch?: string;
  authorCompany?: string;
  collegeName?: string;
  title: string;
  summary: string;
  content: string;
  milestone?: string;
  imageUrl?: string;
  isFeatured?: boolean;
}

export interface Survey {
  _id: string;
  title: string;
  description?: string;
  targetRole: string;
  questions: Array<{
    id: string;
    text: string;
    type: 'MCQ' | 'RATING' | 'TEXT';
    options?: string[];
  }>;
}

// Navigation Param Lists
export type RootStackParamList = {
  Splash: undefined;
  Auth: undefined;
  Main: undefined;
  AlumniProfile: { alumnus: User };
  JobDetails: { job: Job };
  EventDetails: { event: Event };
  QrTicket: { ticket: any; eventTitle: string };
  ChatConversation: { peerId: string; peerName: string };
  CampaignDetails: { campaign: Campaign };
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  OtpVerify: { email: string };
  ForgotPassword: undefined;
};

export type MainTabParamList = {
  Directory: undefined;
  Jobs: undefined;
  Events: undefined;
  Giving: undefined;
  Mentorship: undefined;
  Profile: undefined;
};

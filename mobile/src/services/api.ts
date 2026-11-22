import { Platform } from 'react-native';
import { getToken } from './storage';

// In Android emulator, localhost is 10.0.2.2. In iOS simulator, it is localhost.
const DEFAULT_HOST = Platform.OS === 'android' ? 'http://10.0.2.2:5001' : 'http://localhost:5001';
export const API_BASE_URL = `${DEFAULT_HOST}/api`;

async function request(endpoint: string, options: RequestInit = {}) {
  const token = await getToken();
  const url = `${API_BASE_URL}${endpoint}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string> || {}),
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.message || data.error || `HTTP ${response.status}: ${response.statusText}`;
    throw new Error(errorMsg);
  }

  return data;
}

export const mobileApi = {
  auth: {
    login: (email: string, password: string) =>
      request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
    register: (payload: any) =>
      request('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
    sendOtp: (email: string) =>
      request('/auth/otp/request', { method: 'POST', body: JSON.stringify({ email }) }),
    verifyOtp: (email: string, otp: string) =>
      request('/auth/otp/verify', { method: 'POST', body: JSON.stringify({ email, otp }) }),
    getMe: () => request('/auth/me'),
    getColleges: () => request('/auth/colleges'),
    forgotPassword: (email: string) =>
      request('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
    resetPassword: (payload: any) =>
      request('/auth/reset-password', { method: 'POST', body: JSON.stringify(payload) }),
  },

  directory: {
    search: (filters: Record<string, any> = {}) => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== undefined && v !== '' && v !== null) params.append(k, String(v));
      });
      return request(`/directory?${params.toString()}`);
    },
    connect: (requesterId: string, recipientId: string) =>
      request('/directory/connect', { method: 'POST', body: JSON.stringify({ requesterId, recipientId }) }),
    getConnections: (userId: string) => request(`/directory/connections/${userId}`),
  },

  mentorship: {
    getMentors: (studentUserId?: string) => {
      const q = studentUserId ? `?studentUserId=${studentUserId}` : '';
      return request(`/mentorship/mentors${q}`);
    },
    requestMatch: (payload: any) =>
      request('/mentorship/request', { method: 'POST', body: JSON.stringify(payload) }),
    getRequests: (userId: string) => request(`/mentorship/requests/${userId}`),
    respond: (requestId: string, action: string) =>
      request('/mentorship/respond', { method: 'POST', body: JSON.stringify({ requestId, action }) }),
  },

  jobs: {
    getAll: (filters: Record<string, any> = {}) => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== undefined && v !== '' && v !== null) params.append(k, String(v));
      });
      return request(`/jobs?${params.toString()}`);
    },
    apply: (payload: any) => request('/jobs/apply', { method: 'POST', body: JSON.stringify(payload) }),
    getMyApplications: (userId: string) => request(`/jobs/applications/${userId}`),
  },

  events: {
    getAll: (collegeId?: string) => {
      const q = collegeId ? `?collegeId=${collegeId}` : '';
      return request(`/events${q}`);
    },
    rsvp: (eventId: string, userId: string) =>
      request(`/events/${eventId}/rsvp`, { method: 'POST', body: JSON.stringify({ userId }) }),
    getMyTickets: (userId: string) => request(`/events/tickets/${userId}`),
  },

  donations: {
    getCampaigns: (collegeId?: string) => {
      const q = collegeId ? `?collegeId=${collegeId}` : '';
      return request(`/donations/campaigns${q}`);
    },
    createOrder: (payload: any) =>
      request('/donations/create-order', { method: 'POST', body: JSON.stringify(payload) }),
    verifyPayment: (payload: any) =>
      request('/donations/verify-payment', { method: 'POST', body: JSON.stringify(payload) }),
    getLedger: (collegeId?: string) => {
      const q = collegeId ? `?collegeId=${collegeId}` : '';
      return request(`/donations/ledger${q}`);
    },
    getHonorRoll: (collegeId?: string) => {
      const q = collegeId ? `?collegeId=${collegeId}` : '';
      return request(`/donations/honor-roll${q}`);
    },
  },

  stories: {
    getAll: () => request('/stories?approvedOnly=true'),
    create: (payload: any) => request('/stories', { method: 'POST', body: JSON.stringify(payload) }),
  },

  surveys: {
    getAll: () => request('/surveys'),
    submitResponse: (surveyId: string, payload: any) =>
      request(`/surveys/${surveyId}/response`, { method: 'POST', body: JSON.stringify(payload) }),
  },

  chat: {
    getConversations: (userId: string) => request(`/chat/conversations/${userId}`),
    getMessages: (user1: string, user2: string) => request(`/chat/messages/${user1}/${user2}`),
    sendMessage: (payload: any) => request('/chat/messages', { method: 'POST', body: JSON.stringify(payload) }),
  },

  notifications: {
    getAll: (userId: string) => request(`/notifications/${userId}`),
    markAsRead: (id: string) => request(`/notifications/${id}/read`, { method: 'POST' }),
  },
};

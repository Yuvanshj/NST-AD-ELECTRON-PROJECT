/**
 * MahaSetu - Gujarat State Alumni Association API Client
 * Connects React Frontend with Node/Express & MongoDB Backend
 */

const API_BASE =
  (typeof window !== 'undefined' && window.__API_BASE__) ||
  (typeof window !== 'undefined' && window.location.protocol === 'file:' ? 'http://localhost:5001/api' : '/api');

let authToken = null;

export function setAuthToken(token) {
  authToken = token;
  if (typeof window !== 'undefined') {
    if (token) {
      sessionStorage.setItem('mahasetu_token', token);
    } else {
      sessionStorage.removeItem('mahasetu_token');
    }
  }
}

export function getAuthToken() {
  if (!authToken && typeof window !== 'undefined') {
    authToken = sessionStorage.getItem('mahasetu_token');
  }
  return authToken;
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const token = getAuthToken();

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.error || data.message || `HTTP ${response.status}: ${response.statusText}`;
    throw new Error(errorMsg);
  }

  return data;
}

export const api = {
  // Auth
  auth: {
    sendOtp: (email, purpose = 'LOGIN') =>
      request('/auth/otp/request', { method: 'POST', body: JSON.stringify({ email, purpose }) }),
    verifyOtp: (email, otp) =>
      request('/auth/otp/verify', { method: 'POST', body: JSON.stringify({ email, otp }) }),
    login: (email, password) =>
      request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
    register: (payload) =>
      request('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
    getMe: () => request('/auth/me'),
    logout: () => request('/auth/logout', { method: 'POST' }),
    forgotPassword: (email) =>
      request('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
    resetPassword: (payload) =>
      request('/auth/reset-password', { method: 'POST', body: JSON.stringify(payload) }),
    getProfile: (userId) => request(`/auth/profile/${userId}`),
    updateProfile: (userId, payload) =>
      request(`/auth/profile/${userId}`, { method: 'PUT', body: JSON.stringify(payload) }),
    getColleges: () => request('/auth/colleges'),
    getUsers: () => request('/auth/users'),
  },

  // Verification Queue
  verification: {
    getPending: (collegeId) => {
      const q = collegeId ? `?collegeId=${collegeId}` : '';
      return request(`/verification/pending${q}`);
    },
    verify: (requestId, reviewerId, notes) =>
      request(`/verification/${requestId}/verify`, {
        method: 'POST',
        body: JSON.stringify({ reviewerId, notes }),
      }),
    reject: (requestId, reviewerId, rejectionReason) =>
      request(`/verification/${requestId}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reviewerId, rejectionReason }),
      }),
    submit: (payload) => request('/verification/submit', { method: 'POST', body: JSON.stringify(payload) }),
  },

  // Directory & Search
  directory: {
    search: (filters = {}) => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== undefined && v !== '' && v !== null) params.append(k, v);
      });
      return request(`/directory?${params.toString()}`);
    },
    getStats: (collegeId) => {
      const q = collegeId ? `?collegeId=${collegeId}` : '';
      return request(`/directory/stats${q}`);
    },
    connect: (requesterId, recipientId) =>
      request('/directory/connect', { method: 'POST', body: JSON.stringify({ requesterId, recipientId }) }),
    getConnections: (userId) => request(`/directory/connections/${userId}`),
    acceptConnection: (connectionId) =>
      request(`/directory/connection/${connectionId}/accept`, { method: 'PUT' }),
    rejectConnection: (connectionId) =>
      request(`/directory/connection/${connectionId}/reject`, { method: 'PUT' }),
    removeConnection: (connectionId) =>
      request(`/directory/connection/${connectionId}`, { method: 'DELETE' }),
  },

  // Mentorship
  mentorship: {
    getSmartMatches: (studentId) => request(`/mentorship/smart-matches/${studentId}`),
    getMentors: (filters = {}) => {
      const params = new URLSearchParams(filters);
      return request(`/mentorship/mentors?${params.toString()}`);
    },
    requestMatch: (payload) => request('/mentorship/request', { method: 'POST', body: JSON.stringify(payload) }),
    getRequests: (userId) => request(`/mentorship/requests/${userId}`),
    respond: (requestId, status, responseNote) =>
      request(`/mentorship/respond/${requestId}`, {
        method: 'POST',
        body: JSON.stringify({ status, responseNote }),
      }),
  },

  // Chat
  chat: {
    getConversations: (userId) => request(`/chat/conversations/${userId}`),
    getMessages: (user1, user2) => request(`/chat/messages/${user1}/${user2}`),
    sendMessage: (payload) => request('/chat/messages', { method: 'POST', body: JSON.stringify(payload) }),
  },

  // Jobs & Referrals
  jobs: {
    getAll: (filters = {}) => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== undefined && v !== '' && v !== null) params.append(k, v);
      });
      return request(`/jobs?${params.toString()}`);
    },
    create: (payload) => request('/jobs', { method: 'POST', body: JSON.stringify(payload) }),
    apply: (payload) => request('/jobs/apply', { method: 'POST', body: JSON.stringify(payload) }),
    getMyApplications: (userId) => request(`/jobs/applications/${userId}`),
    getPosterJobs: (posterId) => request(`/jobs/poster/${posterId}`),
    updateStatus: (appId, status) =>
      request(`/jobs/application/${appId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      }),
  },

  // Donations & Giving Transparency
  donations: {
    getCampaigns: (collegeId) => {
      const q = collegeId ? `?collegeId=${collegeId}` : '';
      return request(`/donations/campaigns${q}`);
    },
    createOrder: (payload) => request('/donations/create-order', { method: 'POST', body: JSON.stringify(payload) }),
    verifyPayment: (payload) => request('/donations/verify-payment', { method: 'POST', body: JSON.stringify(payload) }),
    getLedger: (collegeId) => {
      const q = collegeId ? `?collegeId=${collegeId}` : '';
      return request(`/donations/ledger${q}`);
    },
    getHonorRoll: (collegeId) => {
      const q = collegeId ? `?collegeId=${collegeId}` : '';
      return request(`/donations/honor-roll${q}`);
    },
    disburse: (payload) => request('/donations/disburse', { method: 'POST', body: JSON.stringify(payload) }),
  },

  // Events & QR Ticket Check-In
  events: {
    getAll: (collegeId) => {
      const q = collegeId ? `?collegeId=${collegeId}` : '';
      return request(`/events${q}`);
    },
    create: (payload) => request('/events', { method: 'POST', body: JSON.stringify(payload) }),
    rsvp: (eventId, userId) => request(`/events/${eventId}/rsvp`, { method: 'POST', body: JSON.stringify({ userId }) }),
    checkIn: (eventId, ticketNumber, adminId) =>
      request(`/events/${eventId}/check-in`, {
        method: 'POST',
        body: JSON.stringify({ ticketNumber, adminId }),
      }),
    getMyTickets: (userId) => request(`/events/tickets/${userId}`),
  },

  // Success Stories
  stories: {
    getAll: (collegeId) => {
      const q = collegeId ? `?collegeId=${collegeId}` : '';
      return request(`/stories${q}`);
    },
    create: (payload) => request('/stories', { method: 'POST', body: JSON.stringify(payload) }),
    approve: (storyId, isApproved) =>
      request(`/stories/${storyId}/approve`, { method: 'POST', body: JSON.stringify({ isApproved }) }),
  },

  // Surveys
  surveys: {
    getAll: (collegeId) => {
      const q = collegeId ? `?collegeId=${collegeId}` : '';
      return request(`/surveys${q}`);
    },
    create: (payload) => request('/surveys', { method: 'POST', body: JSON.stringify(payload) }),
    submitResponse: (surveyId, payload) =>
      request(`/surveys/${surveyId}/response`, { method: 'POST', body: JSON.stringify(payload) }),
    getResults: (surveyId) => request(`/surveys/${surveyId}/results`),
  },

  // Analytics
  analytics: {
    getDashboard: (collegeId) => {
      const q = collegeId ? `?collegeId=${collegeId}` : '';
      return request(`/analytics/dashboard${q}`);
    },
    getCollegeComparison: () => request('/analytics/colleges-comparison'),
  },

  // Audit Logs
  audit: {
    getLogs: (filters = {}) => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== undefined && v !== '' && v !== null) params.append(k, v);
      });
      return request(`/audit?${params.toString()}`);
    },
    getSummary: () => request('/audit/summary'),
  },

  // Notifications
  notifications: {
    getAll: (userId) => request(`/notifications/${userId}`),
    markAsRead: (id) => request(`/notifications/${id}/read`, { method: 'POST' }),
    markAllRead: (userId) => request(`/notifications/read-all/${userId}`, { method: 'POST' }),
  },

  // File Upload
  upload: {
    uploadFile: (payload) => request('/upload', { method: 'POST', body: JSON.stringify(payload) }),
  },
};

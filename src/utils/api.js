import { API_URL } from '../config';

// Get auth token from localStorage
const getAuthToken = () => {
  return localStorage.getItem('token');
};

// Create headers with auth token
const createHeaders = (includeAuth = false) => {
  const headers = {
    'Content-Type': 'application/json',
  };
  
  if (includeAuth) {
    const token = getAuthToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }
  
  return headers;
};

// Generic API call function
const apiCall = async (endpoint, options = {}) => {
  const url = `${API_URL}${endpoint}`;
  const config = {
    headers: createHeaders(options.auth),
    ...options,
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'API call failed');
    }
    
    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

// API functions
export const api = {
  // School Visits
  getVisits: () => apiCall('/api/visits'),
  getVisit: (id) => apiCall(`/api/visits/${id}`),
  createVisit: (data) => apiCall('/api/visits', {
    method: 'POST',
    body: JSON.stringify(data),
    auth: true
  }),
  updateVisit: (id, data) => apiCall(`/api/visits/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
    auth: true
  }),
  deleteVisit: (id) => apiCall(`/api/visits/${id}`, {
    method: 'DELETE',
    auth: true
  }),

  // Weekly Updates
  getWeeks: () => apiCall('/api/weeks'),
  getWeek: (id) => apiCall(`/api/weeks/${id}`),
  createWeek: (data) => apiCall('/api/weeks', {
    method: 'POST',
    body: JSON.stringify(data),
    auth: true
  }),
  updateWeek: (id, data) => apiCall(`/api/weeks/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
    auth: true
  }),
  deleteWeek: (id) => apiCall(`/api/weeks/${id}`, {
    method: 'DELETE',
    auth: true
  }),

  // Resources
  getResources: (filters = {}) => {
    const params = new URLSearchParams(filters);
    return apiCall(`/api/resources?${params}`);
  },
  getResource: (id) => apiCall(`/api/resources/${id}`),
  createResource: (data) => apiCall('/api/resources', {
    method: 'POST',
    body: JSON.stringify(data),
    auth: true
  }),
  updateResource: (id, data) => apiCall(`/api/resources/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
    auth: true
  }),
  deleteResource: (id) => apiCall(`/api/resources/${id}`, {
    method: 'DELETE',
    auth: true
  }),

  // Users/Auth
  register: (data) => apiCall('/api/register', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  login: (data) => apiCall('/api/login', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  getCurrentUser: () => apiCall('/api/protected', { auth: true }),

  // AI Assistant
  sendMessage: (message) => apiCall('/api/ai', {
    method: 'POST',
    body: JSON.stringify({ message })
  })
};
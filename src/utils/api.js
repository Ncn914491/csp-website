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
  getVisits: () => apiCall('/visits'),
  getVisit: (id) => apiCall(`/visits/${id}`),
  createVisit: (data) => apiCall('/visits', {
    method: 'POST',
    body: JSON.stringify(data),
    auth: true
  }),
  updateVisit: (id, data) => apiCall(`/visits/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
    auth: true
  }),
  deleteVisit: (id) => apiCall(`/visits/${id}`, {
    method: 'DELETE',
    auth: true
  }),

  // Weekly Updates
  getWeeks: () => apiCall('/weeks'),
  getWeek: (id) => apiCall(`/weeks/${id}`),
  createWeek: (data) => apiCall('/weeks', {
    method: 'POST',
    body: JSON.stringify(data),
    auth: true
  }),
  updateWeek: (id, data) => apiCall(`/weeks/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
    auth: true
  }),
  deleteWeek: (id) => apiCall(`/weeks/${id}`, {
    method: 'DELETE',
    auth: true
  }),

  // Resources
  getResources: (filters = {}) => {
    const params = new URLSearchParams(filters);
    return apiCall(`/resources?${params}`);
  },
  getResource: (id) => apiCall(`/resources/${id}`),
  createResource: (data) => apiCall('/resources', {
    method: 'POST',
    body: JSON.stringify(data),
    auth: true
  }),
  updateResource: (id, data) => apiCall(`/resources/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
    auth: true
  }),
  deleteResource: (id) => apiCall(`/resources/${id}`, {
    method: 'DELETE',
    auth: true
  }),

  // Users/Auth
  register: (data) => apiCall('/register', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  login: (data) => apiCall('/login', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  getCurrentUser: () => apiCall('/protected', { auth: true }),

  // AI Assistant
  sendMessage: (message) => apiCall('/ai', {
    method: 'POST',
    body: JSON.stringify({ message })
  })
};
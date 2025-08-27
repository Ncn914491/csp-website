import { API_URL } from '../config';

// Get auth token from localStorage
const getAuthToken = () => {
  return localStorage.getItem('token');
};

// Create headers with auth token
const createHeaders = (includeAuth = false, isFormData = false) => {
  const headers = {};
  
  // Only set Content-Type for JSON, let browser set it for FormData
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }
  
  const token = getAuthToken();
  if (token && includeAuth) {
    headers.Authorization = `Bearer ${token}`;
  }
  
  return headers;
};

// Generic API call function
const apiCall = async (endpoint, options = {}) => {
  const url = `${API_URL}${endpoint}`;
  const isFormData = options.body instanceof FormData;
  
  const config = {
    headers: createHeaders(options.auth, isFormData),
    ...options,
  };

  // Remove headers if it's FormData to let browser set them
  if (isFormData && options.headers && Object.keys(options.headers).length === 0) {
    delete config.headers['Content-Type'];
  }

  try {
    const response = await fetch(url, config);
    
    // Handle non-JSON responses (like 404 with HTML)
    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = { message: `HTTP ${response.status}: ${response.statusText}` };
    }
    
    if (!response.ok) {
      // Handle authentication errors
      if (response.status === 401) {
        // Check if we're already on auth page to prevent infinite redirects
        if (!window.location.pathname.includes('/auth')) {
          // Token expired or invalid
          localStorage.removeItem('token');
          localStorage.removeItem('tokenExpiry');
          
          // Dispatch custom event for auth context to handle
          window.dispatchEvent(new CustomEvent('auth-expired'));
          
          throw new Error(data.message || 'Session expired. Please login again.');
        }
      }
      
      throw new Error(data.message || `HTTP ${response.status}: ${response.statusText}`);
    }
    
    return data;
  } catch (error) {
    console.error('API Error:', error);
    
    // Don't redirect on network errors
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Network error. Please check your connection.');
    }
    
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
  }),

  // Groups
  listGroups: () => apiCall('/groups', { auth: true }),
  createGroup: (data) => apiCall('/groups', { method: 'POST', body: JSON.stringify(data), auth: true }),
  deleteGroup: (groupId) => apiCall(`/groups/${groupId}`, { method: 'DELETE', auth: true }),
  joinGroup: (groupId) => apiCall(`/groups/${groupId}/join`, { method: 'POST', auth: true }),
  leaveGroup: (groupId) => apiCall(`/groups/${groupId}/leave`, { method: 'POST', auth: true }),
  listMessages: (groupId) => apiCall(`/groups/${groupId}/messages`, { auth: true }),
  sendMessageToGroup: (groupId, content) => apiCall(`/groups/${groupId}/messages`, { method: 'POST', body: JSON.stringify({ content }), auth: true }),

  // GridFS Weeks (using correct endpoints)
  getGridFSWeeks: () => apiCall('/weeks'), // Use regular weeks endpoint which now has file data
  getGridFSWeek: (id) => apiCall(`/weeks/${id}`),
  getGridFSFile: (id) => `${API_URL}/weeks/file/${id}`, // Use weeks endpoint for file access
  
  // Admin functions
  uploadWeekData: (formData) => apiCall('/gridfs-weeks/add', {
    method: 'POST',
    body: formData,
    headers: {}, // Let browser set content-type for FormData
    auth: true
  })
};
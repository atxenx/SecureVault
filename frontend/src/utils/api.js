const API_URL = 'http://127.0.0.1:5001/api';

export const api = {
  async request(endpoint, options = {}) {
    const token = localStorage.getItem('token');
    const headers = { 'Content-Type': 'application/json', ...options.headers };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`${API_URL}${endpoint}`, { ...options, headers });

    if (response.status === 401) {
      localStorage.clear();
      window.location.href = '/login';
    }

    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || 'API request failed');
    return data;
  },

  login:              (email, password)  => api.request('/login',       { method: 'POST', body: JSON.stringify({ email, password }) }),
  register:           (email, password)  => api.request('/register',    { method: 'POST', body: JSON.stringify({ email, password }) }),
  getCredentials:     ()                 => api.request('/credentials', { method: 'GET' }),
  createCredential:   (cred)             => api.request('/credentials', { method: 'POST', body: JSON.stringify(cred) }),
  deleteCredential:   (id)               => api.request(`/credentials/${id}`, { method: 'DELETE' }),
  getDashboardStats:  ()                 => api.request('/dashboard/stats', { method: 'GET' }),
};

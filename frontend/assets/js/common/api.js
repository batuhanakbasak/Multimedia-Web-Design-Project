
const BASE_URL = 'http://94.55.180.77:3000/api';

const API = {
  // Helpers
  getHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    const token = localStorage.getItem('token');
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  },

  async request(endpoint, options = {}) {
    try {
      const res = await fetch(`${BASE_URL}${endpoint}`, {
        ...options,
        headers: this.getHeaders()
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'API error occurred');
      return data;
    } catch (err) {
      console.error(`API Error on ${endpoint}:`, err);
      throw err;
    }
  },

  // Auth
  loginOrganizer(email, password) {
    return this.request('/auth/login/organizer', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  }
  // Other endpoints will be added in Commit 2
};

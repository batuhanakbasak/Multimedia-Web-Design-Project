
const API_BASE = 'http://localhost:5000/api';

async function apiRequest(method, endpoint, data = null) {
  const token = localStorage.getItem('token');
  const options = {
    method: method,
    headers: { 'Content-Type': 'application/json' }
  };
  if (token) options.headers['Authorization'] = 'Bearer ' + token;
  if (data) options.body = JSON.stringify(data);

  const res = await fetch(API_BASE + endpoint, options);
  if (res.status === 401) { logout(); return; }
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Request failed');
  return json;
}

const API = {
  // Auth
  loginAdmin: (email, password) => apiRequest('POST', '/auth/login/admin', { email, password }),
  loginOrganizer: (email, password) => apiRequest('POST', '/auth/login/organizer', { email, password }),
  getMe: () => apiRequest('GET', '/auth/me'),

  // Admin
  getAdminDashboard: () => apiRequest('GET', '/admin/dashboard'),
  getUsers: () => apiRequest('GET', '/admin/users'),
  updateUserRole: (id, role) => apiRequest('PUT', '/admin/users/' + id + '/role', { role }),
  updateUserStatus: (id, is_active) => apiRequest('PUT', '/admin/users/' + id + '/status', { is_active }),
  getClubs: () => apiRequest('GET', '/admin/clubs'),
  createClub: (data) => apiRequest('POST', '/admin/clubs', data),
  updateClub: (id, data) => apiRequest('PUT', '/admin/clubs/' + id, data),
  deleteClub: (id) => apiRequest('DELETE', '/admin/clubs/' + id),
  getClubMembers: (id) => apiRequest('GET', '/admin/clubs/' + id + '/members'),
  addClubMember: (id, data) => apiRequest('POST', '/admin/clubs/' + id + '/members', data),
  removeClubMember: (clubId, userId) => apiRequest('DELETE', '/admin/clubs/' + clubId + '/members/' + userId),
  getAdminEvents: () => apiRequest('GET', '/admin/events'),
  deleteEvent: (id) => apiRequest('DELETE', '/admin/events/' + id),

  // Organizer
  getOrganizerDashboard: () => apiRequest('GET', '/organizer/dashboard'),
  getOrganizerEvents: () => apiRequest('GET', '/organizer/events'),
  createEvent: (data) => apiRequest('POST', '/organizer/events', data),
  updateEvent: (id, data) => apiRequest('PUT', '/organizer/events/' + id, data),
  deleteOrgEvent: (id) => apiRequest('DELETE', '/organizer/events/' + id),
  getParticipants: (id) => apiRequest('GET', '/organizer/events/' + id + '/participants'),
  getOrganizerProfile: () => apiRequest('GET', '/organizer/profile'),
  updateOrganizerProfile: (data) => apiRequest('PUT', '/organizer/profile', data),
  getOrganizerClubs: () => apiRequest('GET', '/organizer/clubs'),
};

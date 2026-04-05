
function saveAuth(token, user) {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
}

function getUser() {
  try { return JSON.parse(localStorage.getItem('user')); }
  catch(e) { return null; }
}

function getToken() { return localStorage.getItem('token'); }

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '../admin/admin-login.html';
}

function logoutOrganizer() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '../organizer/organizer-login.html';
}

function guardAdmin() {
  const user = getUser();
  if (!user || user.role !== 'admin') {
    window.location.href = '../admin/admin-login.html';
    return false;
  }
  return true;
}

function guardOrganizer() {
  const user = getUser();
  if (!user || user.role !== 'organizer') {
    window.location.href = '../organizer/organizer-login.html';
    return false;
  }
  return true;
}

function setUserInfoSidebar() {
  const user = getUser();
  if (!user) return;
  const initials = user.full_name ? user.full_name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0,2) : 'U';
  $('#sidebarAvatar').text(initials);
  $('#sidebarName').text(user.full_name || 'User');
  $('#sidebarRole').text(user.role || '');
}

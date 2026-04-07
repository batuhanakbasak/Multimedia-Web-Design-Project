
const Auth = {
  setToken(token) { localStorage.setItem('token', token); },
  getToken() { return localStorage.getItem('token'); },

  setUser(user) { localStorage.setItem('user', JSON.stringify(user)); },
  getUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '../organizer/organizer-login.html';
  },

  isLoggedIn() { return !!this.getToken(); },

  hasRole(role) {
    const user = this.getUser();
    return user && user.role === role;
  }
};

function guardOrganizer() {
  if (!Auth.isLoggedIn() || !Auth.hasRole('organizer')) {
    window.location.href = 'organizer-login.html';
    return false;
  }
  return true;
}

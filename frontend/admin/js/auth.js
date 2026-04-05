import { ADMIN_TOKEN_KEY, apiRequest } from './api.js';

const ADMIN_PROFILE_KEY = 'admin_profile';

export const getAdminToken = () => localStorage.getItem(ADMIN_TOKEN_KEY);

export const getAdminProfile = () => {
  const rawValue = localStorage.getItem(ADMIN_PROFILE_KEY);

  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue);
  } catch (error) {
    return null;
  }
};

export const saveAdminSession = ({ token, admin }) => {
  if (token) {
    localStorage.setItem(ADMIN_TOKEN_KEY, token);
  }

  if (admin) {
    localStorage.setItem(ADMIN_PROFILE_KEY, JSON.stringify(admin));
  }
};

export const clearAdminSession = () => {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
  localStorage.removeItem(ADMIN_PROFILE_KEY);
};

export const redirectToLogin = (reason = '') => {
  const loginUrl = new URL('./login.html', window.location.href);

  if (reason) {
    loginUrl.searchParams.set('reason', reason);
  }

  window.location.href = loginUrl.toString();
};

export const logoutAdmin = async ({ redirect = true } = {}) => {
  try {
    if (getAdminToken()) {
      await apiRequest('/admin/auth/logout', {
        method: 'POST',
      });
    }
  } catch (error) {
    console.warn('Admin logout request failed:', error.message);
  } finally {
    clearAdminSession();

    if (redirect) {
      redirectToLogin('signed-out');
    }
  }
};

const renderLoginMessage = (message, type = 'error') => {
  const messageBox = document.querySelector('[data-login-message]');

  if (!messageBox) {
    return;
  }

  messageBox.textContent = message;
  messageBox.className = `auth-message ${type}`;
  messageBox.hidden = false;
};

const clearLoginMessage = () => {
  const messageBox = document.querySelector('[data-login-message]');

  if (!messageBox) {
    return;
  }

  messageBox.hidden = true;
  messageBox.textContent = '';
  messageBox.className = 'auth-message';
};

const getReasonMessage = (reason) => {
  const reasonMap = {
    session: 'Please sign in to continue to the admin panel.',
    expired: 'Your session expired. Please sign in again.',
    signed-out: 'You have been signed out.',
  };

  return reasonMap[reason] || '';
};

const initializeLoginPage = () => {
  const form = document.querySelector('[data-login-form]');

  if (!form) {
    return;
  }

  if (getAdminToken()) {
    window.location.href = './dashboard.html';
    return;
  }

  const reason = new URLSearchParams(window.location.search).get('reason');

  if (reason) {
    renderLoginMessage(getReasonMessage(reason), reason === 'signed-out' ? 'success' : 'info');
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearLoginMessage();

    const submitButton = form.querySelector('button[type="submit"]');
    const email = form.email.value.trim();
    const password = form.password.value;

    submitButton.disabled = true;
    submitButton.textContent = 'Signing in...';

    try {
      const response = await apiRequest('/admin/auth/login', {
        auth: false,
        method: 'POST',
        body: { email, password },
      });

      saveAdminSession({
        token: response.data.token,
        admin: response.data.admin,
      });

      window.location.href = './dashboard.html';
    } catch (error) {
      renderLoginMessage(error.message);
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = 'Sign In';
    }
  });
};

if (document.body?.dataset.page === 'login') {
  initializeLoginPage();
}

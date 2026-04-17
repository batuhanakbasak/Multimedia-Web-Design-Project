// auth scripti: bu dosya sayfanin davranislarini ve is kurallarini yonetir.
import { ORGANIZER_TOKEN_KEY, apiRequest } from './api.js';

const ORGANIZER_PROFILE_KEY = 'organizer_profile';
const ORGANIZER_REFRESH_TOKEN_KEY = 'organizer_refresh_token';

export const getOrganizerToken = () => localStorage.getItem(ORGANIZER_TOKEN_KEY);

export const getOrganizerProfile = () => {
  const raw = localStorage.getItem(ORGANIZER_PROFILE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (error) {
    localStorage.removeItem(ORGANIZER_PROFILE_KEY);
    return null;
  }
};

export const saveOrganizerSession = ({ token, organizer }) => {
  if (token) localStorage.setItem(ORGANIZER_TOKEN_KEY, token);
  if (organizer) localStorage.setItem(ORGANIZER_PROFILE_KEY, JSON.stringify(organizer));
};

export const clearOrganizerSession = () => {
  localStorage.removeItem(ORGANIZER_TOKEN_KEY);
  localStorage.removeItem(ORGANIZER_PROFILE_KEY);
  localStorage.removeItem(ORGANIZER_REFRESH_TOKEN_KEY);
};

export const redirectToLogin = (reason = '') => {
  const loginUrl = new URL('./organizer-login.html', window.location.href);
  if (reason) loginUrl.searchParams.set('reason', reason);
  window.location.href = loginUrl.toString();
};

export const logoutOrganizer = () => {
  const refreshToken = localStorage.getItem(ORGANIZER_REFRESH_TOKEN_KEY);
  const performLogout = async () => {
    try {
      if (refreshToken) {
        await apiRequest('/auth/logout', {
          method: 'POST',
          body: { refresh_token: refreshToken },
        });
      } else {
        await apiRequest('/auth/logout-all', { method: 'POST' });
      }
    } catch (error) {
      console.warn('Organizer logout request failed:', error.message);
    } finally {
      clearOrganizerSession();
      redirectToLogin('signed-out');
    }
  };

  performLogout();
};

const renderLoginMessage = (message, type = 'error') => {
  const messageBox = document.querySelector('[data-login-message]');
  if (!messageBox) return;
  messageBox.textContent = message;
  messageBox.className = `auth-message ${type}`;
  messageBox.hidden = false;
};

const renderReasonMessage = () => {
  const reason = new URLSearchParams(window.location.search).get('reason');
  if (!reason) return;

  if (reason === 'session') {
    renderLoginMessage('Your session expired. Please sign in again.', 'info');
    return;
  }
  if (reason === 'signed-out') {
    renderLoginMessage('You have signed out successfully.', 'success');
  }
};

const initializeLoginPage = () => {
  const form = document.querySelector('[data-login-form]');
  if (!form) return;

  if (getOrganizerToken()) { window.location.href = './dashboard.html'; return; }
  renderReasonMessage();

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const submitButton = form.querySelector('button[type="submit"]');
    const email = form.email.value.trim();
    const password = form.password.value;

    submitButton.disabled = true;
    submitButton.textContent = 'Signing in...';

    try {
      const response = await apiRequest('/auth/login/organizer', {
        auth: false, method: 'POST', body: { email, password }
      });

      saveOrganizerSession({
        token: response.data?.access_token || response.data?.token || response.access_token || response.token,
        organizer: response.data?.user || response.data?.organizer || response.user || {email: email, full_name: 'Organizer'},
      });
      const refreshToken = response.data?.refresh_token || response.refresh_token;
      if (refreshToken) {
        localStorage.setItem(ORGANIZER_REFRESH_TOKEN_KEY, refreshToken);
      } else {
        localStorage.removeItem(ORGANIZER_REFRESH_TOKEN_KEY);
      }
      window.location.href = './dashboard.html';
    } catch (error) {
      renderLoginMessage(error.message || 'Login failed.');
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = 'Sign In as Organizer';
    }
  });
};

if (document.body?.dataset.page === 'login') { initializeLoginPage(); }

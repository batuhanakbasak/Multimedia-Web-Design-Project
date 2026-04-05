import { ORGANIZER_TOKEN_KEY, apiRequest } from './api.js';

const ORGANIZER_PROFILE_KEY = 'organizer_profile';

export const getOrganizerToken = () => localStorage.getItem(ORGANIZER_TOKEN_KEY);

export const saveOrganizerSession = ({ token, organizer }) => {
  if (token) localStorage.setItem(ORGANIZER_TOKEN_KEY, token);
  if (organizer) localStorage.setItem(ORGANIZER_PROFILE_KEY, JSON.stringify(organizer));
};

export const clearOrganizerSession = () => {
  localStorage.removeItem(ORGANIZER_TOKEN_KEY);
  localStorage.removeItem(ORGANIZER_PROFILE_KEY);
};

export const redirectToLogin = (reason = '') => {
  const loginUrl = new URL('./login.html', window.location.href);
  if (reason) loginUrl.searchParams.set('reason', reason);
  window.location.href = loginUrl.toString();
};

const renderLoginMessage = (message, type = 'error') => {
  const messageBox = document.querySelector('[data-login-message]');
  if (!messageBox) return;
  messageBox.textContent = message;
  messageBox.className = `auth-message ${type}`;
  messageBox.hidden = false;
};

const initializeLoginPage = () => {
  const form = document.querySelector('[data-login-form]');
  if (!form) return;

  if (getOrganizerToken()) { window.location.href = './dashboard.html'; return; }

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
        token: response.data?.token || response.token,
        organizer: response.data?.organizer || response.user,
      });

      window.location.href = './dashboard.html';
    } catch (error) {
      renderLoginMessage(error.message || 'Login failed.');
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = 'Sign In';
    }
  });
};

if (document.body?.dataset.page === 'login') { initializeLoginPage(); }

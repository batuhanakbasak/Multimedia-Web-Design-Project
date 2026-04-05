import { STUDENT_TOKEN_KEY, apiRequest } from './api.js';

const STUDENT_PROFILE_KEY = 'student_profile';

export const getStudentToken = () => localStorage.getItem(STUDENT_TOKEN_KEY);

export const saveStudentSession = ({ token, student }) => {
  if (token) localStorage.setItem(STUDENT_TOKEN_KEY, token);
  if (student) localStorage.setItem(STUDENT_PROFILE_KEY, JSON.stringify(student));
};

export const clearStudentSession = () => {
  localStorage.removeItem(STUDENT_TOKEN_KEY);
  localStorage.removeItem(STUDENT_PROFILE_KEY);
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

  if (getStudentToken()) { window.location.href = './dashboard.html'; return; }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const submitButton = form.querySelector('button[type="submit"]');
    const email = form.email.value.trim();
    const password = form.password.value;

    submitButton.disabled = true;
    submitButton.textContent = 'Signing in...';

    try {
      const response = await apiRequest('/auth/login/student', {
        auth: false, method: 'POST', body: { email, password }
      });

      saveStudentSession({
        token: response.data?.access_token || response.data?.token || response.access_token || response.token,
        student: response.data?.user || response.data?.student || response.user || {email: email, full_name: 'Student'},
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

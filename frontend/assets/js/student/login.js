// login scripti: bu dosya sayfanin davranislarini ve is kurallarini yonetir.
import { apiRequest } from '../common/api.js';
import { saveStudentSessionFromPayload } from '../common/auth.js';
import { redirectIfStudentAlreadyLoggedIn } from '../common/guards.js';
import { setInlineMessage } from '../common/utils.js';

const REASON_MESSAGES = {
  registered: { type: 'success', text: 'Your account was created successfully. You can sign in now.' },
  logout: { type: 'info', text: 'You have been logged out.' },
  session: { type: 'error', text: 'Please sign in to continue.' },
  forbidden: { type: 'error', text: 'Your session is no longer valid. Please sign in again.' },
};

const init = () => {
  if (redirectIfStudentAlreadyLoggedIn()) {
    return;
  }

  const form = document.querySelector('[data-login-form]');
  const messageBox = document.querySelector('[data-login-message]');
  const reason = new URLSearchParams(window.location.search).get('reason');

  if (!form || !messageBox) {
    return;
  }

  if (reason && REASON_MESSAGES[reason]) {
    setInlineMessage(messageBox, REASON_MESSAGES[reason].text, REASON_MESSAGES[reason].type);
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const submitButton = form.querySelector('button[type="submit"]');
    const email = form.email.value.trim();
    const password = form.password.value;

    setInlineMessage(messageBox, '', 'info');
    submitButton.disabled = true;
    submitButton.textContent = 'Signing in...';

    try {
      const response = await apiRequest('/auth/login/student', {
        auth: false,
        method: 'POST',
        body: {
          email,
          password,
        },
      });

      saveStudentSessionFromPayload(response.data);
      window.location.href = './dashboard.html';
    } catch (error) {
      setInlineMessage(messageBox, error.message || 'Login failed. Please try again.', 'error');
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = 'Sign In';
    }
  });
};

document.addEventListener('DOMContentLoaded', init);

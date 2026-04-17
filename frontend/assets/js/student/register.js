// register scripti: bu dosya sayfanin davranislarini ve is kurallarini yonetir.
import { apiRequest } from '../common/api.js';
import { redirectIfStudentAlreadyLoggedIn } from '../common/guards.js';
import { setInlineMessage } from '../common/utils.js';

const init = () => {
  if (redirectIfStudentAlreadyLoggedIn()) {
    return;
  }

  const form = document.querySelector('[data-register-form]');
  const messageBox = document.querySelector('[data-register-message]');

  if (!form || !messageBox) {
    return;
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const submitButton = form.querySelector('button[type="submit"]');
    const payload = {
      full_name: form.full_name.value.trim(),
      email: form.email.value.trim(),
      password: form.password.value,
    };
    const confirmPassword = form.confirm_password.value;

    if (!payload.full_name || !payload.email || !payload.password) {
      setInlineMessage(messageBox, 'Please fill in all required fields.', 'error');
      return;
    }

    if (payload.password.length < 8) {
      setInlineMessage(messageBox, 'Password must be at least 8 characters long.', 'error');
      return;
    }

    if (payload.password !== confirmPassword) {
      setInlineMessage(messageBox, 'Passwords do not match.', 'error');
      return;
    }

    setInlineMessage(messageBox, '', 'info');
    submitButton.disabled = true;
    submitButton.textContent = 'Creating account...';

    try {
      await apiRequest('/auth/register/student', {
        auth: false,
        method: 'POST',
        body: payload,
      });

      window.location.href = './login.html?reason=registered';
    } catch (error) {
      setInlineMessage(
        messageBox,
        error.message || 'Registration failed. Please review your details and try again.',
        'error'
      );
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = 'Create Student Account';
    }
  });
};

document.addEventListener('DOMContentLoaded', init);

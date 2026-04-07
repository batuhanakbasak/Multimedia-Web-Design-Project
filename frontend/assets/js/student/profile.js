import { apiRequest } from '../common/api.js';
import { updateStoredStudentProfile } from '../common/auth.js';
import { requireStudentAuth } from '../common/guards.js';
import {
  escapeHtml,
  getInitials,
  mountStudentShell,
  setInlineMessage,
  showToast,
} from '../common/utils.js';

let currentProfile = null;

const requestPasswordChange = async (payload) => {
  return apiRequest('/student/profile/password', {
    method: 'PUT',
    body: payload,
  });
};

const renderAvatar = (profile) => {
  const avatar = document.querySelector('[data-profile-avatar]');

  if (!avatar) {
    return;
  }

  if (profile?.profile_image) {
    avatar.innerHTML = `<img src="${escapeHtml(profile.profile_image)}" alt="${escapeHtml(profile.full_name || 'Student')}" />`;
    return;
  }

  avatar.textContent = getInitials(profile?.full_name || 'Student');
};

const renderProfile = (profile) => {
  currentProfile = profile;

  document.querySelector('[data-profile-name]')?.replaceChildren(
    document.createTextNode(profile.full_name || 'Student')
  );
  document.querySelector('[data-profile-email]')?.replaceChildren(
    document.createTextNode(profile.email || '')
  );
  document.querySelector('[data-profile-summary]')?.replaceChildren(
    document.createTextNode(profile.profile_image ? 'Profile image added' : 'No profile image yet')
  );
  renderAvatar(profile);

  const form = document.querySelector('[data-profile-form]');

  if (form) {
    form.full_name.value = profile.full_name || '';
    form.email.value = profile.email || '';
    form.profile_image.value = profile.profile_image || '';
  }
};

const init = async () => {
  const student = requireStudentAuth();

  if (!student) {
    return;
  }

  mountStudentShell({
    activePage: 'profile',
    title: 'My Profile',
    subtitle: 'Update your name and profile image while keeping your student account details in sync.',
  });

  const form = document.querySelector('[data-profile-form]');
  const passwordForm = document.querySelector('[data-password-form]');
  const messageBox = document.querySelector('[data-profile-message]');
  const passwordMessageBox = document.querySelector('[data-password-message]');

  renderProfile(student);

  try {
    const response = await apiRequest('/student/profile');
    updateStoredStudentProfile(response.data || student);
    renderProfile(response.data || student);
    mountStudentShell({
      activePage: 'profile',
      title: 'My Profile',
      subtitle: 'Update your name and profile image while keeping your student account details in sync.',
    });
  } catch (error) {
    setInlineMessage(messageBox, error.message || 'Unable to load your profile right now.', 'error');
  }

  if (!form) {
    return;
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const submitButton = form.querySelector('button[type="submit"]');
    const payload = {
      full_name: form.full_name.value.trim(),
      profile_image: form.profile_image.value.trim() || null,
    };

    if (!payload.full_name) {
      setInlineMessage(messageBox, 'Full name is required.', 'error');
      return;
    }

    submitButton.disabled = true;
    submitButton.textContent = 'Saving changes...';
    setInlineMessage(messageBox, '', 'info');

    try {
      const response = await apiRequest('/student/profile', {
        method: 'PUT',
        body: payload,
      });

      updateStoredStudentProfile(response.data);
      renderProfile(response.data);
      mountStudentShell({
        activePage: 'profile',
        title: 'My Profile',
        subtitle: 'Update your name and profile image while keeping your student account details in sync.',
      });
      setInlineMessage(messageBox, 'Profile updated successfully.', 'success');
      showToast('Your profile was updated.', 'success');
    } catch (error) {
      setInlineMessage(messageBox, error.message || 'Unable to update your profile.', 'error');
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = 'Save Changes';
    }
  });

  passwordForm?.addEventListener('submit', async (event) => {
    event.preventDefault();

    const submitButton = passwordForm.querySelector('button[type="submit"]');
    const currentPassword = passwordForm.current_password.value;
    const newPassword = passwordForm.new_password.value;
    const confirmNewPassword = passwordForm.confirm_new_password.value;

    if (newPassword.length < 8) {
      setInlineMessage(passwordMessageBox, 'New password must be at least 8 characters long.', 'error');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setInlineMessage(passwordMessageBox, 'New password confirmation does not match.', 'error');
      return;
    }

    if (currentPassword === newPassword) {
      setInlineMessage(passwordMessageBox, 'New password must be different from your current password.', 'error');
      return;
    }

    submitButton.disabled = true;
    submitButton.textContent = 'Updating password...';
    setInlineMessage(passwordMessageBox, '', 'info');

    try {
      const response = await requestPasswordChange({
        current_password: currentPassword,
        new_password: newPassword,
      });

      passwordForm.reset();
      setInlineMessage(
        passwordMessageBox,
        response.message || 'Password updated successfully.',
        'success'
      );
      showToast('Your password was updated.', 'success');
    } catch (error) {
      setInlineMessage(passwordMessageBox, error.message || 'Unable to update your password.', 'error');
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = 'Change Password';
    }
  });
};

document.addEventListener('DOMContentLoaded', init);

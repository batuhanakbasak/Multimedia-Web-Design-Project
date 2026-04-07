import { apiRequest } from '../common/api.js';
import { requireStudentAuth } from '../common/guards.js';
import {
  createClubCardMarkup,
  escapeHtml,
  mountStudentShell,
} from '../common/utils.js';

const renderClubs = (clubs = []) => {
  const root = document.querySelector('[data-clubs-grid]');

  if (!root) {
    return;
  }

  if (!clubs.length) {
    root.innerHTML = '<div class="empty-state">No active clubs are available right now.</div>';
    return;
  }

  root.innerHTML = clubs.map((club) => createClubCardMarkup(club)).join('');
};

const init = async () => {
  const student = requireStudentAuth();

  if (!student) {
    return;
  }

  mountStudentShell({
    activePage: 'clubs',
    title: 'Explore Clubs',
    subtitle: 'Discover active clubs, read what they do, and open each club page for more detail.',
  });

  const root = document.querySelector('[data-clubs-grid]');

  if (root) {
    root.innerHTML = '<div class="loading-state">Loading clubs...</div>';
  }

  try {
    const response = await apiRequest('/student/clubs');
    renderClubs(response.data || []);
  } catch (error) {
    if (root) {
      root.innerHTML = `<div class="error-state">${escapeHtml(error.message || 'Unable to load clubs.')}</div>`;
    }
  }
};

document.addEventListener('DOMContentLoaded', init);

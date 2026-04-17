// favorites scripti: bu dosya sayfanin davranislarini ve is kurallarini yonetir.
import { apiRequest } from '../common/api.js';
import { requireStudentAuth } from '../common/guards.js';
import {
  createEventCardMarkup,
  escapeHtml,
  mountStudentShell,
  showToast,
} from '../common/utils.js';

const renderFavorites = (events = []) => {
  const root = document.querySelector('[data-favorites-grid]');

  if (!root) {
    return;
  }

  if (!events.length) {
    root.innerHTML = '<div class="empty-state">No favorite events yet.</div>';
    return;
  }

  root.innerHTML = events
    .map((event) =>
      createEventCardMarkup(event, {
        secondaryAction: `<button type="button" class="button-secondary" data-remove-favorite="${escapeHtml(event.id)}">Remove favorite</button>`,
      })
    )
    .join('');

  root.querySelectorAll('[data-remove-favorite]').forEach((button) => {
    button.addEventListener('click', async () => {
      const eventId = button.getAttribute('data-remove-favorite');

      try {
        await apiRequest(`/student/favorites/${eventId}`, { method: 'DELETE' });
        showToast('Event removed from favorites.', 'success');
        loadFavorites();
      } catch (error) {
        showToast(error.message || 'Unable to remove this favorite.', 'error');
      }
    });
  });
};

const loadFavorites = async () => {
  const root = document.querySelector('[data-favorites-grid]');

  if (root) {
    root.innerHTML = '<div class="loading-state">Loading favorite events...</div>';
  }

  try {
    const response = await apiRequest('/student/favorites');
    renderFavorites(response.data || []);
  } catch (error) {
    if (root) {
      root.innerHTML = `<div class="error-state">${escapeHtml(error.message || 'Unable to load favorites.')}</div>`;
    }
  }
};

const init = () => {
  const student = requireStudentAuth();

  if (!student) {
    return;
  }

  mountStudentShell({
    activePage: 'favorites',
    title: 'Favorite Events',
    subtitle: 'Keep a shortlist of the campus events you want to revisit later.',
  });

  document.querySelector('[data-greeting-name]')?.replaceChildren(document.createTextNode(student.full_name || 'Student'));
  loadFavorites();
};

document.addEventListener('DOMContentLoaded', init);

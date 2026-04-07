import { apiRequest } from '../common/api.js';
import { requireStudentAuth } from '../common/guards.js';
import {
  createMiniEventItemMarkup,
  createMiniListMarkup,
  escapeHtml,
  mountStudentShell,
  showToast,
} from '../common/utils.js';

const renderCounts = (dashboardData = {}) => {
  const joinedCount = document.querySelector('[data-joined-count]');
  const favoriteCount = document.querySelector('[data-favorite-count]');
  const upcomingCount = document.querySelector('[data-upcoming-count]');

  if (joinedCount) {
    joinedCount.textContent = dashboardData.joined_events_count ?? 0;
  }

  if (favoriteCount) {
    favoriteCount.textContent = dashboardData.favorite_count ?? 0;
  }

  if (upcomingCount) {
    upcomingCount.textContent = dashboardData.upcoming_joined_events?.length ?? 0;
  }
};

const init = async () => {
  const student = requireStudentAuth();

  if (!student) {
    return;
  }

  mountStudentShell({
    activePage: 'dashboard',
    title: 'Student Dashboard',
    subtitle: 'Follow your joined events, saved favorites, and new opportunities on campus.',
  });

  const greeting = document.querySelector('[data-greeting-name]');
  const upcomingRoot = document.querySelector('[data-upcoming-joined]');
  const recommendedRoot = document.querySelector('[data-recommended-events]');
  const favoritesRoot = document.querySelector('[data-favorites-preview]');

  if (greeting) {
    greeting.textContent = student.full_name || 'Student';
  }

  if (upcomingRoot) {
    upcomingRoot.innerHTML = '<div class="loading-state">Loading your dashboard...</div>';
  }

  try {
    const [dashboardResponse, myEventsResponse, favoritesResponse] = await Promise.all([
      apiRequest('/student/dashboard'),
      apiRequest('/student/my-events', { query: { page: 1, limit: 3 } }),
      apiRequest('/student/favorites'),
    ]);

    const dashboardData = dashboardResponse.data || {};
    const joinedPreview = myEventsResponse.data || dashboardData.upcoming_joined_events || [];
    const favoritePreview = (favoritesResponse.data || []).slice(0, 3);
    const recommendedEvents = dashboardData.recommended_events || [];

    renderCounts(dashboardData);

    if (upcomingRoot) {
      upcomingRoot.innerHTML = createMiniListMarkup(
        joinedPreview,
        createMiniEventItemMarkup,
        'You have not joined any events yet.'
      );
    }

    if (recommendedRoot) {
      recommendedRoot.innerHTML = createMiniListMarkup(
        recommendedEvents,
        createMiniEventItemMarkup,
        'No recommended events are available right now.'
      );
    }

    if (favoritesRoot) {
      favoritesRoot.innerHTML = createMiniListMarkup(
        favoritePreview,
        createMiniEventItemMarkup,
        'No favorite events yet.'
      );
    }
  } catch (error) {
    showToast(error.message || 'Unable to load the dashboard right now.', 'error');

    if (upcomingRoot) {
      upcomingRoot.innerHTML = `<div class="error-state">${escapeHtml(error.message || 'Unable to load dashboard data.')}</div>`;
    }
  }
};

document.addEventListener('DOMContentLoaded', init);

import { apiRequest } from '../common/api.js';
import { requireStudentAuth } from '../common/guards.js';
import {
  createMediaMarkup,
  escapeHtml,
  formatDateTime,
  getTimelineLabel,
  getTimelineStatus,
  isHistoricalEvent,
  getQueryParam,
  mountStudentShell,
  showToast,
} from '../common/utils.js';

let currentEvent = null;
let actionInFlight = false;

const getHostLabel = (event) => event.club?.name || event.organizer?.full_name || 'IBU Connect';

const renderEvent = () => {
  const root = document.querySelector('[data-event-detail]');

  if (!root || !currentEvent) {
    return;
  }

  const quotaLabel =
    Number(currentEvent.quota) > 0
      ? `${Number(currentEvent.joined_count || 0)} / ${Number(currentEvent.quota)} seats`
      : `${Number(currentEvent.joined_count || 0)} joined`;
  const timelineStatus = getTimelineStatus(currentEvent);
  const canJoin = !currentEvent.is_joined && timelineStatus === 'active';
  const canLeave = currentEvent.is_joined && !isHistoricalEvent(currentEvent);

  root.innerHTML = `
    <div class="detail-layout">
      ${createMediaMarkup(currentEvent.title || 'Event', currentEvent.image_url, 'detail-media')}

      <div class="detail-grid">
        <section class="student-panel">
          <div class="student-panel__head">
            <div>
              <p class="eyebrow">Event detail</p>
              <h2>${escapeHtml(currentEvent.title || 'Untitled event')}</h2>
            </div>
            <div class="detail-badges">
              <span class="badge">${escapeHtml(currentEvent.category || 'General')}</span>
              <span class="badge">${escapeHtml(getTimelineLabel(timelineStatus))}</span>
              ${currentEvent.is_joined ? '<span class="badge">Joined</span>' : ''}
              ${currentEvent.is_favorite ? '<span class="badge">Favorite</span>' : ''}
            </div>
          </div>

          <p class="detail-description">${escapeHtml(currentEvent.description || 'No description available for this event yet.')}</p>

          <div class="info-grid">
            <article class="info-card">
              <p class="eyebrow">Organized by</p>
              <strong>${escapeHtml(currentEvent.organizer?.full_name || 'Organizer unavailable')}</strong>
              <p>${escapeHtml(currentEvent.organizer?.email || 'No organizer email provided')}</p>
            </article>
            <article class="info-card">
              <p class="eyebrow">Club</p>
              <strong>${escapeHtml(currentEvent.club?.name || 'Independent event')}</strong>
              <p>${escapeHtml(currentEvent.club?.description || 'This event is managed directly by its organizer.')}</p>
            </article>
          </div>
        </section>

        <aside class="student-panel">
          <div class="student-panel__head">
            <div>
              <p class="eyebrow">Information</p>
              <h3>Event facts</h3>
            </div>
          </div>

          <div class="detail-facts">
            <div class="detail-facts__item">
              <span>Date and time</span>
              <strong>${escapeHtml(formatDateTime(currentEvent.event_date))}</strong>
            </div>
            <div class="detail-facts__item">
              <span>Location</span>
              <strong>${escapeHtml(currentEvent.location || 'Campus venue')}</strong>
            </div>
            <div class="detail-facts__item">
              <span>Hosted by</span>
              <strong>${escapeHtml(getHostLabel(currentEvent))}</strong>
            </div>
            <div class="detail-facts__item">
              <span>Attendance</span>
              <strong>${escapeHtml(quotaLabel)}</strong>
            </div>
            <div class="detail-facts__item">
              <span>Status</span>
              <strong>${escapeHtml(getTimelineLabel(timelineStatus))}</strong>
            </div>
          </div>

          <div class="detail-actions">
            ${
              canLeave
                ? '<button type="button" class="button-danger" data-action="leave">Leave event</button>'
                : canJoin
                  ? '<button type="button" class="button" data-action="join">Join event</button>'
                  : ''
            }
            ${
              currentEvent.is_favorite
                ? '<button type="button" class="button-secondary" data-action="remove-favorite">Remove favorite</button>'
                : '<button type="button" class="button-secondary" data-action="add-favorite">Add favorite</button>'
            }
          </div>

          <div class="inline-message is-info" data-event-feedback ${canJoin || canLeave ? 'hidden' : ''}>
            ${
              isHistoricalEvent(currentEvent)
                ? 'This event is now part of your event history.'
                : currentEvent.status !== 'active'
                  ? 'Only active events can be joined or left from this page.'
                  : ''
            }
          </div>
        </aside>
      </div>
    </div>
  `;

  root.querySelector('[data-action="join"]')?.addEventListener('click', () => handleAction('join'));
  root.querySelector('[data-action="leave"]')?.addEventListener('click', () => handleAction('leave'));
  root
    .querySelector('[data-action="add-favorite"]')
    ?.addEventListener('click', () => handleAction('add-favorite'));
  root
    .querySelector('[data-action="remove-favorite"]')
    ?.addEventListener('click', () => handleAction('remove-favorite'));
};

const setFeedback = (message, type = 'info') => {
  const feedback = document.querySelector('[data-event-feedback]');

  if (!feedback) {
    return;
  }

  feedback.hidden = !message;
  feedback.className = `inline-message is-${type}`;
  feedback.textContent = message || '';
};

const handleAction = async (action) => {
  const eventId = getQueryParam('id');

  if (!eventId || actionInFlight) {
    return;
  }

  actionInFlight = true;
  setFeedback('', 'info');

  try {
    if (action === 'join') {
      const response = await apiRequest(`/student/events/${eventId}/join`, { method: 'POST' });
      currentEvent = response.data || currentEvent;
      showToast(response.message || 'You joined the event successfully.', 'success');
    }

    if (action === 'leave') {
      const response = await apiRequest(`/student/events/${eventId}/leave`, { method: 'DELETE' });
      currentEvent = {
        ...currentEvent,
        is_joined: false,
        joined_count: Math.max(Number(currentEvent.joined_count || 1) - 1, 0),
      };
      showToast(response.message || 'You left the event.', 'success');
    }

    if (action === 'add-favorite') {
      const response = await apiRequest(`/student/favorites/${eventId}`, { method: 'POST' });
      currentEvent = { ...currentEvent, is_favorite: true };
      showToast(response.message || 'Event added to favorites.', 'success');
    }

    if (action === 'remove-favorite') {
      const response = await apiRequest(`/student/favorites/${eventId}`, { method: 'DELETE' });
      currentEvent = { ...currentEvent, is_favorite: false };
      showToast(response.message || 'Event removed from favorites.', 'success');
    }

    renderEvent();
  } catch (error) {
    setFeedback(error.message || 'Unable to complete this action.', 'error');
  } finally {
    actionInFlight = false;
  }
};

const init = async () => {
  const student = requireStudentAuth();

  if (!student) {
    return;
  }

  mountStudentShell({
    activePage: 'events',
    title: 'Event Detail',
    subtitle: 'Review event information, manage your participation, and update favorites.',
  });

  const root = document.querySelector('[data-event-detail]');
  const eventId = getQueryParam('id');

  if (!eventId) {
    if (root) {
      root.innerHTML = '<div class="error-state">The event ID is missing from the URL.</div>';
    }
    return;
  }

  if (root) {
    root.innerHTML = '<div class="loading-state">Loading event details...</div>';
  }

  try {
    const response = await apiRequest(`/student/events/${eventId}`);
    currentEvent = response.data;
    renderEvent();
  } catch (error) {
    if (root) {
      root.innerHTML = `<div class="error-state">${escapeHtml(error.message || 'Unable to load this event.')}</div>`;
    }
  }
};

document.addEventListener('DOMContentLoaded', init);

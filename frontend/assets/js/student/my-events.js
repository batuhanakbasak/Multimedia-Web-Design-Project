// my-events scripti: bu dosya sayfanin davranislarini ve is kurallarini yonetir.
import { apiRequest } from '../common/api.js';
import { requireStudentAuth } from '../common/guards.js';
import {
  createEventCardMarkup,
  escapeHtml,
  isHistoricalEvent,
  mountStudentShell,
  renderPagination,
  showToast,
} from '../common/utils.js';

const state = {
  page: 1,
  limit: 6,
};

const renderEvents = (events = []) => {
  const root = document.querySelector('[data-my-events-grid]');

  if (!root) {
    return;
  }

  if (!events.length) {
    root.innerHTML = '<div class="empty-state">You have not joined any events yet.</div>';
    return;
  }

  const upcomingEvents = events.filter((event) => !isHistoricalEvent(event));
  const historyEvents = events.filter((event) => isHistoricalEvent(event));

  const renderSection = (title, description, items, showLeaveAction) => {
    if (!items.length) {
      return '';
    }

    return `
      <section class="content-section">
        <div class="content-section__head">
          <div>
            <h2>${escapeHtml(title)}</h2>
            <p>${escapeHtml(description)}</p>
          </div>
        </div>
        <div class="card-grid">
          ${items
            .map((event) =>
              createEventCardMarkup(event, {
                primaryLabel: isHistoricalEvent(event) ? 'Open history' : 'Open joined event',
                secondaryAction: showLeaveAction
                  ? `<button type="button" class="button-danger" data-leave-event="${escapeHtml(event.id)}">Leave event</button>`
                  : '',
              })
            )
            .join('')}
        </div>
      </section>
    `;
  };

  root.innerHTML = `
    ${renderSection(
      'Upcoming and active',
      'Events you are still attending or waiting for.',
      upcomingEvents,
      true
    )}
    ${renderSection(
      'Event history',
      'Past, completed, or cancelled events remain visible here for your history.',
      historyEvents,
      false
    )}
  `;

  root.querySelectorAll('[data-leave-event]').forEach((button) => {
    button.addEventListener('click', async () => {
      const eventId = button.getAttribute('data-leave-event');

      try {
        await apiRequest(`/student/events/${eventId}/leave`, { method: 'DELETE' });
        showToast('You left the event successfully.', 'success');
        loadMyEvents();
      } catch (error) {
        showToast(error.message || 'Unable to leave this event.', 'error');
      }
    });
  });
};

const loadMyEvents = async () => {
  const root = document.querySelector('[data-my-events-grid]');
  const paginationRoot = document.querySelector('[data-my-events-pagination]');

  if (root) {
    root.innerHTML = '<div class="loading-state">Loading your joined events...</div>';
  }

  try {
    const response = await apiRequest('/student/my-events', {
      query: {
        page: state.page,
        limit: state.limit,
      },
    });

    renderEvents(response.data || []);
    renderPagination(paginationRoot, response.meta, (page) => {
      state.page = page;
      loadMyEvents();
    });
  } catch (error) {
    if (root) {
      root.innerHTML = `<div class="error-state">${escapeHtml(error.message || 'Unable to load your joined events.')}</div>`;
    }
  }
};

const init = () => {
  const student = requireStudentAuth();

  if (!student) {
    return;
  }

  mountStudentShell({
    activePage: 'my-events',
    title: 'My Events',
    subtitle: 'Review the events you joined and leave them directly when your plans change.',
  });

  document.querySelector('[data-greeting-name]')?.replaceChildren(document.createTextNode(student.full_name || 'Student'));
  loadMyEvents();
};

document.addEventListener('DOMContentLoaded', init);

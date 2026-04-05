import { apiRequest, serializeQuery } from './api.js';
import { initializeAdminPage, showToast } from './guards.js';
import { escapeHtml, formatDateOnly, formatDateTime, getEventStatusBadgeClass, getQueryId, renderPagination } from './helpers.js';
import { closeModal, confirmAction, openModal } from '../components/modal.js';

const eventState = {
  page: 1,
  limit: 10,
  search: '',
  category: '',
  status: '',
  date: '',
};

const renderEventsTable = (events = []) => {
  const tbody = document.querySelector('#events-table-body');

  if (!events.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8">
          <div class="empty-inline">No events matched the current filters.</div>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = events
    .map(
      (event) => `
        <tr>
          <td data-label="Event">
            <div class="table-primary">
              <strong>${escapeHtml(event.title)}</strong>
              <span>${escapeHtml(event.location)}</span>
            </div>
          </td>
          <td data-label="Category">${escapeHtml(event.category)}</td>
          <td data-label="Organizer">${escapeHtml(event.organizer?.full_name || '-')}</td>
          <td data-label="Club">${escapeHtml(event.club?.name || 'Independent')}</td>
          <td data-label="Date">${formatDateTime(event.event_date)}</td>
          <td data-label="Joined">${event.joined_count}</td>
          <td data-label="Status"><span class="badge ${getEventStatusBadgeClass(event.status)}">${escapeHtml(event.status)}</span></td>
          <td data-label="Actions">
            <div class="table-actions">
              <a class="button button-ghost button-small" href="./event-detail.html?id=${event.id}">View</a>
              <button type="button" class="button button-secondary button-small" data-event-action="status" data-event-id="${event.id}" data-event-title="${escapeHtml(event.title)}" data-event-status="${event.status}">
                Update Status
              </button>
              <button type="button" class="button button-danger button-small" data-event-action="delete" data-event-id="${event.id}" data-event-title="${escapeHtml(event.title)}">
                Delete
              </button>
            </div>
          </td>
        </tr>
      `
    )
    .join('');
};

const renderEventsMeta = (meta) => {
  const summary = document.querySelector('#events-summary');

  if (!meta || meta.total === 0) {
    summary.textContent = 'No events available.';
    return;
  }

  const start = (meta.page - 1) * meta.limit + 1;
  const end = Math.min(meta.page * meta.limit, meta.total);
  summary.textContent = `Showing ${start}-${end} of ${meta.total} events`;
};

const loadEvents = async () => {
  const tbody = document.querySelector('#events-table-body');
  tbody.innerHTML = `
    <tr>
      <td colspan="8">
        <div class="empty-inline">Loading events...</div>
      </td>
    </tr>
  `;

  try {
    const response = await apiRequest(`/admin/events${serializeQuery(eventState)}`);
    renderEventsTable(response.data);
    renderEventsMeta(response.meta);
    renderPagination(document.querySelector('#events-pagination'), response.meta, async (nextPage) => {
      eventState.page = nextPage;
      await loadEvents();
    });
  } catch (error) {
    showToast(error.message, 'error');
  }
};

const openStatusModal = (eventRecord) => {
  openModal({
    title: `Update status for ${eventRecord.title}`,
    description: 'Event management',
    body: `
      <form id="status-form" class="stack-form">
        <label>
          <span>Status</span>
          <select name="status">
            <option value="active" ${eventRecord.status === 'active' ? 'selected' : ''}>Active</option>
            <option value="cancelled" ${eventRecord.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
            <option value="completed" ${eventRecord.status === 'completed' ? 'selected' : ''}>Completed</option>
          </select>
        </label>
      </form>
    `,
    footer: `
      <button type="button" class="button button-ghost" data-modal-close>Cancel</button>
      <button type="submit" form="status-form" class="button button-primary">Save Status</button>
    `,
    onMount: ({ modalRoot }) => {
      const form = modalRoot.querySelector('#status-form');

      form.addEventListener('submit', async (event) => {
        event.preventDefault();

        try {
          await apiRequest(`/admin/events/${eventRecord.id}/status`, {
            method: 'PUT',
            body: {
              status: form.status.value,
            },
          });

          closeModal();
          showToast('Event status updated successfully.');
          await loadEvents();
        } catch (error) {
          showToast(error.message, 'error');
        }
      });
    },
  });
};

const deleteEvent = async (eventRecord) => {
  const shouldDelete = await confirmAction({
    title: `Delete ${eventRecord.title}`,
    description: 'Event management',
    message: 'This permanently removes the event and all related participation data.',
    confirmText: 'Delete Event',
    confirmVariant: 'danger',
  });

  if (!shouldDelete) {
    return;
  }

  try {
    await apiRequest(`/admin/events/${eventRecord.id}`, {
      method: 'DELETE',
    });

    showToast('Event deleted successfully.');
    await loadEvents();
  } catch (error) {
    showToast(error.message, 'error');
  }
};

const initializeEventsPage = async () => {
  if (document.body?.dataset.page !== 'events') {
    return;
  }

  await initializeAdminPage({
    title: 'Event Management',
    activeNav: 'events',
  });

  const filtersForm = document.querySelector('#events-filters');
  const refreshButton = document.querySelector('#events-refresh');
  const tableBody = document.querySelector('#events-table-body');

  refreshButton?.addEventListener('click', loadEvents);

  filtersForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    eventState.search = filtersForm.search.value.trim();
    eventState.category = filtersForm.category.value.trim();
    eventState.status = filtersForm.status.value;
    eventState.date = filtersForm.date.value;
    eventState.page = 1;
    await loadEvents();
  });

  filtersForm.addEventListener('reset', () => {
    requestAnimationFrame(async () => {
      eventState.search = '';
      eventState.category = '';
      eventState.status = '';
      eventState.date = '';
      eventState.page = 1;
      await loadEvents();
    });
  });

  tableBody.addEventListener('click', async (event) => {
    const trigger = event.target.closest('[data-event-action]');

    if (!trigger) {
      return;
    }

    const eventRecord = {
      id: Number.parseInt(trigger.dataset.eventId, 10),
      title: trigger.dataset.eventTitle,
      status: trigger.dataset.eventStatus,
    };

    if (trigger.dataset.eventAction === 'status') {
      openStatusModal(eventRecord);
      return;
    }

    if (trigger.dataset.eventAction === 'delete') {
      await deleteEvent(eventRecord);
    }
  });

  await loadEvents();
};

const renderEventDetail = (event) => {
  document.querySelector('#event-detail-header').innerHTML = `
    <article class="hero-card">
      <div>
        <p class="eyebrow">Event Detail</p>
        <h3>${escapeHtml(event.title)}</h3>
        <p class="hero-copy">${escapeHtml(event.description)}</p>
      </div>
      <div class="hero-badges">
        <span class="badge ${getEventStatusBadgeClass(event.status)}">${escapeHtml(event.status)}</span>
      </div>
    </article>
  `;

  document.querySelector('#event-metrics').innerHTML = `
    <article class="info-card">
      <span>Joined Participants</span>
      <strong>${event.joined_count}</strong>
    </article>
    <article class="info-card">
      <span>Quota</span>
      <strong>${event.quota}</strong>
    </article>
    <article class="info-card">
      <span>Event Date</span>
      <strong>${formatDateOnly(event.event_date)}</strong>
    </article>
  `;

  document.querySelector('#event-profile-card').innerHTML = `
    <dl class="detail-list">
      <div><dt>Category</dt><dd>${escapeHtml(event.category)}</dd></div>
      <div><dt>Location</dt><dd>${escapeHtml(event.location)}</dd></div>
      <div><dt>Organizer</dt><dd>${escapeHtml(event.organizer?.full_name || '-')}</dd></div>
      <div><dt>Club</dt><dd>${escapeHtml(event.club?.name || 'Independent')}</dd></div>
      <div><dt>Status</dt><dd>${escapeHtml(event.status)}</dd></div>
      <div><dt>Created At</dt><dd>${formatDateTime(event.created_at)}</dd></div>
    </dl>
  `;

  document.querySelector('#event-additional-info').innerHTML = `
    <div class="detail-block">
      <h4>Description</h4>
      <p>${escapeHtml(event.description)}</p>
    </div>
    <div class="detail-block">
      <h4>Image URL</h4>
      <p>${escapeHtml(event.image_url || 'No image provided')}</p>
    </div>
    <div class="detail-block">
      <h4>Metadata</h4>
      <pre class="code-block">${escapeHtml(JSON.stringify(event.metadata || {}, null, 2))}</pre>
    </div>
  `;
};

const initializeEventDetailPage = async () => {
  if (document.body?.dataset.page !== 'event-detail') {
    return;
  }

  await initializeAdminPage({
    title: 'Event Detail',
    activeNav: 'events',
  });

  const eventId = getQueryId();

  if (!eventId) {
    document.querySelector('#event-detail-header').innerHTML = `
      <div class="empty-state">A valid event id is required in the URL.</div>
    `;
    return;
  }

  try {
    const response = await apiRequest(`/admin/events/${eventId}`);
    renderEventDetail(response.data);
  } catch (error) {
    showToast(error.message, 'error');
    document.querySelector('#event-detail-header').innerHTML = `
      <div class="empty-state">${escapeHtml(error.message)}</div>
    `;
  }
};

window.addEventListener('DOMContentLoaded', async () => {
  await initializeEventsPage();
  await initializeEventDetailPage();
});

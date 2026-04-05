import { apiRequest } from './api.js';
import { initializeAdminPage, showToast } from './guards.js';
import { escapeHtml, formatDateOnly, formatDateTime, getEventStatusBadgeClass, getRoleBadgeClass } from './helpers.js';

const renderStatCards = (stats) => {
  const statItems = [
    { label: 'Total Users', value: stats.total_users, accent: 'teal' },
    { label: 'Students', value: stats.total_students, accent: 'blue' },
    { label: 'Organizers', value: stats.total_organizers, accent: 'gold' },
    { label: 'Clubs', value: stats.total_clubs, accent: 'rose' },
    { label: 'Total Events', value: stats.total_events, accent: 'slate' },
    { label: 'Active Events', value: stats.total_active_events, accent: 'green' },
    { label: 'Cancelled Events', value: stats.total_cancelled_events, accent: 'orange' },
    { label: 'Completed Events', value: stats.total_completed_events, accent: 'purple' },
  ];

  document.querySelector('#stats-grid').innerHTML = statItems
    .map(
      (item) => `
        <article class="stat-card accent-${item.accent}">
          <p>${item.label}</p>
          <strong>${item.value}</strong>
        </article>
      `
    )
    .join('');
};

const renderLatestUsers = (users = []) => {
  const tbody = document.querySelector('#latest-users-body');

  if (!users.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5">
          <div class="empty-inline">No users have been registered yet.</div>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = users
    .map(
      (user) => `
        <tr>
          <td data-label="ID">#${user.id}</td>
          <td data-label="Name">${escapeHtml(user.full_name)}</td>
          <td data-label="Email">${escapeHtml(user.email)}</td>
          <td data-label="Role"><span class="badge ${getRoleBadgeClass(user.role)}">${escapeHtml(user.role)}</span></td>
          <td data-label="Created">${formatDateOnly(user.created_at)}</td>
        </tr>
      `
    )
    .join('');
};

const renderLatestEvents = (events = []) => {
  const tbody = document.querySelector('#latest-events-body');

  if (!events.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5">
          <div class="empty-inline">No events have been created yet.</div>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = events
    .map(
      (event) => `
        <tr>
          <td data-label="Title">${escapeHtml(event.title)}</td>
          <td data-label="Organizer">${escapeHtml(event.organizer?.full_name || '-')}</td>
          <td data-label="Club">${escapeHtml(event.club?.name || 'Independent')}</td>
          <td data-label="Status"><span class="badge ${getEventStatusBadgeClass(event.status)}">${escapeHtml(event.status)}</span></td>
          <td data-label="Date">${formatDateTime(event.event_date)}</td>
        </tr>
      `
    )
    .join('');
};

const initializeDashboard = async () => {
  if (document.body?.dataset.page !== 'dashboard') {
    return;
  }

  await initializeAdminPage({
    title: 'Dashboard Overview',
    activeNav: 'dashboard',
  });

  try {
    const response = await apiRequest('/admin/dashboard');
    const stats = response.data;

    renderStatCards(stats);
    renderLatestUsers(stats.latest_registered_users);
    renderLatestEvents(stats.latest_created_events);
  } catch (error) {
    showToast(error.message, 'error');
  }
};

window.addEventListener('DOMContentLoaded', initializeDashboard);

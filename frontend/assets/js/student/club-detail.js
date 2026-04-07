import { apiRequest } from '../common/api.js';
import { requireStudentAuth } from '../common/guards.js';
import {
  createMediaMarkup,
  createMiniEventItemMarkup,
  createMiniListMarkup,
  escapeHtml,
  getQueryParam,
  mountStudentShell,
} from '../common/utils.js';

const renderManagers = (managers = []) =>
  createMiniListMarkup(
    managers,
    (manager) => `
      <article class="student-list__item">
        <strong>${escapeHtml(manager.full_name || 'Club manager')}</strong>
        <div class="student-list__meta">
          <span>${escapeHtml(manager.email || 'No email provided')}</span>
        </div>
      </article>
    `,
    'No managers are listed for this club yet.'
  );

const renderClub = (club) => {
  const root = document.querySelector('[data-club-detail]');

  if (!root) {
    return;
  }

  root.innerHTML = `
    <div class="detail-layout">
      ${createMediaMarkup(club.name || 'Club', club.logo_url, 'detail-media')}

      <div class="detail-grid">
        <section class="student-panel">
          <div class="student-panel__head">
            <div>
              <p class="eyebrow">Club detail</p>
              <h2>${escapeHtml(club.name || 'Club')}</h2>
            </div>
            <div class="detail-badges">
              <span class="badge">${Number(club.member_count || 0)} members</span>
              <span class="badge">${Number(club.event_count || 0)} events</span>
            </div>
          </div>

          <p class="detail-description">${escapeHtml(club.description || 'No description is available for this club yet.')}</p>

          <div class="info-grid">
            <article class="info-card">
              <p class="eyebrow">Created by</p>
              <strong>${escapeHtml(club.created_by?.full_name || 'Unknown')}</strong>
              <p>${escapeHtml(club.created_by?.email || 'No creator email provided')}</p>
            </article>
            <article class="info-card">
              <p class="eyebrow">Status</p>
              <strong>${club.is_active ? 'Active club' : 'Inactive club'}</strong>
              <p>Upcoming events and managers are shown below.</p>
            </article>
          </div>
        </section>

        <aside class="student-panel">
          <div class="student-panel__head">
            <div>
              <p class="eyebrow">Managers</p>
              <h3>Club team</h3>
            </div>
          </div>
          ${renderManagers(club.managers || [])}
        </aside>
      </div>

      <section class="student-panel">
        <div class="student-panel__head">
          <div>
            <p class="eyebrow">Upcoming events</p>
            <h3>What this club is planning</h3>
          </div>
        </div>
        ${createMiniListMarkup(
          club.upcoming_events || [],
          createMiniEventItemMarkup,
          'This club has no upcoming events right now.'
        )}
      </section>
    </div>
  `;
};

const init = async () => {
  const student = requireStudentAuth();

  if (!student) {
    return;
  }

  mountStudentShell({
    activePage: 'clubs',
    title: 'Club Detail',
    subtitle: 'Review club managers, summary information, and upcoming club events.',
  });

  const root = document.querySelector('[data-club-detail]');
  const clubId = getQueryParam('id');

  if (!clubId) {
    if (root) {
      root.innerHTML = '<div class="error-state">The club ID is missing from the URL.</div>';
    }
    return;
  }

  if (root) {
    root.innerHTML = '<div class="loading-state">Loading club details...</div>';
  }

  try {
    const response = await apiRequest(`/student/clubs/${clubId}`);
    renderClub(response.data || {});
  } catch (error) {
    if (root) {
      root.innerHTML = `<div class="error-state">${escapeHtml(error.message || 'Unable to load this club.')}</div>`;
    }
  }
};

document.addEventListener('DOMContentLoaded', init);

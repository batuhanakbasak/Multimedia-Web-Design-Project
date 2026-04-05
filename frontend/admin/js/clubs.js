import { apiRequest, serializeQuery } from './api.js';
import { initializeAdminPage, showToast } from './guards.js';
import { escapeHtml, formatDateOnly, formatDateTime, getActiveBadgeClass, getQueryId, renderPagination } from './helpers.js';
import { closeModal, confirmAction, openModal } from '../components/modal.js';

const clubState = {
  page: 1,
  limit: 10,
  search: '',
};

const buildClubPayload = (form, includeCreator) => {
  const payload = {
    name: form.name.value.trim(),
    description: form.description.value.trim() || null,
    logo_url: form.logo_url.value.trim() || null,
  };

  if (includeCreator && form.created_by?.value.trim()) {
    payload.created_by = Number.parseInt(form.created_by.value, 10);
  }

  return payload;
};

const renderClubsTable = (clubs = []) => {
  const tbody = document.querySelector('#clubs-table-body');

  if (!clubs.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7">
          <div class="empty-inline">No clubs matched the current filters.</div>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = clubs
    .map(
      (club) => `
        <tr>
          <td data-label="ID">#${club.id}</td>
          <td data-label="Club">
            <div class="table-primary">
              <strong>${escapeHtml(club.name)}</strong>
              <span>${escapeHtml(club.description || 'No description')}</span>
            </div>
          </td>
          <td data-label="Created By">${escapeHtml(club.created_by?.full_name || '-')}</td>
          <td data-label="Members">${club.member_count}</td>
          <td data-label="Events">${club.event_count}</td>
          <td data-label="Status"><span class="badge ${getActiveBadgeClass(club.is_active)}">${club.is_active ? 'Active' : 'Inactive'}</span></td>
          <td data-label="Actions">
            <div class="table-actions">
              <a class="button button-ghost button-small" href="./club-detail.html?id=${club.id}">View</a>
              <button
                type="button"
                class="button button-secondary button-small"
                data-club-action="edit"
                data-club-id="${club.id}"
                data-club-name="${escapeHtml(club.name)}"
                data-club-description="${escapeHtml(club.description || '')}"
                data-club-logo="${escapeHtml(club.logo_url || '')}"
              >
                Edit
              </button>
              <button type="button" class="button button-secondary button-small" data-club-action="members" data-club-id="${club.id}" data-club-name="${escapeHtml(club.name)}">Members</button>
              <button type="button" class="button button-danger button-small" data-club-action="delete" data-club-id="${club.id}" data-club-name="${escapeHtml(club.name)}">Delete</button>
            </div>
          </td>
        </tr>
      `
    )
    .join('');
};

const renderClubsMeta = (meta) => {
  const summary = document.querySelector('#clubs-summary');

  if (!meta || meta.total === 0) {
    summary.textContent = 'No clubs available.';
    return;
  }

  const start = (meta.page - 1) * meta.limit + 1;
  const end = Math.min(meta.page * meta.limit, meta.total);
  summary.textContent = `Showing ${start}-${end} of ${meta.total} clubs`;
};

const renderClubsError = (message) => {
  document.querySelector('#clubs-table-body').innerHTML = `
    <tr>
      <td colspan="7">
        <div class="empty-inline">${escapeHtml(message)}</div>
      </td>
    </tr>
  `;

  document.querySelector('#clubs-summary').textContent = 'Clubs could not be loaded.';
  renderPagination(document.querySelector('#clubs-pagination'), null, () => {});
};

const loadClubs = async () => {
  const tbody = document.querySelector('#clubs-table-body');
  tbody.innerHTML = `
    <tr>
      <td colspan="7">
        <div class="empty-inline">Loading clubs...</div>
      </td>
    </tr>
  `;

  try {
    const response = await apiRequest(`/admin/clubs${serializeQuery(clubState)}`);
    renderClubsTable(response.data);
    renderClubsMeta(response.meta);
    renderPagination(document.querySelector('#clubs-pagination'), response.meta, async (nextPage) => {
      clubState.page = nextPage;
      await loadClubs();
    });
  } catch (error) {
    showToast(error.message, 'error');
    renderClubsError(error.message);
  }
};

const openClubFormModal = (club = null) => {
  const isEditing = Boolean(club);
  const title = isEditing ? `Edit ${club.name}` : 'Create Club';
  const footerText = isEditing ? 'Save Changes' : 'Create Club';

  openModal({
    title,
    description: 'Club management',
    size: 'large',
    body: `
      <form id="club-form" class="stack-form">
        <label>
          <span>Club name</span>
          <input type="text" name="name" value="${escapeHtml(club?.name || '')}" required />
        </label>
        <label>
          <span>Description</span>
          <textarea name="description" rows="4">${escapeHtml(club?.description || '')}</textarea>
        </label>
        <label>
          <span>Logo URL</span>
          <input type="url" name="logo_url" value="${escapeHtml(club?.logo_url || '')}" placeholder="https://example.com/logo.png" />
        </label>
        ${
          isEditing
            ? ''
            : `
              <label>
                <span>Created by user ID (optional)</span>
                <input type="number" name="created_by" min="1" placeholder="Defaults to the logged-in admin" />
              </label>
            `
        }
      </form>
    `,
    footer: `
      <button type="button" class="button button-ghost" data-modal-close>Cancel</button>
      <button type="submit" form="club-form" class="button button-primary">${footerText}</button>
    `,
    onMount: ({ modalRoot }) => {
      const form = modalRoot.querySelector('#club-form');

      form.addEventListener('submit', async (event) => {
        event.preventDefault();

        try {
          const payload = buildClubPayload(form, !isEditing);
          const path = isEditing ? `/admin/clubs/${club.id}` : '/admin/clubs';
          const method = isEditing ? 'PUT' : 'POST';

          await apiRequest(path, {
            method,
            body: payload,
          });

          closeModal();
          showToast(`Club ${isEditing ? 'updated' : 'created'} successfully.`);
          await loadClubs();
        } catch (error) {
          showToast(error.message, 'error');
        }
      });
    },
  });
};

const openMembersModal = (clubId, clubName) => {
  openModal({
    title: `${clubName} Members`,
    description: 'Club members',
    size: 'large',
    body: `
      <form id="members-form" class="inline-form">
        <label>
          <span>User ID</span>
          <input type="number" name="user_id" min="1" required />
        </label>
        <label>
          <span>Member role</span>
          <select name="member_role">
            <option value="member">Member</option>
            <option value="manager">Manager</option>
          </select>
        </label>
        <button type="submit" class="button button-primary">Save Member</button>
      </form>
      <div id="members-content" class="modal-table-wrap">
        <div class="empty-inline">Loading members...</div>
      </div>
    `,
    footer: `
      <button type="button" class="button button-ghost" data-modal-close>Close</button>
    `,
    onMount: ({ modalRoot }) => {
      const membersContent = modalRoot.querySelector('#members-content');
      const form = modalRoot.querySelector('#members-form');

      const renderMembers = (members = []) => {
        if (!members.length) {
          membersContent.innerHTML = '<div class="empty-inline">No members added yet.</div>';
          return;
        }

        membersContent.innerHTML = `
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>User</th>
                  <th>System Role</th>
                  <th>Member Role</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${members
                  .map(
                    (member) => `
                      <tr>
                        <td data-label="User">
                          <div class="table-primary">
                            <strong>${escapeHtml(member.full_name)}</strong>
                            <span>${escapeHtml(member.email)}</span>
                          </div>
                        </td>
                        <td data-label="System Role">${escapeHtml(member.role)}</td>
                        <td data-label="Member Role">${escapeHtml(member.member_role)}</td>
                        <td data-label="Status"><span class="badge ${getActiveBadgeClass(member.is_active)}">${member.is_active ? 'Active' : 'Inactive'}</span></td>
                        <td data-label="Actions">
                          <button
                            type="button"
                            class="button button-danger button-small"
                            data-remove-member="${member.id}"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    `
                  )
                  .join('')}
              </tbody>
            </table>
          </div>
        `;

        membersContent.querySelectorAll('[data-remove-member]').forEach((button) => {
          button.addEventListener('click', async () => {
            const userId = Number.parseInt(button.dataset.removeMember, 10);

            if (!window.confirm('Remove this member from the club?')) {
              return;
            }

            try {
              await apiRequest(`/admin/clubs/${clubId}/members/${userId}`, {
                method: 'DELETE',
              });

              showToast('Club member removed successfully.');
              await fetchMembers();
            } catch (error) {
              showToast(error.message, 'error');
            }
          });
        });
      };

      const fetchMembers = async () => {
        try {
          const response = await apiRequest(`/admin/clubs/${clubId}/members`);
          renderMembers(response.data);
        } catch (error) {
          membersContent.innerHTML = `<div class="empty-inline">${escapeHtml(error.message)}</div>`;
        }
      };

      form.addEventListener('submit', async (event) => {
        event.preventDefault();

        try {
          await apiRequest(`/admin/clubs/${clubId}/members`, {
            method: 'POST',
            body: {
              user_id: Number.parseInt(form.user_id.value, 10),
              member_role: form.member_role.value,
            },
          });

          form.reset();
          showToast('Club member saved successfully.');
          await fetchMembers();
        } catch (error) {
          showToast(error.message, 'error');
        }
      });

      fetchMembers();
    },
  });
};

const deleteClub = async (clubId, clubName) => {
  const shouldDelete = await confirmAction({
    title: `Delete ${clubName}`,
    description: 'Club management',
    message: 'This permanently removes the club and its memberships.',
    confirmText: 'Delete Club',
    confirmVariant: 'danger',
  });

  if (!shouldDelete) {
    return;
  }

  try {
    await apiRequest(`/admin/clubs/${clubId}`, {
      method: 'DELETE',
    });

    showToast('Club deleted successfully.');
    await loadClubs();
  } catch (error) {
    showToast(error.message, 'error');
  }
};

const initializeClubsPage = async () => {
  if (document.body?.dataset.page !== 'clubs') {
    return;
  }

  try {
    await initializeAdminPage({
      title: 'Club Management',
      activeNav: 'clubs',
    });
  } catch (error) {
    renderClubsError(error.message);
    return;
  }

  const filtersForm = document.querySelector('#clubs-filters');
  const createButton = document.querySelector('#clubs-create-button');
  const refreshButton = document.querySelector('#clubs-refresh');
  const tableBody = document.querySelector('#clubs-table-body');

  createButton?.addEventListener('click', () => openClubFormModal());
  refreshButton?.addEventListener('click', loadClubs);

  filtersForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    clubState.search = filtersForm.search.value.trim();
    clubState.page = 1;
    await loadClubs();
  });

  filtersForm.addEventListener('reset', () => {
    requestAnimationFrame(async () => {
      clubState.search = '';
      clubState.page = 1;
      await loadClubs();
    });
  });

  tableBody.addEventListener('click', async (event) => {
    const trigger = event.target.closest('[data-club-action]');

    if (!trigger) {
      return;
    }

    if (trigger.dataset.clubAction === 'edit') {
      openClubFormModal({
        id: Number.parseInt(trigger.dataset.clubId, 10),
        name: trigger.dataset.clubName,
        description: trigger.dataset.clubDescription,
        logo_url: trigger.dataset.clubLogo,
      });
      return;
    }

    if (trigger.dataset.clubAction === 'members') {
      openMembersModal(Number.parseInt(trigger.dataset.clubId, 10), trigger.dataset.clubName);
      return;
    }

    if (trigger.dataset.clubAction === 'delete') {
      await deleteClub(Number.parseInt(trigger.dataset.clubId, 10), trigger.dataset.clubName);
    }
  });

  await loadClubs();
};

const renderClubDetail = (club, members) => {
  document.querySelector('#club-detail-header').innerHTML = `
    <article class="hero-card">
      <div>
        <p class="eyebrow">Club Detail</p>
        <h3>${escapeHtml(club.name)}</h3>
        <p class="hero-copy">${escapeHtml(club.description || 'No description provided')}</p>
      </div>
      <div class="hero-badges">
        <span class="badge ${getActiveBadgeClass(club.is_active)}">${club.is_active ? 'Active' : 'Inactive'}</span>
      </div>
    </article>
  `;

  document.querySelector('#club-metrics').innerHTML = `
    <article class="info-card">
      <span>Members</span>
      <strong>${club.member_count}</strong>
    </article>
    <article class="info-card">
      <span>Events</span>
      <strong>${club.event_count}</strong>
    </article>
    <article class="info-card">
      <span>Created At</span>
      <strong>${formatDateOnly(club.created_at)}</strong>
    </article>
  `;

  document.querySelector('#club-profile-card').innerHTML = `
    <dl class="detail-list">
      <div><dt>Created By</dt><dd>${escapeHtml(club.created_by?.full_name || '-')}</dd></div>
      <div><dt>Creator Email</dt><dd>${escapeHtml(club.created_by?.email || '-')}</dd></div>
      <div><dt>Status</dt><dd>${club.is_active ? 'Active' : 'Inactive'}</dd></div>
      <div><dt>Last Updated</dt><dd>${formatDateTime(club.updated_at)}</dd></div>
    </dl>
  `;

  document.querySelector('#club-managers').innerHTML = club.managers.length
    ? club.managers
        .map(
          (manager) => `
            <article class="mini-card">
              <strong>${escapeHtml(manager.full_name)}</strong>
              <span>${escapeHtml(manager.email)}</span>
            </article>
          `
        )
        .join('')
    : '<div class="empty-inline">No club managers available.</div>';

  document.querySelector('#club-recent-events').innerHTML = club.recent_events.length
    ? `
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            ${club.recent_events
              .map(
                (event) => `
                  <tr>
                    <td data-label="Title">${escapeHtml(event.title)}</td>
                    <td data-label="Status">${escapeHtml(event.status)}</td>
                    <td data-label="Date">${formatDateTime(event.event_date)}</td>
                  </tr>
                `
              )
              .join('')}
          </tbody>
        </table>
      </div>
    `
    : '<div class="empty-inline">This club does not have events yet.</div>';

  document.querySelector('#club-members').innerHTML = members.length
    ? `
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>User</th>
              <th>Role</th>
              <th>Member Role</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${members
              .map(
                (member) => `
                  <tr>
                    <td data-label="User">
                      <div class="table-primary">
                        <strong>${escapeHtml(member.full_name)}</strong>
                        <span>${escapeHtml(member.email)}</span>
                      </div>
                    </td>
                    <td data-label="Role">${escapeHtml(member.role)}</td>
                    <td data-label="Member Role">${escapeHtml(member.member_role)}</td>
                    <td data-label="Status"><span class="badge ${getActiveBadgeClass(member.is_active)}">${member.is_active ? 'Active' : 'Inactive'}</span></td>
                  </tr>
                `
              )
              .join('')}
          </tbody>
        </table>
      </div>
    `
    : '<div class="empty-inline">No members found for this club.</div>';
};

const initializeClubDetailPage = async () => {
  if (document.body?.dataset.page !== 'club-detail') {
    return;
  }

  try {
    await initializeAdminPage({
      title: 'Club Detail',
      activeNav: 'clubs',
    });
  } catch (error) {
    document.querySelector('#club-detail-header').innerHTML = `
      <div class="empty-state">${escapeHtml(error.message)}</div>
    `;
    return;
  }

  const clubId = getQueryId();

  if (!clubId) {
    document.querySelector('#club-detail-header').innerHTML = `
      <div class="empty-state">A valid club id is required in the URL.</div>
    `;
    return;
  }

  try {
    const [clubResponse, membersResponse] = await Promise.all([
      apiRequest(`/admin/clubs/${clubId}`),
      apiRequest(`/admin/clubs/${clubId}/members`),
    ]);

    renderClubDetail(clubResponse.data, membersResponse.data);
  } catch (error) {
    showToast(error.message, 'error');
    document.querySelector('#club-detail-header').innerHTML = `
      <div class="empty-state">${escapeHtml(error.message)}</div>
    `;
  }
};

window.addEventListener('DOMContentLoaded', async () => {
  await initializeClubsPage();
  await initializeClubDetailPage();
});

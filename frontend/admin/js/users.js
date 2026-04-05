import { apiRequest, serializeQuery } from './api.js';
import { initializeAdminPage, showToast } from './guards.js';
import { escapeHtml, formatDateOnly, formatDateTime, getActiveBadgeClass, getQueryId, getRoleBadgeClass, renderPagination } from './helpers.js';
import { closeModal, confirmAction, openModal } from '../components/modal.js';

const userState = {
  page: 1,
  limit: 10,
  search: '',
  role: '',
  is_active: '',
};

const renderUsersTable = (users = []) => {
  const tbody = document.querySelector('#users-table-body');

  if (!users.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7">
          <div class="empty-inline">No users matched the current filters.</div>
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
          <td data-label="User">
            <div class="table-primary">
              <strong>${escapeHtml(user.full_name)}</strong>
              <span>${escapeHtml(user.email)}</span>
            </div>
          </td>
          <td data-label="Role"><span class="badge ${getRoleBadgeClass(user.role)}">${escapeHtml(user.role)}</span></td>
          <td data-label="Status"><span class="badge ${getActiveBadgeClass(user.is_active)}">${user.is_active ? 'Active' : 'Inactive'}</span></td>
          <td data-label="Created">${formatDateOnly(user.created_at)}</td>
          <td data-label="Last Login">${user.last_login_at ? formatDateTime(user.last_login_at) : '-'}</td>
          <td data-label="Actions">
            <div class="table-actions">
              <a class="button button-ghost button-small" href="./user-detail.html?id=${user.id}">View</a>
              <button
                type="button"
                class="button button-secondary button-small"
                data-user-action="role"
                data-user-id="${user.id}"
                data-user-name="${escapeHtml(user.full_name)}"
                data-user-role="${user.role}"
              >
                Change Role
              </button>
              <button
                type="button"
                class="button button-${user.is_active ? 'danger' : 'secondary'} button-small"
                data-user-action="status"
                data-user-id="${user.id}"
                data-user-name="${escapeHtml(user.full_name)}"
                data-user-active="${user.is_active}"
              >
                ${user.is_active ? 'Deactivate' : 'Activate'}
              </button>
            </div>
          </td>
        </tr>
      `
    )
    .join('');
};

const renderUsersMeta = (meta) => {
  const summary = document.querySelector('#users-summary');

  if (!meta || meta.total === 0) {
    summary.textContent = 'No users available.';
    return;
  }

  const start = (meta.page - 1) * meta.limit + 1;
  const end = Math.min(meta.page * meta.limit, meta.total);
  summary.textContent = `Showing ${start}-${end} of ${meta.total} users`;
};

const renderUsersError = (message) => {
  document.querySelector('#users-table-body').innerHTML = `
    <tr>
      <td colspan="7">
        <div class="empty-inline">${escapeHtml(message)}</div>
      </td>
    </tr>
  `;

  document.querySelector('#users-summary').textContent = 'Users could not be loaded.';
  renderPagination(document.querySelector('#users-pagination'), null, () => {});
};

const openRoleModal = (user) => {
  openModal({
    title: `Change role for ${user.name}`,
    description: 'User management',
    body: `
      <form id="role-form" class="stack-form">
        <label>
          <span>Role</span>
          <select name="role" required>
            <option value="student" ${user.role === 'student' ? 'selected' : ''}>Student</option>
            <option value="organizer" ${user.role === 'organizer' ? 'selected' : ''}>Organizer</option>
            <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin</option>
          </select>
        </label>
      </form>
    `,
    footer: `
      <button type="button" class="button button-ghost" data-modal-close>Cancel</button>
      <button type="submit" form="role-form" class="button button-primary">Save Role</button>
    `,
    onMount: ({ modalRoot }) => {
      const form = modalRoot.querySelector('#role-form');

      form.addEventListener('submit', async (event) => {
        event.preventDefault();

        try {
          await apiRequest(`/admin/users/${user.id}/role`, {
            method: 'PUT',
            body: {
              role: form.role.value,
            },
          });

          closeModal();
          showToast('User role updated successfully.');
          await loadUsers();
        } catch (error) {
          showToast(error.message, 'error');
        }
      });
    },
  });
};

const toggleUserStatus = async (user) => {
  const shouldContinue = await confirmAction({
    title: `${user.isActive ? 'Deactivate' : 'Activate'} ${user.name}`,
    description: 'User management',
    message: `This will ${user.isActive ? 'disable' : 'enable'} this account for protected access.`,
    confirmText: user.isActive ? 'Deactivate' : 'Activate',
    confirmVariant: user.isActive ? 'danger' : 'primary',
  });

  if (!shouldContinue) {
    return;
  }

  try {
    await apiRequest(`/admin/users/${user.id}/status`, {
      method: 'PUT',
      body: {
        is_active: !user.isActive,
      },
    });

    showToast(`User ${user.isActive ? 'deactivated' : 'activated'} successfully.`);
    await loadUsers();
  } catch (error) {
    showToast(error.message, 'error');
  }
};

const loadUsers = async () => {
  const queryString = serializeQuery(userState);
  const tbody = document.querySelector('#users-table-body');

  tbody.innerHTML = `
    <tr>
      <td colspan="7">
        <div class="empty-inline">Loading users...</div>
      </td>
    </tr>
  `;

  try {
    const response = await apiRequest(`/admin/users${queryString}`);
    renderUsersTable(response.data);
    renderUsersMeta(response.meta);
    renderPagination(document.querySelector('#users-pagination'), response.meta, async (nextPage) => {
      userState.page = nextPage;
      await loadUsers();
    });
  } catch (error) {
    showToast(error.message, 'error');
    renderUsersError(error.message);
  }
};

const initializeUsersPage = async () => {
  if (document.body?.dataset.page !== 'users') {
    return;
  }

  try {
    await initializeAdminPage({
      title: 'User Management',
      activeNav: 'users',
    });
  } catch (error) {
    renderUsersError(error.message);
    return;
  }

  const filtersForm = document.querySelector('#users-filters');
  const tableBody = document.querySelector('#users-table-body');
  const refreshButton = document.querySelector('#users-refresh');

  filtersForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    userState.search = filtersForm.search.value.trim();
    userState.role = filtersForm.role.value;
    userState.is_active = filtersForm.is_active.value;
    userState.page = 1;
    await loadUsers();
  });

  filtersForm.addEventListener('reset', () => {
    requestAnimationFrame(async () => {
      userState.search = '';
      userState.role = '';
      userState.is_active = '';
      userState.page = 1;
      await loadUsers();
    });
  });

  refreshButton?.addEventListener('click', loadUsers);

  tableBody.addEventListener('click', async (event) => {
    const trigger = event.target.closest('[data-user-action]');

    if (!trigger) {
      return;
    }

    const user = {
      id: Number.parseInt(trigger.dataset.userId, 10),
      name: trigger.dataset.userName,
      role: trigger.dataset.userRole,
      isActive: trigger.dataset.userActive === 'true',
    };

    if (trigger.dataset.userAction === 'role') {
      openRoleModal(user);
      return;
    }

    if (trigger.dataset.userAction === 'status') {
      await toggleUserStatus(user);
    }
  });

  await loadUsers();
};

const renderUserDetail = (user) => {
  document.querySelector('#user-detail-header').innerHTML = `
    <article class="hero-card">
      <div>
        <p class="eyebrow">User Detail</p>
        <h3>${escapeHtml(user.full_name)}</h3>
        <p class="hero-copy">${escapeHtml(user.email)}</p>
      </div>
      <div class="hero-badges">
        <span class="badge ${getRoleBadgeClass(user.role)}">${escapeHtml(user.role)}</span>
        <span class="badge ${getActiveBadgeClass(user.is_active)}">${user.is_active ? 'Active' : 'Inactive'}</span>
      </div>
    </article>
  `;

  document.querySelector('#user-metrics').innerHTML = `
    <article class="info-card">
      <span>Joined Events</span>
      <strong>${user.joined_events_count}</strong>
    </article>
    <article class="info-card">
      <span>Created Events</span>
      <strong>${user.created_events_count}</strong>
    </article>
    <article class="info-card">
      <span>Favorites</span>
      <strong>${user.favorite_count}</strong>
    </article>
  `;

  document.querySelector('#user-profile-card').innerHTML = `
    <dl class="detail-list">
      <div><dt>Email</dt><dd>${escapeHtml(user.email)}</dd></div>
      <div><dt>Role</dt><dd>${escapeHtml(user.role)}</dd></div>
      <div><dt>Status</dt><dd>${user.is_active ? 'Active' : 'Inactive'}</dd></div>
      <div><dt>Created At</dt><dd>${formatDateTime(user.created_at)}</dd></div>
      <div><dt>Last Login</dt><dd>${user.last_login_at ? formatDateTime(user.last_login_at) : '-'}</dd></div>
    </dl>
  `;

  const membershipsRoot = document.querySelector('#user-memberships');

  if (!user.club_memberships.length) {
    membershipsRoot.innerHTML = '<div class="empty-inline">This user is not a member of any club.</div>';
    return;
  }

  membershipsRoot.innerHTML = `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Club</th>
            <th>Member Role</th>
            <th>Club Status</th>
            <th>Joined At</th>
          </tr>
        </thead>
        <tbody>
          ${user.club_memberships
            .map(
              (membership) => `
                <tr>
                  <td data-label="Club">${escapeHtml(membership.name)}</td>
                  <td data-label="Member Role">${escapeHtml(membership.member_role)}</td>
                  <td data-label="Club Status"><span class="badge ${getActiveBadgeClass(membership.is_active)}">${membership.is_active ? 'Active' : 'Inactive'}</span></td>
                  <td data-label="Joined At">${formatDateOnly(membership.joined_at)}</td>
                </tr>
              `
            )
            .join('')}
        </tbody>
      </table>
    </div>
  `;
};

const initializeUserDetailPage = async () => {
  if (document.body?.dataset.page !== 'user-detail') {
    return;
  }

  try {
    await initializeAdminPage({
      title: 'User Detail',
      activeNav: 'users',
    });
  } catch (error) {
    document.querySelector('#user-detail-header').innerHTML = `
      <div class="empty-state">${escapeHtml(error.message)}</div>
    `;
    return;
  }

  const userId = getQueryId();

  if (!userId) {
    document.querySelector('#user-detail-header').innerHTML = `
      <div class="empty-state">A valid user id is required in the URL.</div>
    `;
    return;
  }

  try {
    const response = await apiRequest(`/admin/users/${userId}`);
    renderUserDetail(response.data);
  } catch (error) {
    showToast(error.message, 'error');
    document.querySelector('#user-detail-header').innerHTML = `
      <div class="empty-state">${escapeHtml(error.message)}</div>
    `;
  }
};

window.addEventListener('DOMContentLoaded', async () => {
  await initializeUsersPage();
  await initializeUserDetailPage();
});

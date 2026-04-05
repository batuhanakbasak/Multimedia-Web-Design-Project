const links = [
  { key: 'dashboard', label: 'Dashboard', href: './dashboard.html' },
  { key: 'users', label: 'Users', href: './users.html' },
  { key: 'clubs', label: 'Clubs', href: './clubs.html' },
  { key: 'events', label: 'Events', href: './events.html' },
];

const initialsFromName = (name = 'Admin') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

export const renderSidebar = (activeNav, admin) => `
  <div class="sidebar-panel">
    <div class="sidebar-brand">
      <div class="sidebar-brand-mark">AE</div>
      <div>
        <p class="eyebrow">University Events</p>
        <h1>Admin Panel</h1>
      </div>
      <button type="button" class="icon-button sidebar-close" data-sidebar-close aria-label="Close sidebar">
        <span></span>
      </button>
    </div>

    <div class="sidebar-profile">
      <div class="avatar-chip">${initialsFromName(admin?.full_name)}</div>
      <div>
        <strong>${admin?.full_name || 'Administrator'}</strong>
        <p>${admin?.email || 'admin@example.com'}</p>
      </div>
    </div>

    <nav class="sidebar-nav" aria-label="Admin navigation">
      ${links
        .map(
          (link) => `
            <a href="${link.href}" class="${activeNav === link.key ? 'active' : ''}">
              <span>${link.label}</span>
            </a>
          `
        )
        .join('')}
    </nav>

    <div class="sidebar-footer">
      <p>Only active admins can access this area.</p>
      <button type="button" class="button button-ghost button-block" data-logout-trigger>
        Log Out
      </button>
    </div>
  </div>
`;

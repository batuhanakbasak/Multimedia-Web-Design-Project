// navbar scripti: bu dosya sayfanin davranislarini ve is kurallarini yonetir.
const greetingByHour = (date = new Date()) => {
  const hour = date.getHours();

  if (hour < 12) {
    return 'Good morning';
  }

  if (hour < 18) {
    return 'Good afternoon';
  }

  return 'Good evening';
};

export const renderNavbar = ({ title, admin }) => `
  <div class="topbar">
    <div class="topbar-title-group">
      <button type="button" class="icon-button mobile-only" data-sidebar-toggle aria-label="Open sidebar">
        <span></span>
      </button>
      <div>
        <p class="eyebrow">${greetingByHour()}, ${admin?.full_name?.split(' ')[0] || 'Admin'}</p>
        <h2>${title}</h2>
      </div>
    </div>

    <div class="topbar-actions">
      <div class="admin-chip">
        <span class="chip-label">Role</span>
        <strong>${admin?.role || 'admin'}</strong>
      </div>
      <button type="button" class="button button-secondary topbar-logout desktop-only" data-logout-trigger>
        Logout
      </button>
    </div>
  </div>
`;

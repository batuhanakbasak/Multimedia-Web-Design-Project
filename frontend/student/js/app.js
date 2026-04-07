import { getStudentToken, clearStudentSession, redirectToLogin } from './auth.js';

export const requireAuth = () => {
    const token = getStudentToken();
    if (!token) {
        redirectToLogin('session');
        return null;
    }
    try {
        const studentProfile = localStorage.getItem('student_profile');
        return studentProfile ? JSON.parse(studentProfile) : { full_name: 'Student' };
    } catch (e) {
        return { full_name: 'Student' };
    }
};

export const escapeHtml = (unsafe) => {
    return unsafe
        ?.replace(/&/g, "&amp;")
        ?.replace(/</g, "&lt;")
        ?.replace(/>/g, "&gt;")
        ?.replace(/"/g, "&quot;")
        ?.replace(/'/g, "&#039;");
};

export const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export const renderSidebar = (activeKey = 'dashboard') => {
    const sidebarRoot = document.getElementById('sidebar-root');
    if (!sidebarRoot) return;

    const navItems = [
        { key: 'dashboard', label: 'Explore Events', href: 'dashboard.html' },
        { key: 'my-events', label: 'My Events', href: 'my-events.html' },
        { key: 'profile', label: 'My Profile', href: 'profile.html' }
    ];

    sidebarRoot.innerHTML = `
    <div class="sidebar-panel">
      <div class="sidebar-brand">
        <div class="sidebar-brand-mark">IBU</div>
        <div class="sidebar-brand-copy">
          <p class="eyebrow">Student Portal</p>
          <h1>IBU Connect</h1>
        </div>
      </div>

      <nav class="sidebar-nav">
        ${navItems.map(item => `
          <a href="${item.href}" class="${activeKey === item.key ? 'active' : ''}">
            ${item.label}
          </a>
        `).join('')}
      </nav>

      <div class="sidebar-footer">
        <button id="logoutBtn" class="button button-block sidebar-logout">Log Out</button>
      </div>
    </div>
  `;

    document.getElementById('logoutBtn')?.addEventListener('click', () => {
        if (confirm('Are you sure you want to log out?')) {
            clearStudentSession();
            redirectToLogin('logout');
        }
    });
};

export const renderNavbar = (title = 'Student Dashboard') => {
    const navbarRoot = document.getElementById('navbar-root');
    if (!navbarRoot) return;

    const student = JSON.parse(localStorage.getItem('student_profile') || '{}');

    navbarRoot.innerHTML = `
    <div class="topbar">
      <div class="topbar-title-group">
        <h2>${title}</h2>
      </div>
      <div class="topbar-actions">
        <div class="admin-chip">
          <span class="avatar-chip" style="background:var(--text-main); color:white;">
            ${(student.full_name || 'S').substring(0, 1).toUpperCase()}
          </span>
          <strong>${escapeHtml(student.full_name || 'Student')}</strong>
        </div>
      </div>
    </div>
  `;
};

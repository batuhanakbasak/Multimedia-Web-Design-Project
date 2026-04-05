
import { getOrganizerToken, getOrganizerProfile, logoutOrganizer } from './auth.js';
import { apiRequest } from './api.js';

export const requireAuth = () => {
    const token = getOrganizerToken();
    if (!token) {
        window.location.href = './login.html?reason=session';
    }
    return getOrganizerProfile();
};

export const renderSidebar = (activeNav) => {
    const root = document.getElementById('sidebar-root');
    if (!root) return;
    
    const profile = getOrganizerProfile() || { full_name: 'Organizer', email: '' };
    const initials = profile.full_name.substring(0,2).toUpperCase();

    const links = [
        { key: 'dashboard', label: 'Dashboard', href: 'dashboard.html' },
        { key: 'create-event', label: 'Create Event', href: 'create-event.html' }
    ];

    root.innerHTML = `
        <div class="sidebar-panel">
            <div class="sidebar-brand">
                <div class="sidebar-brand-mark" style="background:var(--teal)">O</div>
                <div class="sidebar-brand-copy">
                    <p class="eyebrow">IBU Connect</p>
                    <h1>Organizer</h1>
                </div>
            </div>
            <div class="sidebar-profile">
                <div class="avatar-chip">${initials}</div>
                <div class="sidebar-profile-copy">
                    <strong>${profile.full_name}</strong>
                    <p>${profile.email}</p>
                </div>
            </div>
            <nav class="sidebar-nav">
                ${links.map(l => `<a href="${l.href}" class="${activeNav === l.key ? 'active' : ''}"><span>${l.label}</span></a>`).join('')}
            </nav>
            <div class="sidebar-footer">
                <button type="button" class="button button-block sidebar-logout" id="logoutBtn">Log Out</button>
            </div>
        </div>
    `;

    document.getElementById('logoutBtn')?.addEventListener('click', () => {
        logoutOrganizer();
    });
};

export const renderNavbar = (title) => {
    const root = document.getElementById('navbar-root');
    if (!root) return;
    root.innerHTML = `
        <div class="navbar-content">
            <h2 class="navbar-title">${title}</h2>
        </div>
    `;
};

export const escapeHtml = (unsafe) => {
    return (unsafe || '').toString()
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
};

export const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
};

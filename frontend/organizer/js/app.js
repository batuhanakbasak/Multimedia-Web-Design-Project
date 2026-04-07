
import { getOrganizerToken, getOrganizerProfile, logoutOrganizer } from './auth.js';
import { apiRequest } from './api.js';

const setupSidebarInteractions = () => {
    let overlay = document.querySelector('.sidebar-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'sidebar-overlay';
        document.body.appendChild(overlay);
    }
    const openBtn = document.querySelector('[data-sidebar-toggle]');
    const closeBtn = document.querySelector('[data-sidebar-close]');

    const closeSidebar = () => document.body.classList.remove('sidebar-open');
    const openSidebar = () => document.body.classList.add('sidebar-open');

    overlay?.addEventListener('click', closeSidebar);
    closeBtn?.addEventListener('click', closeSidebar);
    openBtn?.addEventListener('click', openSidebar);
    window.addEventListener('resize', () => {
        if (window.innerWidth > 960) closeSidebar();
    });
};

export const requireAuth = () => {
    const token = getOrganizerToken();
    if (!token) {
        window.location.href = './organizer-login.html?reason=session';
    }
    return getOrganizerProfile();
};

export const renderSidebar = (activeNav) => {
    const root = document.getElementById('sidebar-root');
    if (!root) return;
    
    const profile = getOrganizerProfile() || { full_name: 'Organizer', email: '' };
    const initials = ((profile.full_name || 'Organizer').trim().slice(0, 2) || 'OR').toUpperCase();
    const safeName = escapeHtml(profile.full_name || 'Organizer');
    const safeEmail = escapeHtml(profile.email || '');

    const links = [
        { key: 'dashboard', label: 'Dashboard', href: 'dashboard.html' },
        { key: 'create-event', label: 'Create Event', href: 'create-event.html' },
        { key: 'clubs', label: 'Manage Clubs', href: 'clubs.html' },
        { key: 'profile', label: 'My Profile', href: 'profile.html' }
    ];

    root.innerHTML = `
        <div class="sidebar-panel">
            <div class="sidebar-brand">
                <div class="sidebar-brand-mark" style="background:var(--text-main); color:white">O</div>
                <div class="sidebar-brand-copy">
                    <p class="eyebrow">IBU Connect</p>
                    <h1>Organizer</h1>
                </div>
                <button type="button" class="icon-button sidebar-close mobile-only" data-sidebar-close aria-label="Close menu">
                    <span></span>
                </button>
            </div>
            <div class="sidebar-profile">
                <div class="avatar-chip">${initials}</div>
                <div class="sidebar-profile-copy">
                    <strong>${safeName}</strong>
                    <p>${safeEmail}</p>
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
    setupSidebarInteractions();
};

export const renderNavbar = (title) => {
    const root = document.getElementById('navbar-root');
    if (!root) return;
    root.innerHTML = `
        <div class="topbar">
            <div class="topbar-title-group">
                <button type="button" class="icon-button mobile-only" data-sidebar-toggle aria-label="Open menu">
                    <span></span>
                </button>
                <h2>${escapeHtml(title)}</h2>
            </div>
            <div class="topbar-actions">
                <button type="button" class="button button-secondary topbar-logout desktop-only" id="topbarLogoutBtn">Log Out</button>
            </div>
        </div>
    `;
    document.getElementById('topbarLogoutBtn')?.addEventListener('click', logoutOrganizer);
    setupSidebarInteractions();
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

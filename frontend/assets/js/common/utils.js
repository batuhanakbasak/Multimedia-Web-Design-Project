// utils scripti: bu dosya sayfanin davranislarini ve is kurallarini yonetir.
import { getStudentProfile, logoutStudent } from './auth.js';

const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', href: 'dashboard.html' },
  { key: 'events', label: 'Events', href: 'events.html' },
  { key: 'my-events', label: 'My Events', href: 'my-events.html' },
  { key: 'favorites', label: 'Favorites', href: 'favorites.html' },
  { key: 'clubs', label: 'Clubs', href: 'clubs.html' },
  { key: 'profile', label: 'Profile', href: 'profile.html' },
];

export const escapeHtml = (value = '') =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

export const truncateText = (value, length = 140) => {
  const text = String(value || '').trim();
  return text.length > length ? `${text.slice(0, Math.max(length - 1, 1)).trim()}...` : text;
};

export const getInitials = (name = 'Student') =>
  String(name)
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'ST';

export const formatDateTime = (value) => {
  if (!value) {
    return 'Date unavailable';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Date unavailable';
  }

  return date.toLocaleString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const getTimelineStatus = (event = {}) => event.timeline_status || event.status || 'active';

export const getTimelineLabel = (status = 'active') => {
  const labels = {
    active: 'Active',
    passed: 'Passed',
    cancelled: 'Cancelled',
    completed: 'Completed',
  };

  return labels[status] || status;
};

export const isPastEvent = (event = {}) => getTimelineStatus(event) === 'passed';

export const isHistoricalEvent = (event = {}) => {
  const timelineStatus = getTimelineStatus(event);
  return timelineStatus === 'passed' || timelineStatus === 'cancelled' || timelineStatus === 'completed';
};

export const getQueryParam = (key) => new URLSearchParams(window.location.search).get(key);

export const setInlineMessage = (element, message, type = 'info') => {
  if (!element) {
    return;
  }

  if (!message) {
    element.hidden = true;
    element.className = 'inline-message';
    element.textContent = '';
    return;
  }

  element.setAttribute('role', 'status');
  element.setAttribute('aria-live', type === 'error' ? 'assertive' : 'polite');
  element.hidden = false;
  element.className = `inline-message is-${type}`;
  element.textContent = message;
};

const getToastStack = () => {
  let container = document.querySelector('[data-toast-stack]');

  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-stack';
    container.setAttribute('data-toast-stack', 'true');
    container.setAttribute('aria-live', 'polite');
    container.setAttribute('aria-atomic', 'true');
    document.body.appendChild(container);
  }

  return container;
};

export const showToast = (message, type = 'info') => {
  const toast = document.createElement('div');
  toast.className = `toast is-${type}`;
  toast.setAttribute('role', type === 'error' ? 'alert' : 'status');
  toast.textContent = message;

  getToastStack().appendChild(toast);

  window.setTimeout(() => {
    toast.remove();
  }, 4200);
};

const ensureSidebarOverlay = () => {
  let overlay = document.querySelector('[data-student-sidebar-overlay]');

  if (!overlay) {
    overlay = document.createElement('button');
    overlay.type = 'button';
    overlay.className = 'student-sidebar-overlay';
    overlay.setAttribute('data-student-sidebar-overlay', 'true');
    overlay.setAttribute('aria-label', 'Close menu');
    document.body.appendChild(overlay);
  }

  if (!overlay.dataset.bound) {
    overlay.addEventListener('click', closeSidebar);
    overlay.dataset.bound = 'true';
  }

  return overlay;
};

const closeSidebar = () => {
  document.body.classList.remove('student-sidebar-open');
  document.body.classList.remove('is-locked');
};

const openSidebar = () => {
  document.body.classList.add('student-sidebar-open');
  document.body.classList.add('is-locked');
};

export const mountStudentShell = ({ activePage, title, subtitle }) => {
  const sidebarRoot = document.querySelector('[data-student-sidebar]');
  const topbarRoot = document.querySelector('[data-student-topbar]');
  const profile = getStudentProfile() || { full_name: 'Student', email: 'student@ibu.edu.ba' };
  const initials = getInitials(profile.full_name);

  if (sidebarRoot) {
    sidebarRoot.innerHTML = `
      <div class="student-sidebar__panel">
        <div class="student-brand">
          <div class="student-brand__mark">IBU</div>
          <div class="student-brand__copy">
            <p class="eyebrow">Student Portal</p>
            <h1>IBU Connect</h1>
          </div>
        </div>

        <section class="student-user-card">
          <div class="student-avatar">${escapeHtml(initials)}</div>
          <div>
            <strong>${escapeHtml(profile.full_name || 'Student')}</strong>
            <span>${escapeHtml(profile.email || 'student@ibu.edu.ba')}</span>
          </div>
        </section>

        <nav class="student-nav" aria-label="Student navigation">
          ${NAV_ITEMS.map(
            (item) => `
              <a href="${item.href}" class="${item.key === activePage ? 'is-active' : ''}" ${item.key === activePage ? 'aria-current="page"' : ''}>
                <span>${escapeHtml(item.label)}</span>
                <span aria-hidden="true">&rsaquo;</span>
              </a>
            `
          ).join('')}
        </nav>

        <div class="student-sidebar__footer">
          <button type="button" class="button-ghost button-block" data-student-logout>
            Logout
          </button>
          <p>Stay connected to clubs, events, and opportunities across campus.</p>
        </div>
      </div>
    `;

    sidebarRoot.querySelector('[data-student-logout]')?.addEventListener('click', logoutStudent);
    sidebarRoot.querySelectorAll('.student-nav a').forEach((link) => {
      link.addEventListener('click', () => closeSidebar());
    });
  }

  if (topbarRoot) {
    topbarRoot.innerHTML = `
      <div class="student-topbar__main">
        <button type="button" class="student-menu-toggle" data-student-menu-toggle aria-label="Open menu">
          <span></span>
        </button>
        <div class="student-topbar__copy">
          <p class="eyebrow">IBU Connect Student Side</p>
          <h2>${escapeHtml(title)}</h2>
          <p>${escapeHtml(subtitle)}</p>
        </div>
      </div>
      <div class="student-user-chip">
        <div class="student-user-chip__avatar">${escapeHtml(initials)}</div>
        <strong>${escapeHtml(profile.full_name || 'Student')}</strong>
      </div>
    `;

    topbarRoot
      .querySelector('[data-student-menu-toggle]')
      ?.addEventListener('click', () => {
        if (document.body.classList.contains('student-sidebar-open')) {
          closeSidebar();
          return;
        }

        openSidebar();
      });
  }

  ensureSidebarOverlay();
  if (!document.body.dataset.studentEscBound) {
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeSidebar();
    });
    document.body.dataset.studentEscBound = 'true';
  }
};

export const createMediaMarkup = (label, imageUrl, modifier = 'event-card__media') => {
  if (imageUrl) {
    return `
      <div class="${modifier}">
        <img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(label)}" loading="lazy" />
      </div>
    `;
  }

  return `<div class="${modifier}">${escapeHtml(label)}</div>`;
};

export const createEventCardMarkup = (event, options = {}) => {
  const {
    primaryLabel = event.is_joined ? 'Open joined event' : 'View details',
    primaryHref = `event-detail.html?id=${event.id}`,
    secondaryAction = '',
  } = options;
  const timelineStatus = getTimelineStatus(event);
  const cardClasses = ['event-card'];
  const description = truncateText(event.description || 'No event description available yet.', 128);
  const hostLabel = event.club?.name || event.organizer?.full_name || 'IBU Connect';
  const quotaLabel =
    Number(event.quota) > 0
      ? `${Number(event.joined_count || 0)} / ${Number(event.quota)} seats`
      : `${Number(event.joined_count || 0)} joined`;
  const stateNotice = event.is_joined
    ? isHistoricalEvent(event)
      ? '<div class="event-card__notice event-card__notice--history">This event is in your event history.</div>'
      : '<div class="event-card__notice event-card__notice--joined">You already joined this event.</div>'
    : isHistoricalEvent(event)
      ? '<div class="event-card__notice event-card__notice--history">This event has already passed.</div>'
      : '';

  if (event.is_joined) {
    cardClasses.push('event-card--joined');
  }

  if (isHistoricalEvent(event)) {
    cardClasses.push('event-card--history');
  }

  return `
    <article class="${cardClasses.join(' ')}">
      ${createMediaMarkup(event.title || event.category || 'Event', event.image_url, 'event-card__media')}
      <div class="event-card__body">
        <div class="event-card__header">
          <div class="event-card__badges">
            <span class="badge">${escapeHtml(event.category || 'General')}</span>
            <span class="badge">${escapeHtml(getTimelineLabel(timelineStatus))}</span>
            ${event.is_joined ? '<span class="badge">Joined</span>' : ''}
            ${event.is_favorite ? '<span class="badge">Favorite</span>' : ''}
          </div>
          <div>
            <h3>${escapeHtml(event.title || 'Untitled event')}</h3>
            <p class="event-card__copy">${escapeHtml(description)}</p>
          </div>
          ${stateNotice}
        </div>

        <div class="event-card__meta">
          <div class="event-card__meta-row">
            <span>Date</span>
            <strong>${escapeHtml(formatDateTime(event.event_date))}</strong>
          </div>
          <div class="event-card__meta-row">
            <span>Location</span>
            <strong>${escapeHtml(event.location || 'Campus venue')}</strong>
          </div>
          <div class="event-card__meta-row">
            <span>Hosted by</span>
            <strong>${escapeHtml(hostLabel)}</strong>
          </div>
          <div class="event-card__meta-row">
            <span>Attendance</span>
            <strong>${escapeHtml(quotaLabel)}</strong>
          </div>
        </div>

        <div class="event-card__actions">
          <a class="button" href="${escapeHtml(primaryHref)}">${escapeHtml(primaryLabel)}</a>
          ${secondaryAction}
        </div>
      </div>
    </article>
  `;
};

export const createClubCardMarkup = (club) => `
  <article class="club-card">
    ${createMediaMarkup(club.name || 'Club', club.logo_url, 'club-card__media')}
    <div class="club-card__body">
      <div class="club-card__header">
        <div class="club-card__badges">
          <span class="badge">${Number(club.member_count || 0)} members</span>
          <span class="badge">${Number(club.event_count || 0)} events</span>
        </div>
        <div>
          <h3>${escapeHtml(club.name || 'Club')}</h3>
          <p class="club-card__copy">${escapeHtml(truncateText(club.description || 'No description available yet.', 140))}</p>
        </div>
      </div>

      <div class="club-card__actions">
        <a class="button" href="club-detail.html?id=${escapeHtml(club.id)}">View club</a>
      </div>
    </div>
  </article>
`;

export const createMiniListMarkup = (items, itemRenderer, emptyMessage) => {
  if (!Array.isArray(items) || items.length === 0) {
    return `<div class="empty-state">${escapeHtml(emptyMessage)}</div>`;
  }

  return `<div class="student-list">${items.map(itemRenderer).join('')}</div>`;
};

export const createMiniEventItemMarkup = (event) => `
  <article class="student-list__item">
    <strong>${escapeHtml(event.title || 'Untitled event')}</strong>
    <div class="student-list__meta">
      <span>${escapeHtml(formatDateTime(event.event_date))}</span>
      <span>${escapeHtml(event.location || 'Campus venue')}</span>
      <span>${escapeHtml(event.category || 'General')}</span>
      <span>${escapeHtml(getTimelineLabel(getTimelineStatus(event)))}</span>
    </div>
    <div class="student-list__actions">
      <a class="button-secondary" href="event-detail.html?id=${escapeHtml(event.id)}">Open event</a>
    </div>
  </article>
`;

export const renderPagination = (container, meta, onPageChange) => {
  if (!container) {
    return;
  }

  const totalPages = Number(meta?.total_pages || 0);
  const currentPage = Number(meta?.page || 1);

  if (totalPages <= 1) {
    container.innerHTML = '';
    return;
  }

  const pageNumbers = [];

  for (let page = Math.max(1, currentPage - 1); page <= Math.min(totalPages, currentPage + 1); page += 1) {
    pageNumbers.push(page);
  }

  if (!pageNumbers.includes(1)) {
    pageNumbers.unshift(1);
  }

  if (!pageNumbers.includes(totalPages)) {
    pageNumbers.push(totalPages);
  }

  const uniquePages = [...new Set(pageNumbers)];

  container.innerHTML = `
    <div class="pagination">
      <button type="button" data-page="${currentPage - 1}" ${currentPage <= 1 ? 'disabled' : ''}>
        Prev
      </button>
      ${uniquePages
        .map(
          (page) => `
            <button type="button" data-page="${page}" class="${page === currentPage ? 'is-active' : ''}">
              ${page}
            </button>
          `
        )
        .join('')}
      <button type="button" data-page="${currentPage + 1}" ${currentPage >= totalPages ? 'disabled' : ''}>
        Next
      </button>
    </div>
  `;

  container.querySelectorAll('button[data-page]').forEach((button) => {
    button.addEventListener('click', () => {
      const page = Number(button.getAttribute('data-page'));

      if (Number.isNaN(page) || page < 1 || page > totalPages || page === currentPage) {
        return;
      }

      onPageChange(page);
    });
  });
};

// helpers scripti: bu dosya sayfanin davranislarini ve is kurallarini yonetir.
export const escapeHtml = (value = '') =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

export const formatDateTime = (value) => {
  if (!value) {
    return '-';
  }

  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
};

export const formatDateOnly = (value) => {
  if (!value) {
    return '-';
  }

  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
  }).format(new Date(value));
};

export const getQueryId = (paramName = 'id') => {
  const value = new URLSearchParams(window.location.search).get(paramName);
  const parsedValue = Number.parseInt(value, 10);

  if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
    return null;
  }

  return parsedValue;
};

export const getRoleBadgeClass = (role) => {
  const map = {
    admin: 'badge-admin',
    organizer: 'badge-organizer',
    student: 'badge-student',
  };

  return map[role] || 'badge-neutral';
};

export const getActiveBadgeClass = (isActive) => (isActive ? 'badge-success' : 'badge-muted');

export const getEventStatusBadgeClass = (status) => {
  const map = {
    active: 'badge-success',
    cancelled: 'badge-danger',
    completed: 'badge-warning',
  };

  return map[status] || 'badge-neutral';
};

export const renderPagination = (container, meta, onPageChange) => {
  if (!container) {
    return;
  }

  if (!meta || meta.total_pages <= 1) {
    container.innerHTML = '';
    return;
  }

  const previousDisabled = meta.page <= 1 ? 'disabled' : '';
  const nextDisabled = meta.page >= meta.total_pages ? 'disabled' : '';

  container.innerHTML = `
    <button type="button" class="button button-ghost button-small" data-page="${meta.page - 1}" ${previousDisabled}>
      Previous
    </button>
    <span class="pagination-info">Page ${meta.page} of ${meta.total_pages}</span>
    <button type="button" class="button button-ghost button-small" data-page="${meta.page + 1}" ${nextDisabled}>
      Next
    </button>
  `;

  container.querySelectorAll('button[data-page]').forEach((button) => {
    button.addEventListener('click', () => {
      const nextPage = Number.parseInt(button.dataset.page, 10);

      if (!Number.isNaN(nextPage)) {
        onPageChange(nextPage);
      }
    });
  });
};

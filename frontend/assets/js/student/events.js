// events scripti: bu dosya sayfanin davranislarini ve is kurallarini yonetir.
import { apiRequest } from '../common/api.js';
import { requireStudentAuth } from '../common/guards.js';
import {
  createEventCardMarkup,
  escapeHtml,
  mountStudentShell,
  renderPagination,
  showToast,
} from '../common/utils.js';

const state = {
  search: '',
  category: '',
  date: '',
  sort: 'upcoming',
  limit: 9,
  page: 1,
};

const syncStateFromUrl = () => {
  const searchParams = new URLSearchParams(window.location.search);
  const parsedLimit = Number(searchParams.get('limit') || 9);
  const parsedPage = Number(searchParams.get('page') || 1);

  state.search = searchParams.get('search') || '';
  state.category = searchParams.get('category') || '';
  state.date = searchParams.get('date') || '';
  state.sort = searchParams.get('sort') || 'upcoming';
  state.limit = Number.isFinite(parsedLimit) && parsedLimit > 0 ? parsedLimit : 9;
  state.page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
};

const syncUrlFromState = () => {
  const searchParams = new URLSearchParams();

  if (state.search) searchParams.set('search', state.search);
  if (state.category) searchParams.set('category', state.category);
  if (state.date) searchParams.set('date', state.date);
  if (state.sort && state.sort !== 'upcoming') searchParams.set('sort', state.sort);
  if (state.limit !== 9) searchParams.set('limit', String(state.limit));
  if (state.page > 1) searchParams.set('page', String(state.page));

  const query = searchParams.toString();
  const nextUrl = `${window.location.pathname}${query ? `?${query}` : ''}`;
  window.history.replaceState({}, '', nextUrl);
};

const renderSummary = (meta) => {
  const summary = document.querySelector('[data-events-summary]');

  if (!summary) {
    return;
  }

  const total = Number(meta?.total || 0);
  summary.textContent = total === 0 ? 'No events found.' : `${total} events found`;
};

const renderEvents = (events = []) => {
  const root = document.querySelector('[data-events-grid]');

  if (!root) {
    return;
  }

  if (!events.length) {
    root.innerHTML = '<div class="empty-state">No active upcoming events match your filters.</div>';
    return;
  }

  root.innerHTML = events
    .map((event) => createEventCardMarkup(event))
    .join('');
};

const loadEvents = async () => {
  const grid = document.querySelector('[data-events-grid]');
  const paginationRoot = document.querySelector('[data-events-pagination]');
  const endpoint = state.search ? '/student/events/search' : '/student/events';

  if (grid) {
    grid.innerHTML = '<div class="loading-state">Loading events...</div>';
  }

  try {
    const response = await apiRequest(endpoint, {
      query: {
        keyword: state.search,
        category: state.category,
        date: state.date,
        sort: state.sort,
        page: state.page,
        limit: state.limit,
      },
    });

    renderSummary(response.meta);
    renderEvents(response.data || []);
    renderPagination(paginationRoot, response.meta, (page) => {
      state.page = page;
      syncUrlFromState();
      loadEvents();
    });
  } catch (error) {
    showToast(error.message || 'Unable to load events.', 'error');

    if (grid) {
      grid.innerHTML = `<div class="error-state">${escapeHtml(error.message || 'Unable to load events.')}</div>`;
    }
  }
};

const init = () => {
  const student = requireStudentAuth();

  if (!student) {
    return;
  }

  mountStudentShell({
    activePage: 'events',
    title: 'Browse Events',
    subtitle: 'Filter upcoming opportunities, workshops, and club activities happening across campus.',
  });

  syncStateFromUrl();

  const form = document.querySelector('[data-events-form]');

  if (form) {
    form.search.value = state.search;
    form.category.value = state.category;
    form.date.value = state.date;
    form.sort.value = state.sort;
    form.limit.value = String(state.limit);

    form.addEventListener('submit', (event) => {
      event.preventDefault();

      state.search = form.search.value.trim();
      state.category = form.category.value.trim();
      state.date = form.date.value;
      state.sort = form.sort.value;
      state.limit = Number(form.limit.value || 9);
      state.page = 1;

      syncUrlFromState();
      loadEvents();
    });

    form.addEventListener('reset', () => {
      window.setTimeout(() => {
        state.search = '';
        state.category = '';
        state.date = '';
        state.sort = 'upcoming';
        state.limit = 9;
        state.page = 1;
        syncUrlFromState();
        loadEvents();
      }, 0);
    });
  }

  document.querySelector('[data-greeting-name]')?.replaceChildren(document.createTextNode(student.full_name || 'Student'));
  loadEvents();
};

document.addEventListener('DOMContentLoaded', init);

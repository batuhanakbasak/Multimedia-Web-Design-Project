import { apiRequest } from './api.js';
import {
  clearAdminSession,
  getAdminToken,
  logoutAdmin,
  saveAdminSession,
  redirectToLogin,
} from './auth.js';
import { renderSidebar } from '../components/sidebar.js';
import { renderNavbar } from '../components/navbar.js';

const resolveLoginRedirect = () => {
  clearAdminSession();
  redirectToLogin('expired');
};

const bindShellEvents = () => {
  document.querySelectorAll('[data-logout-trigger]').forEach((button) => {
    button.addEventListener('click', () => {
      logoutAdmin();
    });
  });

  const sidebarToggle = document.querySelector('[data-sidebar-toggle]');
  const sidebarClose = document.querySelector('[data-sidebar-close]');
  const overlay = document.querySelector('[data-sidebar-overlay]');

  if (sidebarToggle) {
    sidebarToggle.addEventListener('click', () => {
      document.body.classList.toggle('sidebar-open');
    });
  }

  if (sidebarClose) {
    sidebarClose.addEventListener('click', () => {
      document.body.classList.remove('sidebar-open');
    });
  }

  if (overlay) {
    overlay.addEventListener('click', () => {
      document.body.classList.remove('sidebar-open');
    });
  }
};

const ensureToastRoot = () => {
  let toastRoot = document.querySelector('#toast-root');

  if (!toastRoot) {
    toastRoot = document.createElement('div');
    toastRoot.id = 'toast-root';
    toastRoot.className = 'toast-root';
    document.body.appendChild(toastRoot);
  }

  return toastRoot;
};

export const showToast = (message, type = 'success') => {
  const toastRoot = ensureToastRoot();
  const toast = document.createElement('div');

  toast.className = `toast ${type}`;
  toast.textContent = message;
  toastRoot.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.add('visible');
  });

  setTimeout(() => {
    toast.classList.remove('visible');
    setTimeout(() => toast.remove(), 180);
  }, 2800);
};

export const initializeAdminPage = async ({ title, activeNav }) => {
  const token = getAdminToken();

  if (!token) {
    redirectToLogin('session');
    throw new Error('Admin token is missing');
  }

  try {
    const response = await apiRequest('/admin/auth/me');
    const admin = response.data;

    saveAdminSession({ token, admin });

    const sidebarRoot = document.querySelector('#sidebar-root');
    const navbarRoot = document.querySelector('#navbar-root');

    if (sidebarRoot) {
      sidebarRoot.innerHTML = renderSidebar(activeNav, admin);
    }

    if (navbarRoot) {
      navbarRoot.innerHTML = renderNavbar({ title, admin });
    }

    bindShellEvents();
    return admin;
  } catch (error) {
    resolveLoginRedirect();
    throw error;
  }
};

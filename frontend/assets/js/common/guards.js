import {
  clearStudentSession,
  getStudentProfile,
  getStudentToken,
  isStudentProfile,
  redirectToStudentDashboard,
  redirectToStudentLogin,
} from './auth.js';

export const requireStudentAuth = () => {
  const token = getStudentToken();
  const profile = getStudentProfile();

  if (!token || !isStudentProfile(profile)) {
    clearStudentSession();
    redirectToStudentLogin('session');
    return null;
  }

  return profile;
};

export const redirectIfStudentAlreadyLoggedIn = () => {
  const token = getStudentToken();
  const profile = getStudentProfile();

  if (token && isStudentProfile(profile)) {
    redirectToStudentDashboard();
    return true;
  }

  if (token || profile) {
    clearStudentSession();
  }

  return false;
};

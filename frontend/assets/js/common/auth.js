// auth scripti: bu dosya sayfanin davranislarini ve is kurallarini yonetir.
export const STUDENT_TOKEN_KEY = 'student_token';
export const STUDENT_PROFILE_KEY = 'student_profile';

export const getStudentToken = () => localStorage.getItem(STUDENT_TOKEN_KEY);

export const getStudentProfile = () => {
  try {
    const value = localStorage.getItem(STUDENT_PROFILE_KEY);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    return null;
  }
};

export const saveStudentSession = ({ accessToken, user }) => {
  if (accessToken) {
    localStorage.setItem(STUDENT_TOKEN_KEY, accessToken);
  }

  if (user) {
    localStorage.setItem(STUDENT_PROFILE_KEY, JSON.stringify(user));
  }
};

export const saveStudentSessionFromPayload = (payload) => {
  saveStudentSession({
    accessToken: payload?.access_token,
    user: payload?.user,
  });
};

export const updateStoredStudentProfile = (profile) => {
  if (!profile) {
    return;
  }

  localStorage.setItem(STUDENT_PROFILE_KEY, JSON.stringify(profile));
};

export const clearStudentSession = () => {
  localStorage.removeItem(STUDENT_TOKEN_KEY);
  localStorage.removeItem(STUDENT_PROFILE_KEY);
};

export const isStudentProfile = (profile) => Boolean(profile && profile.role === 'student');

export const hasStudentSession = () => Boolean(getStudentToken() && isStudentProfile(getStudentProfile()));

export const redirectToStudentLogin = (reason = '') => {
  const url = new URL('./login.html', window.location.href);

  if (reason) {
    url.searchParams.set('reason', reason);
  }

  window.location.href = url.toString();
};

export const redirectToStudentDashboard = () => {
  const url = new URL('./dashboard.html', window.location.href);
  window.location.href = url.toString();
};

export const logoutStudent = () => {
  clearStudentSession();
  redirectToStudentLogin('logout');
};

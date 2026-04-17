// runtime-config scripti: bu dosya sayfanin davranislarini ve is kurallarini yonetir.
(function () {
  const LOCAL_API_BASE_URL = 'http://localhost:3000/api';
  const { protocol, hostname, origin } = window.location;
  const isHttpPage = protocol === 'http:' || protocol === 'https:';
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
  const publicApiBaseUrl =
    !isHttpPage || isLocalhost || !hostname || hostname === 'null'
      ? ''
      : hostname.startsWith('api.')
        ? `https://${hostname}/api`
        : hostname.startsWith('www.')
          ? `https://api.${hostname.slice(4)}/api`
          : `https://api.${hostname}/api`;

  window.STUDENT_APP_CONFIG = {
    apiBaseUrl:
      isHttpPage && isLocalhost && origin && origin !== 'null'
        ? `${origin}/api`
        : publicApiBaseUrl || LOCAL_API_BASE_URL,
  };
})();

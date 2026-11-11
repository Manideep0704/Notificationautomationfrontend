(() => {
  const DEPLOYED_BACKEND_URL = 'https://apiautomation.iryax.com';
  const sameOriginBackend =
    window.location.origin === DEPLOYED_BACKEND_URL ||
    window.location.port === '8050';
  const hasPlatformProxy = /\.(vercel\.app|netlify\.app)$/i.test(window.location.hostname);

  // Use same-origin relative URLs when served directly from backend or via Vercel/Netlify proxy rewrites;
  // otherwise call the deployed HTTPS backend URL directly (using Bearer + CSRF auth headers).
  const API_BASE_URL = sameOriginBackend || hasPlatformProxy ? '' : DEPLOYED_BACKEND_URL;

  window.DEPLOYED_BACKEND_URL = DEPLOYED_BACKEND_URL;
  window.API_BASE_URL = API_BASE_URL;

  window.apiUrl = (path) => {
    if (typeof path === 'string' && /^\/(api|auth|health|webhook)(\/|$)/.test(path)) {
      return `${API_BASE_URL}${path}`;
    }
    return path;
  };

  window.navigateToLogin = () => {
    location.assign(window.location.port === '8050' ? '/login' : '/login.html');
  };

  window.navigateToDashboard = () => {
    location.assign(window.location.port === '8050' ? '/' : '/index.html');
  };

  if (!window.__apiFetchInstalled) {
    window.__apiFetchInstalled = true;
    const rawFetch = window.fetch.bind(window);

    window.fetch = async (input, options = {}) => {
      const target = typeof input === 'string' ? window.apiUrl(input) : input;
      const method = (options.method || 'GET').toUpperCase();
      const headers = new Headers(options.headers || {});
      const token = sessionStorage.getItem('auth_token') || '';
      const csrf = window.__csrfToken || sessionStorage.getItem('csrf_token') || '';

      if (token && !headers.has('Authorization')) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      if (!['GET', 'HEAD', 'OPTIONS'].includes(method) && csrf && !headers.has('X-CSRF-Token')) {
        headers.set('X-CSRF-Token', csrf);
      }

      const response = await rawFetch(target, {
        credentials: 'include',
        ...options,
        headers,
      });

      const isLoginPage = location.pathname === '/login' || location.pathname.endsWith('/login.html');
      const isAuthCheck = typeof input === 'string' && input.startsWith('/auth/');
      if (response.status === 401 && !isLoginPage && !isAuthCheck) {
        sessionStorage.removeItem('auth_token');
        sessionStorage.removeItem('csrf_token');
        window.navigateToLogin();
      }
      return response;
    };
  }
})();


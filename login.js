document.getElementById('login-form').addEventListener('submit', async event => {
  event.preventDefault();
  const button = event.target.querySelector('button');
  const error = document.getElementById('error');
  error.textContent = ''; button.disabled = true;
  try {
    const response = await fetch('/auth/login', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({username:document.getElementById('username').value,password:document.getElementById('password').value})});
    const raw = await response.text();
    let data = {};
    try { data = raw ? JSON.parse(raw) : {}; } catch (_) { throw new Error(raw || `Sign-in failed (${response.status})`); }
    if (!response.ok) throw new Error(data.detail || `Sign-in failed (${response.status})`);
    if (data.token) sessionStorage.setItem('auth_token', data.token);
    if (data.csrf_token) {
      sessionStorage.setItem('csrf_token', data.csrf_token);
      window.__csrfToken = data.csrf_token;
    }
    if (typeof window.navigateToDashboard === 'function') {
      window.navigateToDashboard();
    } else {
      location.assign('/');
    }
  } catch (problem) { error.textContent = problem.message; }
  finally { button.disabled = false; }
});

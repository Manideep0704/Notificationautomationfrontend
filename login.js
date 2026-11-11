document.getElementById('login-form').addEventListener('submit', async event => {
  event.preventDefault();
  const button = event.target.querySelector('button');
  const error = document.getElementById('error');
  error.textContent = ''; button.disabled = true;
  try {
    const response = await fetch('/auth/login', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({username:document.getElementById('username').value,password:document.getElementById('password').value})});
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || 'Sign-in failed');
    location.assign('/');
  } catch (problem) { error.textContent = problem.message; }
  finally { button.disabled = false; }
});

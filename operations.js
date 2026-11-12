// Safe UUID generator (HTTP aur HTTPS dono par chalega)
function generateSafeUUID() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function initOperations() {
  const nav = document.querySelector('.nav-menu');
  const button = document.createElement('button');
  button.className = 'nav-btn'; button.dataset.tab = 'tab-operations';
  button.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 2L11 13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg><span>Publishing &amp; Delivery</span>';
  nav.appendChild(button);
  const pane = document.createElement('section'); pane.id = 'tab-operations'; pane.className = 'tab-content';
  pane.innerHTML = `
  <div class="card" style="padding:24px;margin-bottom:20px"><h2>Publish a social post</h2><p class="form-hint">Publishes real content to the selected account, then sends a client notification. Use a unique request ID per intended post.</p>
  <form id="publish-form" class="operations-form">
    <label>Client<select name="client_id" class="form-control operations-clients" required></select></label>
    <label>Platform<select name="platform" class="form-control"><option value="facebook">Facebook</option><option value="instagram">Instagram</option></select></label>
    <label>Request ID<input name="post_id" class="form-control" required maxlength="50" pattern="[A-Za-z0-9_-]+"></label>
    <label>Public image URL<input name="media_url" type="url" class="form-control" required placeholder="https://..."></label>
    <label style="grid-column:1/-1">Caption<textarea name="caption" class="form-control" maxlength="2200" required></textarea></label>
    <label style="grid-column:1/-1"><input name="approved" type="checkbox" required> I approve this content for publication.</label>
    <button class="btn btn-primary" type="submit">Publish & Notify Client</button>
  </form><p id="publish-feedback" role="status" class="operation-feedback"></p></div>
  <div class="card" style="padding:24px;margin-bottom:20px"><h2>Connect a social account</h2><p class="form-hint">Tokens are encrypted in the database. Facebook Page IDs and Instagram professional account IDs must be numeric.</p>
  <form id="account-form" class="operations-form">
    <label>Client<select name="client_id" class="form-control operations-clients" required></select></label>
    <label>Platform<select name="platform" class="form-control"><option value="facebook">Facebook</option><option value="instagram">Instagram</option></select></label>
    <label>Account ID<input name="account_id" class="form-control" pattern="[0-9]+" required></label>
    <label>Account name<input name="account_name" class="form-control" required></label>
    <label style="grid-column:1/-1">Access token<input name="access_token" type="password" autocomplete="new-password" class="form-control" required></label>
    <button class="btn btn-primary" type="submit">Save Account</button>
  </form><p id="account-feedback" role="status" class="operation-feedback"></p></div>
  <div class="card" style="padding:24px;margin-bottom:20px"><h2>Integration readiness</h2><p id="integration-summary" class="operation-feedback"></p><button class="btn btn-secondary" id="validate-provider">Verify Sender & Template</button><p id="provider-feedback" role="status" class="operation-feedback"></p></div>
  <div class="card" style="padding:24px"><div style="display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:8px"><h2 style="margin:0">Delivery queue</h2><button class="btn btn-secondary" id="refresh-queue">Refresh</button></div><p class="form-hint" style="margin-bottom:16px">Rate-limit rejections retry automatically. Uncertain sends need provider reconciliation.</p><div class="table-responsive"><table class="data-table"><thead><tr><th>Post</th><th>Client</th><th>State</th><th>Attempts</th><th>Details</th><th style="text-align:right">Action</th></tr></thead><tbody id="queue-body"></tbody></table></div></div>`;
  document.querySelector('.main-content').appendChild(pane);
  button.addEventListener('click', () => {
    loadOperationClients(); loadQueue(); loadIntegrationStatus();
    document.getElementById('view-title').textContent = 'Publishing & Delivery';
    document.getElementById('view-subtitle').textContent = 'Connect accounts, publish approved content, and manage notification recovery.';
  });
  document.getElementById('btn-logout').addEventListener('click', async () => {
    await fetch('/auth/logout', { method: 'POST' });
    sessionStorage.removeItem('auth_token');
    sessionStorage.removeItem('csrf_token');
    window.__csrfToken = '';
    if (typeof window.navigateToLogin === 'function') window.navigateToLogin();
    else location.assign('/login');
  });
  bindOperationForm('account-form', '/api/social-accounts', 'PUT', 'account-feedback', values => values);
  bindOperationForm('publish-form', '/api/publish', 'POST', 'publish-feedback', values => {
    delete values.approved; values.approval_status = 'approved'; return values;
  });

  // YAHAN CHANGE HUA HAI: crypto.randomUUID() ki jagah generateSafeUUID() use kiya hai
  document.querySelector('#publish-form [name=post_id]').value = 'POST_' + generateSafeUUID().replaceAll('-', '').slice(0, 24);

  document.getElementById('refresh-queue').addEventListener('click', loadQueue);
  document.getElementById('validate-provider').addEventListener('click', async event => {
    event.target.disabled = true;
    try { const result = await operationRequest('/api/integrations/validate', { method: 'POST' }); document.getElementById('provider-feedback').textContent = result.message; }
    catch (error) { document.getElementById('provider-feedback').textContent = error.message; }
    finally { event.target.disabled = false; }
  });
}

async function operationRequest(url, options = {}) {
  const response = await fetch(url, options); const result = await response.json();
  if (!response.ok) throw new Error(typeof result.detail === 'string' ? result.detail : 'Invalid input. Check the form fields.');
  return result;
}

function bindOperationForm(id, url, method, feedback, transform) {
  const form = document.getElementById(id);
  form.addEventListener('submit', async event => {
    event.preventDefault(); const button = form.querySelector('button'); button.disabled = true;
    const label = document.getElementById(feedback); label.textContent = 'Processing…';
    try {
      const data = await operationRequest(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(transform(Object.fromEntries(new FormData(form)))) });
      label.textContent = data.message + (data.notification_status ? ' · Notification: ' + data.notification_status : '');
      if (id === 'account-form') form.elements.access_token.value = '';
      await loadQueue();
    } catch (error) { label.textContent = error.message; }
    finally { button.disabled = false; }
  });
}

async function loadOperationClients() {
  try {
    const clients = await operationRequest('/api/clients');
    document.querySelectorAll('.operations-clients').forEach(select => {
      const current = select.value; select.replaceChildren();
      for (const client of clients) { const option = document.createElement('option'); option.value = client.id; option.textContent = client.name; select.appendChild(option); }
      if ([...select.options].some(option => option.value === current)) select.value = current;
    });
  } catch (error) { showToast(error.message, 'danger'); }
}

async function loadIntegrationStatus() {
  const label = document.getElementById('integration-summary');
  try {
    const data = await operationRequest('/api/integration-status');
    label.textContent = `WhatsApp: ${data.whatsapp_configured ? 'configured' : 'missing credentials'} · Signed webhooks: ${data.webhook_signatures_configured ? 'configured' : 'missing app secret'} · Account encryption: ${data.account_encryption_configured ? 'ready' : 'run administrator setup'} · Template: ${data.template_name} (${data.template_language})`;
  } catch (error) { label.textContent = error.message; }
}

async function loadQueue() {
  const body = document.getElementById('queue-body');
  try {
    const rows = await operationRequest('/api/delivery-queue'); body.replaceChildren();
    if (!rows.length) { const row = body.insertRow(); row.insertCell().textContent = 'No notification attempts yet.'; return; }
    for (const item of rows) {
      const row = body.insertRow();
      for (const value of [item.post_id, item.client_id, item.state, item.attempts, item.error || '—']) row.insertCell().textContent = value;
      const cell = row.insertCell();
      if (['failed', 'uncertain'].includes(item.state)) {
        const retry = document.createElement('button'); retry.className = 'btn btn-sm btn-secondary'; retry.textContent = item.state === 'uncertain' ? 'Reconcile & Retry' : 'Retry'; cell.appendChild(retry);
        retry.addEventListener('click', async () => {
          const uncertain = item.state === 'uncertain';
          if (uncertain && !confirm('Have you checked provider records and confirmed this message was NOT accepted? Retrying an accepted message creates a duplicate.')) return;
          retry.disabled = true;
          try { await operationRequest('/api/notifications/' + encodeURIComponent(item.id) + '/retry', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ confirmed_not_sent: uncertain }) }); await loadQueue(); }
          catch (error) { showToast(error.message, 'danger'); retry.disabled = false; }
        });
      }
    }
  } catch (error) { body.replaceChildren(); body.insertRow().insertCell().textContent = error.message; }
}
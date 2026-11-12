let csrfToken = sessionStorage.getItem('csrf_token') || '';
window.__csrfToken = csrfToken;
const originalFetch = window.fetch.bind(window);
// ==============================================================================
// IRYAX GLOBAL - AGENCY SOCIAL HUB DASHBOARD ENGINE
// Ultra-modern, resilient B2B Client & Publishing Controller
// ==============================================================================

const APP_STATE = {
  activeTab: 'tab-activity',
  excelClients: [],
  searchFilter: '',
  posts: [],
  activityFilter: {
    search: '',
    platform: 'all',
    alertStatus: 'all',
    page: 1,
    pageSize: 12
  },
  clientFilter: {
    status: 'all',
    page: 1,
    pageSize: 12
  },
  metrics: {
    total_posts: 0,
    delivered_notifications: 0,
    read_notifications: 0,
    active_clients: 0
  },
  settings: {}
};

// ==============================================================================
// Toast Notification Component
// ==============================================================================
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  let iconSvg = '';
  if (type === 'success') {
    iconSvg = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#10b981" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>';
  } else if (type === 'danger') {
    iconSvg = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#ef4444" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>';
  } else {
    iconSvg = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#4f46e5" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>';
  }
  
  toast.innerHTML = `${iconSvg}<span>${escapeHtml(message)}</span>`;
  container.appendChild(toast);
  
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(12px) scale(0.95)';
    toast.style.transition = 'all 0.25s ease';
    setTimeout(() => toast.remove(), 250);
  }, 4500);
}


function formatApiError(errData, status) {
  if (!errData) return 'HTTP ' + status;
  if (typeof errData.detail === 'string') return errData.detail;
  if (Array.isArray(errData.detail)) {
    return errData.detail.map(d => {
      const field = d.loc ? d.loc.filter(x => x !== 'body').join('.') : '';
      return field ? (field + ': ' + d.msg) : d.msg;
    }).join('; ');
  }
  if (errData.message) return errData.message;
  return 'HTTP ' + status;
}

function cleanPhoneInput(raw) {
  let clean = (raw || '').trim().replace(/\s+/g, '').replace(/[-().]/g, '');
  if (!clean) return '';
  if (clean.length === 10 && !clean.startsWith('+') && /^\d+$/.test(clean)) {
    return '+91' + clean;
  }
  if (!clean.startsWith('+') && /^\d+$/.test(clean)) {
    return '+' + clean;
  }
  return clean;
}

function getInitials(name) {
  if (!name || name === '-') return 'CL';
  const clean = name.trim().replace(/[^a-zA-Z0-9\s]/g, '');
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'CL';
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// ==============================================================================
// Contact Cards Component Helpers
// ==============================================================================
function createContactRowHtml(contact = {}, index = 0, canRemove = false, prefix = 'new') {
  const title = contact.title || 'Mr.';
  const name = contact.name || '';
  const phone = contact.phone || '';
  const displayPhone = phone.startsWith('+') ? phone.slice(1) : phone;
  const idSuffix = index === 0 ? '' : ('-' + (index + 1));

  return `
    <div class="contact-card-item" data-contact-card style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; position: relative;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
        <span style="font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.5px;">
          ${index === 0 ? 'Recipient 1 (Primary)' : ('Recipient ' + (index + 1))}
        </span>
        ${canRemove ? `
          <button type="button" class="btn-remove-contact-card" title="Remove recipient" style="background: none; border: none; color: #ef4444; cursor: pointer; font-size: 13px; font-weight: 700; padding: 2px 6px; border-radius: 4px; display: inline-flex; align-items: center; gap: 3px;">
            <span>✕</span> <span style="font-size: 11px;">Remove</span>
          </button>
        ` : ''}
      </div>
      <div style="display: grid; grid-template-columns: 95px 1fr; gap: 8px; margin-bottom: 8px;">
        <div>
          <label style="font-size: 11px; font-weight: 600; color: #64748b; margin-bottom: 3px; display: block;">Title</label>
          <select id="${prefix}-contact-title${idSuffix}" class="form-control contact-card-title" style="padding: 6px 8px; font-size: 12px; height: 36px;">
            <option value="Mr." ${title === 'Mr.' ? 'selected' : ''}>Mr.</option>
            <option value="Ms." ${title === 'Ms.' ? 'selected' : ''}>Ms.</option>
            <option value="Mrs." ${title === 'Mrs.' ? 'selected' : ''}>Mrs.</option>
            <option value="Dr." ${title === 'Dr.' ? 'selected' : ''}>Dr.</option>
          </select>
        </div>
        <div>
          <label style="font-size: 11px; font-weight: 600; color: #64748b; margin-bottom: 3px; display: block;">Contact Person Name</label>
          <input type="text" id="${prefix}-contact-name${idSuffix}" class="form-control contact-card-name" placeholder="e.g. Saidulu Reddy" value="${escapeHtml(name)}" required style="padding: 6px 10px; font-size: 12px; height: 36px;">
        </div>
      </div>
      <div>
        <label style="font-size: 11px; font-weight: 600; color: #64748b; margin-bottom: 3px; display: block;">WhatsApp Number (with country code)</label>
        <div style="display: flex; align-items: center;">
          <span style="background: #e2e8f0; border: 1px solid #cbd5e1; border-right: none; border-radius: 6px 0 0 6px; padding: 0 10px; height: 36px; display: inline-flex; align-items: center; font-size: 14px; font-weight: 700; color: #475569;">+</span>
          <input type="tel" id="${prefix}-phone${idSuffix}" class="form-control contact-card-phone" placeholder="919014424455" value="${escapeHtml(displayPhone)}" required style="border-radius: 0 6px 6px 0; padding: 6px 10px; font-size: 12px; height: 36px;">
        </div>
      </div>
    </div>
  `;
}

function getContactsFromContainer(container) {
  if (!container) return [];
  const cards = container.querySelectorAll('[data-contact-card]');
  const contacts = [];
  cards.forEach(card => {
    const titleEl = card.querySelector('.contact-card-title');
    const nameEl = card.querySelector('.contact-card-name');
    const phoneEl = card.querySelector('.contact-card-phone');

    const title = titleEl ? titleEl.value : 'Mr.';
    const name = nameEl ? nameEl.value.trim() : '';
    let rawPhone = phoneEl ? phoneEl.value.trim() : '';
    if (rawPhone && !rawPhone.startsWith('+')) {
      rawPhone = '+' + rawPhone;
    }
    const phone = cleanPhoneInput(rawPhone);

    if (name || phone) {
      contacts.push({ title, name: name || 'Client Contact', phone });
    }
  });
  return contacts;
}

function renderContactsInContainer(container, contactsList, prefix = 'new') {
  if (!container) return;
  const list = Array.isArray(contactsList) && contactsList.length > 0 ? contactsList : [{}];
  container.innerHTML = list.map((c, i) => createContactRowHtml(c, i, i > 0, prefix)).join('');
}


// ==============================================================================
async function checkConnection() {
  const statusEl = document.getElementById('connection-status');
  const beaconEl = document.querySelector('.status-beacon');
  try {
    const res = await originalFetch('/health');
    if (res.ok) {
      if (statusEl) statusEl.textContent = 'Connected';
      if (beaconEl) beaconEl.style.background = '#10b981';
    } else {
      if (statusEl) statusEl.textContent = 'Degraded';
      if (beaconEl) beaconEl.style.background = '#f59e0b';
    }
  } catch (err) {
    if (statusEl) statusEl.textContent = 'Disconnected';
    if (beaconEl) beaconEl.style.background = '#ef4444';
  }
}

// ==============================================================================
// Initialization
// ==============================================================================
document.addEventListener('DOMContentLoaded', async () => {
  const session = await originalFetch('/auth/session');
  if (!session.ok) {
    sessionStorage.removeItem('auth_token');
    sessionStorage.removeItem('csrf_token');
    if (typeof window.navigateToLogin === 'function') window.navigateToLogin();
    else location.assign('/login');
    return;
  }
  csrfToken = (await session.json()).csrf_token;
  window.__csrfToken = csrfToken;
  sessionStorage.setItem('csrf_token', csrfToken);
  initOperations();
  checkConnection();
  setInterval(checkConnection, 15000);
  initTabs();
  initTopActions();
  initActivityFilters();
  initClientSearch();
  initAddClientModal();
  initEditClientModal();
  initViewClientModal();
  initSyncInstagramBtn();
  initSimulateForm();
  initSettingsForm();

  // Initial Data Load
  loadAllData();

  // Auto-refresh poll every 15 seconds
  setInterval(refreshActivityData, 15000);
});

// ==============================================================================
// Data Synchronization
// ==============================================================================
async function loadAllData() {
  await Promise.all([
    fetchExcelClients(),
    fetchPosts(),
    fetchMetrics(),
    fetchSettings()
  ]);
}

async function refreshActivityData() {
  await Promise.all([
    fetchPosts(),
    fetchMetrics()
  ]);
}

// ==============================================================================
// Tab Navigation
// ==============================================================================
function initTabs() {
  const navBtns = document.querySelectorAll('.nav-btn');
  const titleEl = document.getElementById('view-title');
  const subtitleEl = document.getElementById('view-subtitle');

  const tabMeta = {
    'tab-activity': {
      title: 'Live Activity & Notifications',
      subtitle: 'Real-time social media publishing events and automated client WhatsApp alerts.'
    },
    'tab-clients': {
      title: 'Client Directory & Channel Routing',
      subtitle: 'Database routing for Facebook Pages, Instagram accounts and client WhatsApp numbers.'
    },
    'tab-simulate': {
      title: 'Send a Post Notification',
      subtitle: 'Send a WhatsApp alert for an existing post. This action contacts the selected client.'
    },
    'tab-settings': {
      title: 'Meta API & Integrations',
      subtitle: 'Manage Meta WhatsApp Business Cloud API keys, sender credentials, and alert routing.'
    }
  };

  navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');
      if (!targetTab) return;

      navBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
      });

      const activePane = document.getElementById(targetTab);
      if (activePane) {
        activePane.classList.add('active');
        APP_STATE.activeTab = targetTab;
      }

      if (tabMeta[targetTab]) {
        titleEl.textContent = tabMeta[targetTab].title;
        subtitleEl.textContent = tabMeta[targetTab].subtitle;
      }

      if (targetTab === 'tab-activity') {
        refreshActivityData();
      } else if (targetTab === 'tab-clients') {
        fetchExcelClients();
      }
    });
  });
}

function initTopActions() {
  const refreshBtn = document.getElementById('btn-refresh-data');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', async () => {
      refreshBtn.disabled = true;
      const originalHtml = refreshBtn.innerHTML;
      refreshBtn.innerHTML = `
        <svg class="spinner" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" style="animation: rotate 1s linear infinite;"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
        <span>Syncing...</span>
      `;
      await loadAllData();
      refreshBtn.disabled = false;
      refreshBtn.innerHTML = originalHtml;
      showToast('All activity feeds & clients refreshed', 'success');
    });
  }

  const quickPostBtn = document.getElementById('btn-quick-post');
  if (quickPostBtn) {
    quickPostBtn.addEventListener('click', () => {
      const simNavBtn = document.querySelector('.nav-btn[data-tab="tab-simulate"]');
      if (simNavBtn) simNavBtn.click();
    });
  }
}

// ==============================================================================
// 1. Live Activity & Posts
// ==============================================================================
async function fetchPosts() {
  try {
    const res = await fetch('/api/posts');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    APP_STATE.posts = Array.isArray(data) ? data : [];
    renderPosts();
  } catch (err) {
    console.warn('Could not load posts:', err);
  }
}

function initActivityFilters() {
  const searchEl = document.getElementById('activity-search-input');
  const platformEl = document.getElementById('activity-platform-filter');
  const alertEl = document.getElementById('activity-alert-filter');
  const prevBtn = document.getElementById('activity-prev-page');
  const nextBtn = document.getElementById('activity-next-page');

  if (searchEl) {
    searchEl.addEventListener('input', (e) => {
      APP_STATE.activityFilter.search = e.target.value.trim().toLowerCase();
      APP_STATE.activityFilter.page = 1;
      renderPosts();
    });
  }
  if (platformEl) {
    platformEl.addEventListener('change', (e) => {
      APP_STATE.activityFilter.platform = e.target.value;
      APP_STATE.activityFilter.page = 1;
      renderPosts();
    });
  }
  if (alertEl) {
    alertEl.addEventListener('change', (e) => {
      APP_STATE.activityFilter.alertStatus = e.target.value;
      APP_STATE.activityFilter.page = 1;
      renderPosts();
    });
  }
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      if (APP_STATE.activityFilter.page > 1) {
        APP_STATE.activityFilter.page -= 1;
        renderPosts();
      }
    });
  }
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      APP_STATE.activityFilter.page += 1;
      renderPosts();
    });
  }
}

function clearActivityFilters() {
  APP_STATE.activityFilter.search = '';
  APP_STATE.activityFilter.platform = 'all';
  APP_STATE.activityFilter.alertStatus = 'all';
  APP_STATE.activityFilter.page = 1;
  const searchEl = document.getElementById('activity-search-input');
  const platformEl = document.getElementById('activity-platform-filter');
  const alertEl = document.getElementById('activity-alert-filter');
  if (searchEl) searchEl.value = '';
  if (platformEl) platformEl.value = 'all';
  if (alertEl) alertEl.value = 'all';
  renderPosts();
}

function formatPostIdDisplay(id) {
  const str = String(id || '');
  if (str.length <= 18) return str;
  return `${str.slice(0, 8)}…${str.slice(-6)}`;
}

async function copyPostId(postId) {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(postId);
    }
    showToast(`Copied Post ID: ${postId}`, 'success');
  } catch {
    showToast('Could not copy Post ID to clipboard.', 'danger');
  }
}

function renderPosts() {
  const tbody = document.getElementById('posts-table-body');
  const countChip = document.getElementById('activity-count-chip');
  const paginationEl = document.getElementById('activity-pagination');
  const paginationInfo = document.getElementById('activity-pagination-info');
  const pageLabel = document.getElementById('activity-page-label');
  const prevBtn = document.getElementById('activity-prev-page');
  const nextBtn = document.getElementById('activity-next-page');
  if (!tbody) return;

  const { search, platform, alertStatus, pageSize } = APP_STATE.activityFilter;
  const filteredPosts = APP_STATE.posts.filter((post) => {
    const postPlatform = (post.platform || 'facebook').toLowerCase();
    if (platform !== 'all' && postPlatform !== platform) return false;

    const notifStatus = (post.notification_status || 'pending').toLowerCase();
    if (alertStatus === 'sent_group' && !['sent', 'delivered', 'read'].includes(notifStatus)) return false;
    if (alertStatus === 'read' && notifStatus !== 'read') return false;
    if (alertStatus === 'failed' && notifStatus !== 'failed') return false;
    if (alertStatus === 'pending' && !['pending', 'retrying', 'in_flight'].includes(notifStatus)) return false;

    if (search) {
      const haystack = [
        post.id,
        post.client_name,
        post.client_id,
        post.caption,
        post.platform
      ].filter(Boolean).join(' ').toLowerCase();
      if (!haystack.includes(search)) return false;
    }
    return true;
  });

  if (countChip) {
    const total = APP_STATE.posts.length;
    countChip.textContent = filteredPosts.length === total
      ? `${total} ${total === 1 ? 'event' : 'events'}`
      : `${filteredPosts.length} of ${total} events`;
  }

  if (APP_STATE.posts.length === 0) {
    if (paginationEl) paginationEl.style.display = 'none';
    tbody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align: center; color: var(--text-muted); padding: 40px;">
          No publishing activity recorded yet. Publish an approved post or send an alert for an existing post.
        </td>
      </tr>
    `;
    return;
  }

  if (filteredPosts.length === 0) {
    if (paginationEl) paginationEl.style.display = 'none';
    tbody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align: center; color: var(--text-muted); padding: 40px;">
          <div style="margin-bottom: 10px;">No log entries match your current search or filters.</div>
          <button type="button" class="btn btn-sm btn-secondary" onclick="clearActivityFilters()">Clear Filters</button>
        </td>
      </tr>
    `;
    return;
  }

  const totalPages = Math.max(1, Math.ceil(filteredPosts.length / pageSize));
  const currentPage = Math.min(APP_STATE.activityFilter.page, totalPages);
  APP_STATE.activityFilter.page = currentPage;

  const startIdx = (currentPage - 1) * pageSize;
  const pagePosts = filteredPosts.slice(startIdx, startIdx + pageSize);

  if (paginationEl) {
    paginationEl.style.display = filteredPosts.length > pageSize ? 'flex' : 'none';
    if (paginationInfo) {
      paginationInfo.textContent = `Showing ${startIdx + 1}–${startIdx + pagePosts.length} of ${filteredPosts.length}`;
    }
    if (pageLabel) pageLabel.textContent = `Page ${currentPage} of ${totalPages}`;
    if (prevBtn) prevBtn.disabled = currentPage <= 1;
    if (nextBtn) nextBtn.disabled = currentPage >= totalPages;
  }

  const checkIcon = '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
  const doubleCheckIcon = '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 6 7 17 2 12"/><polyline points="22 10 13.5 18.5 11 16"/></svg>';
  const alertFailIcon = '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>';
  const copyIcon = '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';

  tbody.innerHTML = pagePosts.map(post => {
    // Status Badge
    let statusBadge = '<span class="badge badge-secondary"><span class="badge-dot"></span> Draft</span>';
    if (post.status === 'published') {
      statusBadge = '<span class="badge badge-success"><span class="badge-dot"></span> Published</span>';
    } else if (post.status === 'failed') {
      statusBadge = '<span class="badge badge-danger"><span class="badge-dot"></span> Failed</span>';
    } else if (post.status === 'pending') {
      statusBadge = '<span class="badge badge-warning"><span class="badge-dot"></span> Queued</span>';
    }

    // Notification Badge
    let notifBadge = '<span class="badge badge-secondary"><span class="badge-dot"></span> Pending</span>';
    if (post.notification_status === 'read') {
      notifBadge = `<span class="badge badge-success" style="background: #e0f2fe; color: #0369a1; border-color: #bae6fd;">${doubleCheckIcon}<span>Blue Ticks</span></span>`;
    } else if (post.notification_status === 'delivered') {
      notifBadge = `<span class="badge badge-success">${doubleCheckIcon}<span>Delivered</span></span>`;
    } else if (post.notification_status === 'sent') {
      notifBadge = `<span class="badge badge-info">${checkIcon}<span>Sent</span></span>`;
    } else if (post.notification_status === 'retrying' || post.notification_status === 'in_flight') {
      notifBadge = '<span class="badge badge-warning"><span class="badge-dot"></span> Retrying</span>';
    } else if (post.notification_status === 'failed') {
      notifBadge = `<span class="badge badge-danger">${alertFailIcon}<span>Alert Failed</span></span>`;
    }

    const captionSnippet = post.caption 
      ? (post.caption.length > 55 ? `${post.caption.substring(0, 55)}...` : post.caption)
      : 'No caption provided';

    const actionLink = post.post_url
      ? `<a href="${escapeHtml(safeUrl(post.post_url))}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-secondary" style="gap: 5px;">
           <span>View Post</span>
           <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
         </a>`
      : '<span style="color: var(--text-muted); font-size: 12px;">—</span>';

    const postPlatform = (post.platform || 'facebook').toLowerCase();
    const platformBadge = postPlatform === 'instagram'
      ? `<span class="social-badge social-badge-instagram" style="padding: 3px 10px; font-size: 11.5px;">Instagram</span>`
      : `<span class="social-badge social-badge-facebook" style="padding: 3px 10px; font-size: 11.5px;">Facebook</span>`;

    const clientName = post.client_name || post.client_id || 'Client';
    const postIdStr = String(post.id || '');
    const postIdEscaped = escapeHtml(postIdStr);

    return `
      <tr>
        <td>
          <button type="button" class="code-chip code-chip-copy" title="Copy full Post ID: ${postIdEscaped}" onclick="copyPostId('${postIdEscaped.replace(/'/g, '&#39;')}')">
            <span>${escapeHtml(formatPostIdDisplay(postIdStr))}</span>
            ${copyIcon}
          </button>
        </td>
        <td>
          <div class="company-cell">
            <div class="company-avatar">${getInitials(clientName)}</div>
            <div class="company-name">${escapeHtml(clientName)}</div>
          </div>
        </td>
        <td>${platformBadge}</td>
        <td style="color: var(--text-secondary); max-width: 260px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${escapeHtml(post.caption || '')}">
          ${escapeHtml(captionSnippet)}
        </td>
        <td>${statusBadge}</td>
        <td>
          <div>${notifBadge}</div>
          <div class="notif-channel-sub">via ${escapeHtml(post.notification_channel || 'whatsapp')}</div>
        </td>
        <td style="font-size: 12.5px; color: var(--text-muted); white-space: nowrap;">
          ${escapeHtml(post.published_at || '-')}
        </td>
        <td style="text-align: right;">${actionLink}</td>
      </tr>
    `;
  }).join('');
}

// ==============================================================================
// 2. Metrics Overview
// ==============================================================================
async function fetchMetrics() {
  try {
    const res = await fetch('/api/metrics');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    APP_STATE.metrics = data;
    renderMetrics();
  } catch (err) {
    console.warn('Could not load metrics:', err);
  }
}

function renderMetrics() {
  const mPosts = document.getElementById('metric-total-posts');
  const mNotifs = document.getElementById('metric-delivered-notifs');
  const mRate = document.getElementById('metric-read-rate');
  const mClients = document.getElementById('metric-total-clients');

  if (mPosts) mPosts.textContent = APP_STATE.metrics.total_posts ?? APP_STATE.posts.length;
  if (mNotifs) mNotifs.textContent = APP_STATE.metrics.delivered_notifications ?? 0;
  if (mRate) {
    const delivered = APP_STATE.metrics.delivered_notifications || 0;
    const read = APP_STATE.metrics.read_notifications || 0;
    const rate = delivered > 0 ? Math.round((read / delivered) * 100) : null;
    mRate.textContent = rate === null ? '—' : `${rate}%`;
  }
  if (mClients) {
    mClients.textContent = APP_STATE.excelClients.filter(c => c['Status'] === 'Active').length;
  }
}

// ==============================================================================
// 3. Excel Client Directory
// ==============================================================================
function initClientSearch() {
  const searchInput = document.getElementById('client-search-input');
  const statusSelect = document.getElementById('client-status-filter');
  const prevBtn = document.getElementById('clients-prev-page');
  const nextBtn = document.getElementById('clients-next-page');

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      APP_STATE.searchFilter = e.target.value.trim().toLowerCase();
      APP_STATE.clientFilter.page = 1;
      renderExcelClients();
    });
  }
  if (statusSelect) {
    statusSelect.addEventListener('change', (e) => {
      APP_STATE.clientFilter.status = e.target.value;
      APP_STATE.clientFilter.page = 1;
      renderExcelClients();
    });
  }
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      if (APP_STATE.clientFilter.page > 1) {
        APP_STATE.clientFilter.page -= 1;
        renderExcelClients();
      }
    });
  }
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      APP_STATE.clientFilter.page += 1;
      renderExcelClients();
    });
  }
}

function clearClientFilters() {
  APP_STATE.searchFilter = '';
  APP_STATE.clientFilter.status = 'all';
  APP_STATE.clientFilter.page = 1;
  const searchInput = document.getElementById('client-search-input');
  const statusSelect = document.getElementById('client-status-filter');
  if (searchInput) searchInput.value = '';
  if (statusSelect) statusSelect.value = 'all';
  renderExcelClients();
}

async function fetchExcelClients() {
  try {
    const res = await fetch('/api/excel-clients');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    APP_STATE.excelClients = Array.isArray(data) ? data : [];
    renderExcelClients();
    populateSimulateClientDropdown();
    renderMetrics();
  } catch (err) {
    console.warn('Could not load the client directory:', err);
  }
}

function renderExcelClients() {
  const tbody = document.getElementById('clients-table-body');
  const countChip = document.getElementById('client-count-chip');
  const paginationEl = document.getElementById('clients-pagination');
  const paginationInfo = document.getElementById('clients-pagination-info');
  const pageLabel = document.getElementById('clients-page-label');
  const prevBtn = document.getElementById('clients-prev-page');
  const nextBtn = document.getElementById('clients-next-page');
  if (!tbody) return;

  const filter = APP_STATE.searchFilter;
  const statusFilter = APP_STATE.clientFilter.status;
  const filteredClients = APP_STATE.excelClients.filter(c => {
    const rowStatus = (c['Status'] || c['status'] || 'Active').toLowerCase();
    if (statusFilter !== 'all' && rowStatus !== statusFilter) return false;
    if (!filter) return true;
    const clientId = (c['Client ID'] || c['client_id'] || '').toLowerCase();
    const clientName = (c['Client Name'] || c['Company Name'] || c['client_name'] || '').toLowerCase();
    const pageId = (c['Facebook Page ID'] || c['Page ID'] || c['facebook_page_id'] || '').toLowerCase();
    const igHandle = (c['Instagram Account ID / Handle'] || c['Instagram Handle'] || c['instagram_handle'] || '').toLowerCase();
    const contact = (c['Contact Name'] || c['contact_name'] || '').toLowerCase();
    const phone = (c['WhatsApp Number'] || c['whatsapp_number'] || '').toLowerCase();
    const secPhone = (c['Secondary WhatsApp Number'] || c['secondary_whatsapp_number'] || '').toLowerCase();
    const contactsMatch = Array.isArray(c.contacts) && c.contacts.some(ct => (ct.name || '').toLowerCase().includes(filter) || (ct.phone || '').toLowerCase().includes(filter));
    return clientId.includes(filter) || clientName.includes(filter) || pageId.includes(filter) || igHandle.includes(filter) || contact.includes(filter) || phone.includes(filter) || secPhone.includes(filter) || contactsMatch;
  });

  const activeCount = APP_STATE.excelClients.filter(
    c => (c['Status'] || c['status'] || 'Active').toLowerCase() === 'active'
  ).length;

  const sortedClients = [...filteredClients].sort((a, b) => {
    const aActive = (a['Status'] || a['status'] || 'Active').toLowerCase() === 'active' ? 0 : 1;
    const bActive = (b['Status'] || b['status'] || 'Active').toLowerCase() === 'active' ? 0 : 1;
    return aActive - bActive;
  });

  if (countChip) {
    if (filter || statusFilter !== 'all') {
      countChip.textContent = `${filteredClients.length} of ${APP_STATE.excelClients.length} clients`;
    } else {
      countChip.textContent = `${activeCount} Active · ${APP_STATE.excelClients.length} Total`;
    }
  }

  if (sortedClients.length === 0) {
    if (paginationEl) paginationEl.style.display = 'none';
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; color: var(--text-muted); padding: 40px;">
          ${(filter || statusFilter !== 'all')
            ? `<div style="margin-bottom: 10px;">No clients matched your current search or status filter.</div><button type="button" class="btn btn-sm btn-secondary" onclick="clearClientFilters()">Clear Filters</button>`
            : 'No client records found in the directory. Click "Add Client" above to create one.'}
        </td>
      </tr>
    `;
    return;
  }

  const { pageSize } = APP_STATE.clientFilter;
  const totalPages = Math.max(1, Math.ceil(sortedClients.length / pageSize));
  const currentPage = Math.min(APP_STATE.clientFilter.page, totalPages);
  APP_STATE.clientFilter.page = currentPage;
  const startIdx = (currentPage - 1) * pageSize;
  const pageClients = sortedClients.slice(startIdx, startIdx + pageSize);

  if (paginationEl) {
    paginationEl.style.display = sortedClients.length > pageSize ? 'flex' : 'none';
    if (paginationInfo) paginationInfo.textContent = `Showing ${startIdx + 1}–${startIdx + pageClients.length} of ${sortedClients.length}`;
    if (pageLabel) pageLabel.textContent = `Page ${currentPage} of ${totalPages}`;
    if (prevBtn) prevBtn.disabled = currentPage <= 1;
    if (nextBtn) nextBtn.disabled = currentPage >= totalPages;
  }

  tbody.innerHTML = pageClients.map((c) => {
    const idx = APP_STATE.excelClients.indexOf(c);
    const clientId = c['Client ID'] || c['client_id'] || '-';
    const clientName = c['Client Name'] || c['Company Name'] || c['client_name'] || '-';
    const pageId = c['Facebook Page ID'] || c['Page ID'] || c['facebook_page_id'] || '';
    const igHandle = c['Instagram Account ID / Handle'] || c['Instagram Handle'] || c['instagram_handle'] || '';
    const statusVal = c['Status'] || c['status'] || 'Active';

    const statusBadge = statusVal.toLowerCase() === 'active'
      ? '<span class="badge badge-success"><span class="badge-dot"></span> Active</span>'
      : '<span class="badge badge-secondary"><span class="badge-dot" style="background: #94a3b8;"></span> Inactive</span>';

    // Format Social Channels cleanly in one stacked cell
    const hasIg = igHandle && igHandle !== '-' && igHandle !== '@client';
    const cleanIg = igHandle.replace('@', '');
    const igDisplay = hasIg
      ? `<a href="https://instagram.com/${escapeHtml(cleanIg)}" target="_blank" rel="noopener noreferrer" class="social-badge social-badge-instagram" title="Open Instagram Profile">
           <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
           <span>@${escapeHtml(cleanIg)}</span>
         </a>`
      : '';

    const hasFb = pageId && pageId !== '-';
    const fbDisplay = hasFb
      ? `<a href="https://facebook.com/${escapeHtml(pageId)}" target="_blank" rel="noopener noreferrer" class="social-badge social-badge-facebook" title="Open Facebook Page">
           <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
           <span>${escapeHtml(pageId)}</span>
         </a>`
      : '';

    const channelsCell = (igDisplay || fbDisplay)
      ? `<div class="channels-stack">${igDisplay}${fbDisplay}</div>`
      : '<span style="color: var(--text-muted); font-size: 12px;">Not connected</span>';

    // Resolve contacts list (dynamic with legacy fallback)
    let contacts = [];
    if (Array.isArray(c.contacts) && c.contacts.length > 0) {
      contacts = c.contacts;
    } else {
      const pTitle = c['Title'] || c['contact_title'] || 'Mr.';
      const pName = c['Contact Name'] || c['contact_name'] || '-';
      const pPhone = c['WhatsApp Number'] || c['whatsapp_number'] || '';
      if (pPhone && pPhone !== '-') {
        contacts.push({ title: pTitle, name: pName, phone: pPhone });
      }
      const sPhone = c['Secondary WhatsApp Number'] || c['secondary_whatsapp_number'] || '';
      if (sPhone && sPhone !== '-') {
        contacts.push({ title: 'Mr.', name: pName + ' (Alt)', phone: sPhone });
      }
    }
    if (contacts.length === 0) {
      contacts = [{ title: c['Title'] || c['contact_title'] || 'Mr.', name: c['Contact Name'] || c['contact_name'] || '-', phone: c['WhatsApp Number'] || c['whatsapp_number'] || '' }];
    }

    const recipientsCell = contacts.map(ct => {
      const p = ct.phone || '';
      const cleanDigits = p.replace(/[^0-9]/g, '');
      const titleText = escapeHtml(ct.title || 'Mr.');
      const nameText = escapeHtml(ct.name || '-');
      const nameHtml = `<span class="recipient-name-text" title="${titleText} ${nameText}"><span class="recipient-title-muted">${titleText}</span>${nameText}</span>`;
      const phoneLink = cleanDigits
        ? `<a href="https://wa.me/${escapeHtml(cleanDigits)}" target="_blank" rel="noopener noreferrer" class="phone-badge phone-badge-compact" title="Open WhatsApp chat with ${nameText}">
             <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
             <span>${escapeHtml(p)}</span>
           </a>`
        : '<span style="color: var(--text-muted); font-size: 12px;">—</span>';
      return `<div class="recipient-row">${nameHtml}${phoneLink}</div>`;
    }).join('');

    const companyPhone = c['Company Phone'] || c['company_phone'] || '';
    const tpl = c['WhatsApp Template'] || c['whatsapp_template'] || '';
    const map = {
      'business_media_status_alert': 'Utility Photo + Link',
      'business_ig_media_link_alert': 'Photo + Post Link',
      'business_post_link_alert': 'Post Link (Text)',
      'business_post_link_exact': 'Post Link (Text)',
      'business_media_post_url_alert': 'Photo + Link',
      'business_media_post_link_alert': 'Photo + Caption + Link',
      'business_media_post_alert': 'Photo Only',
      'business_compact_engagement': 'Compact Link',
      'business_post_published_link_alert': 'Detailed Alert',
      'tms_post_published_alert': 'TMS Alert'
    };
    const tplLabel = tpl ? (map[tpl] || tpl) : 'Photo + Post Link (Default)';
    const isCustomTpl = Boolean(tpl);

    return `
      <tr class="${statusVal.toLowerCase() === 'active' ? '' : 'client-row-inactive'}">
        <td>
          <span class="code-chip">${escapeHtml(clientId)}</span>
        </td>
        <td>
          <div class="company-cell">
            <div class="company-avatar">${getInitials(clientName)}</div>
            <div>
              <div class="company-name">${escapeHtml(clientName)}</div>
              <div class="company-sub-meta">
                <span class="${isCustomTpl ? 'company-sub-custom' : ''}" title="WhatsApp Template format used for this client">${escapeHtml(tplLabel)}</span>
                ${companyPhone ? `<span class="company-sub-sep">·</span><span title="Official company phone displayed in footer">${escapeHtml(companyPhone)}</span>` : ''}
              </div>
            </div>
          </div>
        </td>
        <td>${channelsCell}</td>
        <td>
          <div class="recipients-stack">${recipientsCell}</div>
        </td>
        <td>${statusBadge}</td>
        <td style="text-align: right;">
          <div class="actions-cell">
            <button class="btn btn-sm btn-outline-secondary btn-view-client" data-index="${idx}" title="Display client details & template preview">
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
              <span>Details</span>
            </button>
            <button class="btn btn-sm btn-outline-primary btn-edit-client" data-index="${idx}" title="Edit client details">
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
              <span>Edit</span>
            </button>
            <button class="btn btn-sm btn-outline-danger btn-icon-only btn-delete-client" data-index="${idx}" title="Archive client" aria-label="Archive client">
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function populateSimulateClientDropdown() {
  const select = document.getElementById('sim-select-client');
  if (!select) return;

  if (APP_STATE.excelClients.length === 0) {
    select.innerHTML = '<option value="">No clients found in the client directory</option>';
    return;
  }

  select.innerHTML = APP_STATE.excelClients.filter(c => c['Status'] === 'Active' && ((c['Facebook Page ID'] && c['Facebook Page ID'] !== '-') || (c['Instagram Account ID / Handle'] && c['Instagram Account ID / Handle'] !== '-'))).map(c => {
    const pageId = c['Facebook Page ID'] || c['Page ID'] || c['facebook_page_id'] || '';
    const igHandle = c['Instagram Account ID / Handle'] || c['Instagram Handle'] || c['instagram_handle'] || '';
    const primaryId = (pageId && pageId !== '-') ? pageId : igHandle;
    const name = c['Client Name'] || c['Company Name'] || c['client_name'] || 'Client';
    
    let phoneLabel = '';
    if (Array.isArray(c.contacts) && c.contacts.length > 0) {
      phoneLabel = c.contacts.map(ct => (ct.name ? ct.name + ': ' : '') + ct.phone).join(' | ');
    } else {
      const phone = c['WhatsApp Number'] || c['whatsapp_number'] || '';
      const secPhone = c['Secondary WhatsApp Number'] || c['secondary_whatsapp_number'] || '';
      phoneLabel = secPhone ? `${phone}, ${secPhone}` : phone;
    }
    const idLabel = (pageId && pageId !== '-') ? `Page ID: ${pageId}` : `IG: @${igHandle}`;
    return `<option value="${escapeHtml(primaryId)}" data-name="${escapeHtml(name)}">${escapeHtml(name)} (${escapeHtml(idLabel)} ➔ WA: ${escapeHtml(phoneLabel)})</option>`;
  }).join('');
}

// ==============================================================================
// 4. Add Client Modal Handler
// ==============================================================================
function initAddClientModal() {
  const modal = document.getElementById('add-client-modal');
  const openBtn = document.getElementById('btn-open-add-client');
  const closeBtn = document.getElementById('btn-close-modal');
  const form = document.getElementById('add-client-form');
  const contactsContainer = document.getElementById('new-contacts-list');
  const addContactBtn = document.getElementById('btn-add-contact-row');

  if (!modal) return;

  const closeModal = () => modal.classList.remove('open');
  const openModal = () => {
    if (contactsContainer && (!contactsContainer.children || contactsContainer.children.length === 0)) {
      renderContactsInContainer(contactsContainer, [{}], 'new');
    }
    modal.classList.add('open');
  };

  if (openBtn) openBtn.addEventListener('click', openModal);
  if (closeBtn) closeBtn.addEventListener('click', closeModal);

  if (addContactBtn && contactsContainer) {
    addContactBtn.addEventListener('click', () => {
      const idx = contactsContainer.querySelectorAll('[data-contact-card]').length;
      contactsContainer.insertAdjacentHTML('beforeend', createContactRowHtml({}, idx, true, 'new'));
      const last = contactsContainer.lastElementChild;
      if (last) {
        const nameInp = last.querySelector('.contact-card-name');
        if (nameInp) nameInp.focus();
      }
    });

    contactsContainer.addEventListener('click', (e) => {
      const rmBtn = e.target.closest('.btn-remove-contact-card');
      if (rmBtn) {
        const card = rmBtn.closest('[data-contact-card]');
        if (card) {
          card.remove();
          contactsContainer.querySelectorAll('[data-contact-card]').forEach((c, i) => {
            const lbl = c.querySelector('span');
            if (lbl) lbl.textContent = i === 0 ? 'Recipient 1 (Primary)' : ('Recipient ' + (i + 1));
          });
        }
      }
    });
  }

  // Pre-fill initial contact card
  if (contactsContainer && contactsContainer.children.length === 0) {
    renderContactsInContainer(contactsContainer, [{}], 'new');
  }

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = form.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span>Saving client...</span>';

      const contacts = getContactsFromContainer(contactsContainer);
      if (contacts.length === 0) {
        showToast('Please add at least one contact with a valid WhatsApp phone number.', 'warning');
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span>Save Client</span>';
        return;
      }

      const rawCompPhone = document.getElementById('new-company-number') ? document.getElementById('new-company-number').value.trim() : '';
      const compPhoneClean = cleanPhoneInput(rawCompPhone ? (rawCompPhone.startsWith('+') ? rawCompPhone : '+' + rawCompPhone) : '');

      const payload = {
        client_id: document.getElementById('new-client-id').value.trim(),
        client_name: document.getElementById('new-client-name').value.trim(),
        company_phone: compPhoneClean,
        facebook_page_id: document.getElementById('new-page-id').value.trim(),
        facebook_page_name: 'Facebook Page',
        contacts: contacts,
        contact_title: contacts[0].title,
        contact_name: contacts[0].name,
        whatsapp_number: contacts[0].phone,
        secondary_whatsapp_number: contacts[1] ? contacts[1].phone : '',
        whatsapp_template: document.getElementById('new-client-template') ? document.getElementById('new-client-template').value : '',
        status: 'Active',
        instagram_handle: document.getElementById('new-instagram-handle') ? document.getElementById('new-instagram-handle').value.trim() : ''
      };

      if (!payload.facebook_page_id && !payload.instagram_handle) {
        showToast('Please provide at least one channel: Facebook Page ID or Instagram Handle.', 'warning');
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span>Save Client</span>';
        return;
      }

      try {
        const res = await fetch('/api/excel-clients', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(formatApiError(errData, res.status));
        }
        form.reset();
        if (document.getElementById('new-company-number')) document.getElementById('new-company-number').value = '';
        renderContactsInContainer(contactsContainer, [{}], 'new');
        closeModal();
        await fetchExcelClients();
        showToast(`Client ${payload.client_name} added to the client directory`, 'success');
      } catch (err) {
        showToast(`Failed to add client: ${err.message}`, 'danger');
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span>Save Client</span>';
      }
    });
  }
}

// ==============================================================================
// 4.1 Edit Client Modal Handler
// ==============================================================================
function initEditClientModal() {
  const modal = document.getElementById('edit-client-modal');
  const closeBtn = document.getElementById('btn-close-edit-modal');
  const cancelBtn = document.getElementById('btn-cancel-edit-modal');
  const form = document.getElementById('edit-client-form');
  const tableBody = document.getElementById('clients-table-body');
  const contactsContainer = document.getElementById('edit-contacts-list');
  const addContactBtn = document.getElementById('btn-edit-add-contact-row');

  if (!modal) return;

  const closeModal = () => modal.classList.remove('open');
  const openModal = () => modal.classList.add('open');

  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (cancelBtn) cancelBtn.addEventListener('click', closeModal);

  if (addContactBtn && contactsContainer) {
    addContactBtn.addEventListener('click', () => {
      const idx = contactsContainer.querySelectorAll('[data-contact-card]').length;
      contactsContainer.insertAdjacentHTML('beforeend', createContactRowHtml({}, idx, true, 'new'));
      const last = contactsContainer.lastElementChild;
      if (last) {
        const nameInp = last.querySelector('.contact-card-name');
        if (nameInp) nameInp.focus();
      }
    });

    contactsContainer.addEventListener('click', (e) => {
      const rmBtn = e.target.closest('.btn-remove-contact-card');
      if (rmBtn) {
        const card = rmBtn.closest('[data-contact-card]');
        if (card) {
          card.remove();
          contactsContainer.querySelectorAll('[data-contact-card]').forEach((c, i) => {
            const lbl = c.querySelector('span');
            if (lbl) lbl.textContent = i === 0 ? 'Recipient 1 (Primary)' : ('Recipient ' + (i + 1));
          });
        }
      }
    });
  }

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  // Table body click delegation for Edit and Delete
  if (tableBody) {
    tableBody.addEventListener('click', async (e) => {
      const editBtn = e.target.closest('.btn-edit-client');
      const deleteBtn = e.target.closest('.btn-delete-client');

      if (editBtn) {
        const idx = parseInt(editBtn.getAttribute('data-index'), 10);
        const client = APP_STATE.excelClients[idx];
        if (!client) return;

        document.getElementById('edit-row-index').value = idx;
        document.getElementById('edit-client-id').value = client['Client ID'] || client['client_id'] || '';
        document.getElementById('edit-client-name').value = client['Client Name'] || client['Company Name'] || client['client_name'] || '';
        const compPhoneVal = client['Company Phone'] || client['company_phone'] || '';
        const editCompEl = document.getElementById('edit-company-number');
        if (editCompEl) {
          editCompEl.value = compPhoneVal.startsWith('+') ? compPhoneVal.slice(1) : compPhoneVal;
        }
        document.getElementById('edit-page-id').value = client['Facebook Page ID'] || client['Page ID'] || client['facebook_page_id'] || '';
        const editPageNameEl = document.getElementById('edit-page-name');
        if (editPageNameEl) {
          editPageNameEl.value = client['Facebook Page Name'] || client['Page Name'] || client['facebook_page_name'] || '';
        }
        document.getElementById('edit-instagram-handle').value = client['Instagram Account ID / Handle'] || client['Instagram Handle'] || client['instagram_handle'] || '';
        const editTplEl = document.getElementById('edit-client-template');
        if (editTplEl) {
          editTplEl.value = client['WhatsApp Template'] || client['whatsapp_template'] || '';
        }
        document.getElementById('edit-status').value = client['Status'] || client['status'] || 'Active';

        let editContacts = [];
        if (Array.isArray(client.contacts) && client.contacts.length > 0) {
          editContacts = client.contacts;
        } else {
          const pTitle = client['Title'] || client['contact_title'] || 'Mr.';
          const pName = client['Contact Name'] || client['contact_name'] || '';
          const pPhone = client['WhatsApp Number'] || client['whatsapp_number'] || '';
          if (pPhone && pPhone !== '-') {
            editContacts.push({ title: pTitle, name: pName, phone: pPhone });
          }
          const sPhone = client['Secondary WhatsApp Number'] || client['secondary_whatsapp_number'] || '';
          if (sPhone && sPhone !== '-') {
            editContacts.push({ title: 'Mr.', name: pName, phone: sPhone });
          }
        }
        if (editContacts.length === 0) editContacts = [{}];
        renderContactsInContainer(contactsContainer, editContacts, 'edit');

        openModal();
      }

      if (deleteBtn) {
        const idx = parseInt(deleteBtn.getAttribute('data-index'), 10);
        const client = APP_STATE.excelClients[idx];
        const clientName = client ? (client['Client Name'] || client['Company Name'] || 'Client') : 'this client';

        if (!confirm(`Are you sure you want to archive "${clientName}"? History will be retained.`)) {
          return;
        }

        try {
          const res = await fetch(`/api/excel-clients/${encodeURIComponent(client['Client ID'])}?version=${client.version}`, { method: 'DELETE' });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          await fetchExcelClients();
          showToast(`Client ${clientName} removed from the client directory`, 'success');
        } catch (err) {
          showToast(`Delete failed: ${err.message}`, 'danger');
        }
      }
    });
  }

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = form.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span>Saving...</span>';

      const idx = document.getElementById('edit-row-index').value;
      const client = APP_STATE.excelClients[idx];
      const contacts = getContactsFromContainer(contactsContainer);
      if (contacts.length === 0) {
        showToast('Please add at least one contact with a valid WhatsApp phone number.', 'warning');
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span>Save Changes</span>';
        return;
      }

      const rawEditComp = document.getElementById('edit-company-number') ? document.getElementById('edit-company-number').value.trim() : '';
      const compPhoneClean = cleanPhoneInput(rawEditComp ? (rawEditComp.startsWith('+') ? rawEditComp : '+' + rawEditComp) : '');

      const payload = {
        client_id: document.getElementById('edit-client-id').value.trim(),
        client_name: document.getElementById('edit-client-name').value.trim(),
        company_phone: compPhoneClean,
        facebook_page_id: document.getElementById('edit-page-id').value.trim(),
        facebook_page_name: (document.getElementById('edit-page-name') ? document.getElementById('edit-page-name').value.trim() : '') || (client['Facebook Page Name'] || 'Facebook Page'),
        contacts: contacts,
        contact_title: contacts[0].title,
        contact_name: contacts[0].name,
        whatsapp_number: contacts[0].phone,
        secondary_whatsapp_number: contacts[1] ? contacts[1].phone : '',
        whatsapp_template: document.getElementById('edit-client-template') ? document.getElementById('edit-client-template').value : '',
        version: client.version,
        status: document.getElementById('edit-status').value,
        instagram_handle: document.getElementById('edit-instagram-handle').value.trim()
      };

      if (!payload.facebook_page_id && !payload.instagram_handle) {
        showToast('Please provide at least one channel: Facebook Page ID or Instagram Handle.', 'warning');
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span>Save Changes</span>';
        return;
      }

      try {
        const res = await fetch(`/api/excel-clients/${encodeURIComponent(payload.client_id)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(formatApiError(errData, res.status));
        }

        closeModal();
        await fetchExcelClients();
        showToast(`Client ${payload.client_name} updated successfully`, 'success');
      } catch (err) {
        showToast(`Failed to update client: ${err.message}`, 'danger');
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span>Save Changes</span>';
      }
    });
  }
}

// ==============================================================================
// 4.2 Display Details Modal Handler
// ==============================================================================
function initViewClientModal() {
  const modal = document.getElementById('view-client-modal');
  const closeBtn = document.getElementById('btn-close-view-modal');
  const closeBtn2 = document.getElementById('btn-close-view-modal-2');
  const editShortcutBtn = document.getElementById('btn-view-edit-shortcut');
  const tableBody = document.getElementById('clients-table-body');

  if (!modal) return;

  const closeModal = () => modal.classList.remove('open');
  const openModal = () => modal.classList.add('open');

  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (closeBtn2) closeBtn2.addEventListener('click', closeModal);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  if (tableBody) {
    tableBody.addEventListener('click', (e) => {
      const viewBtn = e.target.closest('.btn-view-client');
      if (!viewBtn) return;
      const idx = parseInt(viewBtn.getAttribute('data-index'), 10);
      const client = APP_STATE.excelClients[idx];
      if (!client) return;

      const clientName = client['Client Name'] || client['Company Name'] || client['client_name'] || 'Client';
      const clientId = client['Client ID'] || client['client_id'] || '-';
      const companyPhone = client['Company Phone'] || client['company_phone'] || '';
      const pageId = client['Facebook Page ID'] || client['Page ID'] || client['facebook_page_id'] || '';
      const pageName = client['Facebook Page Name'] || client['Page Name'] || client['facebook_page_name'] || 'Facebook Page';
      const igHandle = client['Instagram Account ID / Handle'] || client['Instagram Handle'] || client['instagram_handle'] || '';
      const statusVal = client['Status'] || client['status'] || 'Active';

      document.getElementById('view-company-name').textContent = clientName;
      document.getElementById('view-client-avatar').textContent = getInitials(clientName);
      document.getElementById('view-client-id').textContent = 'Client ID: ' + clientId;

      const statusBadge = statusVal.toLowerCase() === 'active'
        ? '<span class="badge badge-success"><span class="badge-dot"></span> Active</span>'
        : '<span class="badge badge-secondary"><span class="badge-dot" style="background: #94a3b8;"></span> Inactive</span>';
      document.getElementById('view-status-badge').innerHTML = statusBadge;

      // Company Phone
      const phoneBox = document.getElementById('view-company-phone-box');
      if (companyPhone) {
        phoneBox.innerHTML = `
          <a href="tel:${escapeHtml(companyPhone)}" style="color: #4f46e5; text-decoration: none; display: inline-flex; align-items: center; gap: 6px;">
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
            <span>${escapeHtml(companyPhone)}</span>
          </a>
        `;
      } else {
        phoneBox.innerHTML = `<span style="font-size: 13px; font-weight: normal; color: var(--text-muted);">Not provided</span>`;
      }

      // Social channels
      const socialContainer = document.getElementById('view-social-channels');
      let socialHtml = '';
      if (pageId && pageId !== '-') {
        socialHtml += `
          <a href="https://facebook.com/${escapeHtml(pageId)}" target="_blank" rel="noopener noreferrer" class="social-badge social-badge-facebook" style="font-size: 12px; padding: 6px 12px;">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
            <span>FB Page ID: ${escapeHtml(pageId)}</span>
          </a>
        `;
      }
      if (igHandle && igHandle !== '-' && igHandle !== '@client') {
        const cleanIg = igHandle.replace('@', '');
        socialHtml += `
          <a href="https://instagram.com/${escapeHtml(cleanIg)}" target="_blank" rel="noopener noreferrer" class="social-badge social-badge-instagram" style="font-size: 12px; padding: 6px 12px;">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
            <span>IG: @${escapeHtml(cleanIg)}</span>
          </a>
        `;
      }
      if (!socialHtml) {
        socialHtml = `<span style="color: var(--text-muted); font-size: 12px;">No social accounts connected</span>`;
      }
      socialContainer.innerHTML = socialHtml;

      // Contacts & Alert Recipients
      const contactsContainer = document.getElementById('view-contacts-list');
      let contacts = Array.isArray(client.contacts) && client.contacts.length > 0 ? client.contacts : [];
      if (contacts.length === 0) {
        const p = client['WhatsApp Number'] || client['whatsapp_number'] || '';
        if (p) contacts.push({ title: client['Title'] || 'Mr.', name: client['Contact Name'] || 'Primary', phone: p });
      }
      if (contacts.length === 0) {
        contactsContainer.innerHTML = `<span style="color: var(--text-muted); font-size: 12px;">No alert recipients specified</span>`;
      } else {
        contactsContainer.innerHTML = contacts.map((c, i) => {
          const cleanDigits = (c.phone || '').replace(/[^0-9]/g, '');
          return `
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px 12px; display: flex; justify-content: space-between; align-items: center;">
              <div>
                <span class="badge" style="font-size: 10.5px; background: #e2e8f0; color: #334155; margin-right: 6px;">${escapeHtml(c.title || 'Mr.')}</span>
                <strong style="color: #1e293b; font-size: 13px;">${escapeHtml(c.name || 'Client Contact')}</strong>
                <span style="font-size: 11px; color: var(--text-muted); margin-left: 4px;">(${i === 0 ? 'Primary' : 'Recipient ' + (i + 1)})</span>
              </div>
              <div>
                ${cleanDigits ? `
                  <a href="https://wa.me/${escapeHtml(cleanDigits)}" target="_blank" rel="noopener noreferrer" class="phone-badge" style="font-size: 12px;">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
                    <span>${escapeHtml(c.phone)}</span>
                  </a>
                ` : `<span style="color: var(--text-muted); font-size: 12px;">-</span>`}
              </div>
            </div>
          `;
        }).join('');
      }

      // Populate Approved WhatsApp Notification Preview with this client's details
      const previewEl = document.getElementById('view-template-preview');
      if (previewEl) {
        const primaryContact = contacts[0] || {};
        const ownerName = client['Contact Name'] || client['contact_name'] || primaryContact.name || clientName;
        const fullOwner = ownerName.trim();
        const officialNumber = companyPhone || primaryContact.phone || client['WhatsApp Number'] || client['whatsapp_number'] || '';

        const tplKey = client['WhatsApp Template'] || client['whatsapp_template'] || 'business_ig_media_link_alert';
        let tplContent = '';

        if (tplKey === 'business_media_status_alert') {
          tplContent = `
            <div style="color: #4338ca; font-weight: 600; margin-bottom: 6px; font-size: 11px; display: flex; justify-content: space-between;">
              <span>Template: <code>business_media_status_alert</code></span>
              <span style="color: #059669; font-weight: 600;">UTILITY (Photo + Post Link)</span>
            </div>
            <div style="background: #ffffff; padding: 12px; border: 1px solid #e0e7ff; border-radius: 6px; line-height: 1.6; font-size: 12.5px;">
              <div style="background: #f1f5f9; border: 1px dashed #94a3b8; border-radius: 6px; padding: 16px; text-align: center; color: #475569; margin-bottom: 10px; font-weight: 600;">
                🖼️ [Instagram Published Post Image Header]
              </div>
              Account notification from <strong>${escapeHtml(clientName)}</strong><br><br>
              Your scheduled social media post has been published. ✅<br><br>
              <strong>Post Link :</strong><br>
              <span style="color: #4f46e5; text-decoration: underline;">https://www.instagram.com/p/Dfjop59CvrU/</span><br><br>
              This is an automated publication confirmation for your account.<br><br>
              Regards,<br>
              👤 <strong>${escapeHtml(fullOwner)}</strong><br>
              📞 <strong>${escapeHtml(officialNumber || '(Company Phone)')}</strong> 🙏
            </div>
          `;
        } else if (tplKey === 'business_compact_engagement') {
          tplContent = `
            <div style="color: #4338ca; font-weight: 600; margin-bottom: 6px; font-size: 11px; display: flex; justify-content: space-between;">
              <span>Template: <code>business_compact_engagement</code></span>
              <span style="color: #059669; font-weight: 600;">Status: APPROVED (Compact)</span>
            </div>
            <div style="background: #ffffff; padding: 12px; border: 1px solid #e0e7ff; border-radius: 6px; line-height: 1.6; font-size: 12.5px;">
              Greetings from <strong>${escapeHtml(clientName)}</strong>! 🙏<br><br>
              📸 Check out our latest updates:<br>
              <span style="color: #4f46e5; text-decoration: underline;">https://instagram.com/p/DB12345678/</span><br><br>
              ❤️ Like, 🔄 Share &amp; ➕ Follow us!<br><br>
              Thank you for your continued support.<br><br>
              Warm regards,<br>
              👤 <strong>${escapeHtml(fullOwner)}</strong><br>
              📞 <strong>${escapeHtml(officialNumber || '(Company Phone)')}</strong> 🙏
            </div>
          `;
        } else if (tplKey === 'business_post_published_link_alert') {
          tplContent = `
            <div style="color: #4338ca; font-weight: 600; margin-bottom: 6px; font-size: 11px; display: flex; justify-content: space-between;">
              <span>Template: <code>business_post_published_link_alert</code></span>
              <span style="color: #059669; font-weight: 600;">Status: APPROVED (Caption + Link)</span>
            </div>
            <div style="background: #ffffff; padding: 12px; border: 1px solid #e0e7ff; border-radius: 6px; line-height: 1.6; font-size: 12.5px;">
              Greetings from <strong>${escapeHtml(clientName)}</strong>! 🙏<br><br>
              📸 You are welcome to visit the link to view our latest updates.<br><br>
              📝 <strong>Post Caption:</strong><br>
              Excited to announce our new update! Visit our website to learn more. #Announcement<br><br>
              📸 <strong>Published Post Link:</strong><br>
              <span style="color: #4f46e5; text-decoration: underline;">https://instagram.com/p/DB12345678/</span><br><br>
              ❤️ Like, 🔄 Share &amp; ➕ Follow us!<br><br>
              Thank you for your continued support.<br><br>
              Warm regards,<br>
              👤 <strong>${escapeHtml(fullOwner)}</strong><br>
              📞 <strong>${escapeHtml(officialNumber || '(Company Phone)')}</strong> 🙏
            </div>
          `;
        } else if (tplKey === 'tms_post_published_alert') {
          tplContent = `
            <div style="color: #4338ca; font-weight: 600; margin-bottom: 6px; font-size: 11px; display: flex; justify-content: space-between;">
              <span>Template: <code>tms_post_published_alert</code></span>
              <span style="color: #059669; font-weight: 600;">Status: APPROVED (TMS Service)</span>
            </div>
            <div style="background: #ffffff; padding: 12px; border: 1px solid #e0e7ff; border-radius: 6px; line-height: 1.6; font-size: 12.5px;">
              Hello <strong>${escapeHtml(primaryContact.name || clientName)}</strong> Garu! 👋<br><br>
              This is to inform you that your social media post has been successfully published. ✅<br><br>
              📝 <strong>Post Caption:</strong><br>
              Excited to share our latest update!<br><br>
              📸 <strong>Published Post Link:</strong><br>
              <span style="color: #4f46e5; text-decoration: underline;">https://instagram.com/p/DB12345678/</span><br><br>
              Your post is now available on your social media account.<br><br>
              Thank you for choosing our services.<br><br>
              Regards,<br>
              <strong>Team TMS</strong> 💙
            </div>
          `;
        } else if (tplKey === 'business_media_post_alert') {
          tplContent = `
            <div style="color: #4338ca; font-weight: 600; margin-bottom: 6px; font-size: 11px; display: flex; justify-content: space-between;">
              <span>Template: <code>${escapeHtml(tplKey)}</code></span>
              <span style="color: #059669; font-weight: 600;">Status: APPROVED (Photo Header Only)</span>
            </div>
            <div style="background: #ffffff; padding: 12px; border: 1px solid #e0e7ff; border-radius: 6px; line-height: 1.6; font-size: 12.5px;">
              <div style="background: #f1f5f9; border-radius: 6px; padding: 16px; text-align: center; margin-bottom: 10px; border: 1px dashed #cbd5e1; color: #475569; font-size: 12px;">
                🖼️ <strong>[Instagram Published Post Image Header]</strong>
              </div>
              Greetings from <strong>${escapeHtml(clientName)}</strong>! 🙏<br><br>
              📸 You are welcome to view our latest updates.<br><br>
              📝 <strong>Post Caption:</strong><br>
              Excited to announce our new update! Visit our website to learn more. #Announcement<br><br>
              ❤️ Like, 🔄 Share &amp; ➕ Follow us!<br><br>
              Thank you for your continued support.<br><br>
              Warm regards,<br>
              👤 <strong>${escapeHtml(fullOwner)}</strong><br>
              📞 <strong>${escapeHtml(officialNumber || '(Company Phone)')}</strong> 🙏
            </div>
          `;
        } else if (tplKey === 'business_media_post_link_alert') {
          tplContent = `
            <div style="color: #4338ca; font-weight: 600; margin-bottom: 6px; font-size: 11px; display: flex; justify-content: space-between;">
              <span>Template: <code>${escapeHtml(tplKey)}</code></span>
              <span style="color: #059669; font-weight: 600;">Status: APPROVED (Photo + Caption + Link)</span>
            </div>
            <div style="background: #ffffff; padding: 12px; border: 1px solid #e0e7ff; border-radius: 6px; line-height: 1.6; font-size: 12.5px;">
              <div style="background: #f1f5f9; border-radius: 6px; padding: 16px; text-align: center; margin-bottom: 10px; border: 1px dashed #cbd5e1; color: #475569; font-size: 12px;">
                🖼️ <strong>[Instagram Published Post Image Header]</strong>
              </div>
              Greetings from <strong>${escapeHtml(clientName)}</strong>! 🙏<br><br>
              📸 You are welcome to view our latest updates.<br><br>
              📝 <strong>Post Caption:</strong><br>
              Excited to announce our new update! Visit our website to learn more. #Announcement<br><br>
              📸 <strong>Published Post Link:</strong><br>
              <span style="color: #4f46e5; text-decoration: underline;">https://www.instagram.com/p/DB12345678/</span><br><br>
              ❤️ Like, 🔄 Share &amp; ➕ Follow us!<br><br>
              Thank you for your continued support.<br><br>
              Warm regards,<br>
              👤 <strong>${escapeHtml(fullOwner)}</strong><br>
              📞 <strong>${escapeHtml(officialNumber || '(Company Phone)')}</strong> 🙏
            </div>
          `;
        } else if (tplKey === 'business_media_post_url_alert') {
          tplContent = `
            <div style="color: #4338ca; font-weight: 600; margin-bottom: 6px; font-size: 11px; display: flex; justify-content: space-between;">
              <span>Template: <code>${escapeHtml(tplKey)}</code></span>
              <span style="color: #059669; font-weight: 600;">Status: APPROVED (Photo + Link)</span>
            </div>
            <div style="background: #ffffff; padding: 12px; border: 1px solid #e0e7ff; border-radius: 6px; line-height: 1.6; font-size: 12.5px;">
              <div style="background: #f1f5f9; border-radius: 6px; padding: 16px; text-align: center; margin-bottom: 10px; border: 1px dashed #cbd5e1; color: #475569; font-size: 12px;">
                🖼️ <strong>[Instagram Published Post Image Header]</strong>
              </div>
              Greetings from <strong>${escapeHtml(clientName)}</strong>! 🙏<br><br>
              📸 You are welcome to view our latest updates.<br><br>
              📸 <strong>Published Post Link:</strong><br>
              <span style="color: #4f46e5; text-decoration: underline;">https://www.instagram.com/p/DB12345678/</span><br><br>
              ❤️ Like, 🔄 Share &amp; ➕ Follow us!<br><br>
              Thank you for your continued support.<br><br>
              Warm regards,<br>
              👤 <strong>${escapeHtml(fullOwner)}</strong><br>
              📞 <strong>${escapeHtml(officialNumber || '(Company Phone)')}</strong> 🙏
            </div>
          `;
        } else if (tplKey === 'business_post_link_alert' || tplKey === 'business_post_link_exact') {
          tplContent = `
            <div style="color: #4338ca; font-weight: 600; margin-bottom: 6px; font-size: 11px; display: flex; justify-content: space-between;">
              <span>Template: <code>${escapeHtml(tplKey)}</code></span>
              <span style="color: #059669; font-weight: 600;">Status: APPROVED (Post Link Alert)</span>
            </div>
            <div style="background: #ffffff; padding: 12px; border: 1px solid #e0e7ff; border-radius: 6px; line-height: 1.6; font-size: 12.5px;">
              Greetings from <strong>${escapeHtml(clientName)}</strong>! 🙏<br><br>
              📸 You are welcome to view our latest updates.<br><br>
              📸 <strong>Post Link :</strong><br>
              <span style="color: #4f46e5; text-decoration: underline;">https://www.instagram.com/p/Dfjop59CvrU/</span><br><br>
              ❤️ Like, 🔄 Share &amp; ➕ Follow us!<br><br>
              Thank you for your continued support.<br><br>
              Warm regards,<br>
              👤 <strong>${escapeHtml(fullOwner)}</strong><br>
              📞 <strong>${escapeHtml(officialNumber || '(Company Phone)')}</strong> 🙏
            </div>
          `;
        } else {
          tplContent = `
            <div style="color: #4338ca; font-weight: 600; margin-bottom: 6px; font-size: 11px; display: flex; justify-content: space-between; align-items: center;">
              <span>Template: <code>${escapeHtml(tplKey)}</code></span>
              <span style="color: #059669; font-weight: 600;">Photo + Post Link</span>
            </div>
            <div style="background: #ffffff; padding: 12px 14px; border: 1px solid #e0e7ff; border-radius: 6px; line-height: 1.45; font-size: 12.5px;">
              <div style="background: #f1f5f9; border-radius: 6px; padding: 10px 12px; text-align: center; margin-bottom: 10px; border: 1px dashed #cbd5e1; color: #475569; font-size: 12px;">
                🖼️ <strong>[Instagram Published Post Image Header]</strong>
              </div>
              <p style="margin: 0 0 8px 0;">Greetings from <strong>${escapeHtml(clientName)}</strong>! 🙏</p>
              <p style="margin: 0 0 8px 0;">📸 You are welcome to view our latest updates.</p>
              <p style="margin: 0 0 8px 0;">📸 <strong>Post Link :</strong><br><span style="color: #4f46e5; text-decoration: underline;">https://www.instagram.com/p/Dfjop59CvrU/</span></p>
              <p style="margin: 0 0 8px 0;">❤️ Like, 🔄 Share &amp; ➕ Follow us!</p>
              <p style="margin: 0 0 8px 0;">Thank you for your continued support.</p>
              <p style="margin: 0;">Warm regards,<br>👤 <strong>${escapeHtml(fullOwner)}</strong><br>📞 <strong>${escapeHtml(officialNumber || '(Company Phone)')}</strong> 🙏</p>
            </div>
          `;
        }

        previewEl.innerHTML = tplContent;
      }

      if (editShortcutBtn) {
        editShortcutBtn.onclick = () => {
          closeModal();
          const editBtn = tableBody.querySelector(`.btn-edit-client[data-index="${idx}"]`);
          if (editBtn) editBtn.click();
        };
      }

      openModal();
    });
  }
}

function initSyncInstagramBtn() {
  const syncBtn = document.getElementById('btn-sync-instagram');
  if (!syncBtn) return;

  syncBtn.addEventListener('click', async () => {
    syncBtn.disabled = true;
    const origHtml = syncBtn.innerHTML;
    syncBtn.innerHTML = `
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" style="animation: rotate 1s linear infinite;"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
      <span>Scanning Feeds...</span>
    `;

    try {
      const res = await fetch('/api/instagram/check-now', { method: 'POST' });
      const data = await res.json();
      const detected = data?.result?.new_posts_detected || 0;
      if (detected > 0) {
        showToast(`Sync Complete: ${detected} new Instagram post(s) detected and alerts dispatched!`, 'success');
      } else {
        showToast('All client Instagram feeds are up-to-date. No new posts.', 'info');
      }
      await fetchPosts();
      await fetchMetrics();
    } catch (err) {
      showToast(`Instagram sync check failed: ${err.message}`, 'danger');
    } finally {
      syncBtn.disabled = false;
      syncBtn.innerHTML = origHtml;
    }
  });
}

// ==============================================================================
// 5. Test Facebook Post Simulation
// ==============================================================================
function initSimulateForm() {
  const form = document.getElementById('simulate-form');
  const resultBox = document.getElementById('simulation-result-box');
  const alertEl = document.getElementById('sim-alert');
  const titleEl = document.getElementById('sim-result-title');
  const detailsEl = document.getElementById('sim-result-details');
  const submitBtn = document.getElementById('btn-submit-simulation');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const clientSelect = document.getElementById('sim-select-client');
    const selectedOption = clientSelect.selectedOptions[0];
    const pageId = clientSelect.value;
    const caption = document.getElementById('sim-post-caption').value.trim();
    const postUrl = document.getElementById('sim-post-url').value.trim();

    if (!pageId) {
      showToast('Please select a client from the dropdown first.', 'warning');
      return;
    }

    const clientName = selectedOption ? selectedOption.getAttribute('data-name') : 'Client';
    const clientPhone = selectedOption ? selectedOption.getAttribute('data-phone') : '';
    const generatedPostId = `POST_${Date.now().toString().slice(-6)}`;

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span>Triggering Automation Pipeline...</span>';

    try {
      const res = await fetch('/api/alerts/facebook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          page_id: pageId,
          post_id: generatedPostId,
          caption: caption,
          post_url: postUrl,
          page_name: `${clientName} Page`
        })
      });

      const data = await res.json();
      resultBox.style.display = 'block';

      if (res.ok && data.status === 'success') {
        alertEl.className = 'diagnostic-alert success';
        titleEl.textContent = 'Workflow Executed: WhatsApp Alert Dispatched';
        detailsEl.innerHTML = `
          <strong>Pipeline:</strong> Channel Lookup ➔ Excel Directory ➔ WhatsApp Cloud API<br>
          <strong>Client Identified:</strong> ${escapeHtml(data.client || clientName)}<br>
          <strong>Recipient WhatsApp:</strong> ${escapeHtml(data.recipient_whatsapp || clientPhone)}<br>
          <strong>WhatsApp Message ID:</strong> <code style="font-family: var(--font-mono); color: #047857; background: #d1fae5; padding: 2px 6px; border-radius: 4px;">${escapeHtml(data.whatsapp_message_id || 'wamid.sent')}</code><br>
          <strong>Live Link Sent:</strong> <a href="${escapeHtml(data.post_url || postUrl)}" target="_blank" style="color: #4f46e5; text-decoration: underline; font-weight: 600;">${escapeHtml(data.post_url || postUrl)}</a>
        `;
        showToast(`Alert dispatched to ${data.recipient_whatsapp || clientPhone}!`, 'success');
        await refreshActivityData();
      } else {
        alertEl.className = 'diagnostic-alert danger';
        titleEl.textContent = 'Workflow Error';
        detailsEl.textContent = data.detail || data.message || 'An error occurred during workflow execution.';
        showToast('Workflow execution error', 'danger');
      }
    } catch (err) {
      resultBox.style.display = 'block';
      alertEl.className = 'diagnostic-alert danger';
      titleEl.textContent = 'Network or Server Error';
      detailsEl.textContent = `Could not communicate with backend: ${err.message}`;
      showToast(`Network Error: ${err.message}`, 'danger');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<span>Publish & Trigger WhatsApp Notification</span>';
    }
  });
}

// ==============================================================================
// 6. Settings & API Keys Management
// ==============================================================================
async function fetchSettings() {
  try {
    const res = await fetch('/api/settings');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    APP_STATE.settings = data;

    const phoneIdInput = document.getElementById('cfg-phone-id');
    const wabaIdInput = document.getElementById('cfg-waba-id');
    const tokenBadge = document.getElementById('token-status-badge');

    if (phoneIdInput && data.whatsapp_phone_number_id) {
      phoneIdInput.value = data.whatsapp_phone_number_id;
    }
    if (wabaIdInput && data.whatsapp_waba_id) {
      wabaIdInput.value = data.whatsapp_waba_id;
    }
    if (tokenBadge) {
      if (data.is_whatsapp_token_set) {
        tokenBadge.className = 'badge badge-success';
        tokenBadge.textContent = `Configured (${data.masked_whatsapp_token || 'Active'})`;
      } else {
        tokenBadge.className = 'badge badge-warning';
        tokenBadge.textContent = 'Not Configured';
      }
    }
  } catch (err) {
    console.warn('Could not load settings:', err);
  }
}

function initSettingsForm() {
  const form = document.getElementById('settings-form');
  const testBtn = document.getElementById('btn-test-wa-settings');
  const feedbackBox = document.getElementById('settings-feedback-box');
  const feedbackText = document.getElementById('settings-feedback-text');

  const showFeedback = (type, message) => {
    if (!feedbackBox || !feedbackText) return;
    feedbackBox.style.display = 'flex';
    feedbackBox.className = `diagnostic-alert ${type}`;
    feedbackText.innerHTML = message;
  };

  // Test WhatsApp Connection
  if (testBtn) {
    testBtn.addEventListener('click', async () => {
      const phoneId = document.getElementById('cfg-phone-id').value.trim();
      const token = document.getElementById('cfg-token').value.trim();
      const wabaId = document.getElementById('cfg-waba-id').value.trim();

      testBtn.disabled = true;
      testBtn.innerHTML = '<span>Verifying...</span>';
      showFeedback('warning', 'Connecting to Meta Graph API servers and inspecting token permissions...');

      try {
        const res = await fetch('/api/settings/test-whatsapp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            whatsapp_phone_number_id: phoneId,
            whatsapp_api_token: token,
            whatsapp_waba_id: wabaId
          })
        });

        const data = await res.json();

        if (data.success) {
          if (data.has_asset_assigned) {
            showFeedback('success', `<strong>Meta API Connected & Ready:</strong> Verified Name: <em>${escapeHtml(data.verified_name)}</em> | Number: <em>${escapeHtml(data.display_number)}</em> | Status: ${escapeHtml(data.status)}`);
            showToast('Meta WhatsApp connection verified!', 'success');
          } else {
            showFeedback('warning', `<strong>Token Valid, but Asset Not Assigned in Meta:</strong><br>${escapeHtml(data.message)}<br><strong>Action:</strong> In Meta Business Settings ➔ System Users ➔ Add Assets ➔ WhatsApp Accounts ➔ Assign '${escapeHtml(data.verified_name)}' with Full Control.`);
            showToast('Asset not assigned in Meta', 'warning');
          }
        } else {
          showFeedback('danger', `<strong>Verification Error (${escapeHtml(data.stage || 'Meta API')}):</strong> ${escapeHtml(data.message)}`);
          showToast('Meta connection test failed', 'danger');
        }
      } catch (err) {
        showFeedback('danger', `<strong>Network Error:</strong> Could not connect to backend test endpoint: ${escapeHtml(err.message)}`);
        showToast('Connection test error', 'danger');
      } finally {
        testBtn.disabled = false;
        testBtn.innerHTML = '<span>Test Connection</span>';
      }
    });
  }

  // Save Settings
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const saveBtn = document.getElementById('btn-save-cfg');
      saveBtn.disabled = true;
      saveBtn.innerHTML = '<span>Saving...</span>';

      const phoneId = document.getElementById('cfg-phone-id').value.trim();
      const wabaId = document.getElementById('cfg-waba-id').value.trim();
      const token = document.getElementById('cfg-token').value.trim();
      const slack = document.getElementById('cfg-slack') ? document.getElementById('cfg-slack').value.trim() : '';

      try {
        const res = await fetch('/api/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            whatsapp_phone_number_id: phoneId,
            whatsapp_waba_id: wabaId,
            whatsapp_api_token: token,
            whatsapp_verify_token: 'agency_wa_verify_token_2026',
            slack_webhook_url: slack
          })
        });

        const data = await res.json();

        if (res.ok) {
          showFeedback('success', '<strong>Saved:</strong> Settings updated successfully. Secrets are stored securely on the backend.');
          document.getElementById('cfg-token').value = ''; // clear token from DOM
          await fetchSettings();
          showToast('Meta configuration saved successfully!', 'success');
        } else {
          showFeedback('danger', `<strong>Save Failed:</strong> ${escapeHtml(data.detail || 'Could not save settings.')}`);
          showToast('Failed to save settings', 'danger');
        }
      } catch (err) {
        showFeedback('danger', `<strong>Network Error:</strong> ${escapeHtml(err.message)}`);
        showToast(`Network Error: ${err.message}`, 'danger');
      } finally {
        saveBtn.disabled = false;
        saveBtn.innerHTML = '<span>Save Configuration</span>';
      }
    });
  }
}

// ==============================================================================
// Utility: HTML Escaping
// ==============================================================================
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function safeUrl(url) {
  if (!url) return '#';
  try {
    const raw = String(url).trim();
    if (raw.startsWith('https://') || raw.startsWith('http://')) {
      return raw;
    }
  } catch (_) {}
  return '#';
}

// =====================================================
// IPR Platform - Core JS
// =====================================================

const API_BASE = '/api';

// ---- API CLIENT ----
const api = {
  token: () => localStorage.getItem('ipr_token'),

  headers() {
    const h = { 'Content-Type': 'application/json' };
    if (this.token()) h['Authorization'] = `Bearer ${this.token()}`;
    return h;
  },

  async request(method, path, body, isFormData = false) {
    const opts = { method, headers: isFormData ? { 'Authorization': `Bearer ${this.token()}` } : this.headers() };
    if (body) opts.body = isFormData ? body : JSON.stringify(body);
    const res = await fetch(API_BASE + path, opts);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
  },

  get: (path) => api.request('GET', path),
  post: (path, body) => api.request('POST', path, body),
  put: (path, body) => api.request('PUT', path, body),
  postForm: (path, formData) => api.request('POST', path, formData, true),
  delete: (path) => api.request('DELETE', path),
};

// ---- AUTH ----
const auth = {
  getUser() {
    const u = localStorage.getItem('ipr_user');
    return u ? JSON.parse(u) : null;
  },
  isLoggedIn() { return !!this.getUser() && !!api.token(); },
  logout() {
    localStorage.removeItem('ipr_token');
    localStorage.removeItem('ipr_user');
    window.location.href = '/pages/auth.html';
  },
  requireAuth() {
    if (!this.isLoggedIn()) window.location.href = '/pages/auth.html';
  },
  redirectIfLoggedIn() {
    if (this.isLoggedIn()) window.location.href = '/pages/dashboard.html';
  }
};

// ---- TOAST ----
const toast = {
  container: null,
  init() {
    this.container = document.getElementById('toast-container');
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'toast-container';
      this.container.className = 'toast-container';
      document.body.appendChild(this.container);
    }
  },
  show(message, type = 'info') {
    if (!this.container) this.init();
    const icons = { success: '✓', error: '✕', info: 'ℹ', warning: '⚠' };
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    t.innerHTML = `<span>${icons[type]}</span><span>${message}</span>`;
    this.container.appendChild(t);
    setTimeout(() => t.remove(), 3500);
  },
  success: (m) => toast.show(m, 'success'),
  error: (m) => toast.show(m, 'error'),
  info: (m) => toast.show(m, 'info'),
  warning: (m) => toast.show(m, 'warning'),
};
toast.init();

// ---- MODAL ----
const modal = {
  open(id) {
    const el = document.getElementById(id);
    if (el) el.classList.add('open');
    document.body.style.overflow = 'hidden';
  },
  close(id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove('open');
    document.body.style.overflow = '';
  },
  closeAll() {
    document.querySelectorAll('.modal-overlay.open').forEach(m => m.classList.remove('open'));
    document.body.style.overflow = '';
  }
};

// Close modal on overlay click
document.addEventListener('click', e => {
  if (e.target.classList.contains('modal-overlay')) modal.closeAll();
  if (e.target.classList.contains('modal-close') || e.target.dataset.closeModal) modal.closeAll();
});

// ---- SIDEBAR ----
function initSidebar() {
  const user = auth.getUser();
  if (!user) return;

  // Set user info
  const nameEl = document.getElementById('sidebar-user-name');
  const roleEl = document.getElementById('sidebar-user-role');
  const avatarEl = document.getElementById('sidebar-avatar');
  if (nameEl) nameEl.textContent = user.name;
  if (roleEl) roleEl.textContent = user.role?.replace(/_/g, ' ');
  if (avatarEl) avatarEl.textContent = user.name?.charAt(0).toUpperCase() || 'U';

  // Mobile hamburger
  const hamburger = document.getElementById('hamburger');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');

  if (hamburger && sidebar) {
    hamburger.addEventListener('click', () => {
      sidebar.classList.toggle('mobile-open');
      if (overlay) overlay.classList.toggle('open');
    });
  }

  if (overlay) {
    overlay.addEventListener('click', () => {
      sidebar.classList.remove('mobile-open');
      overlay.classList.remove('open');
    });
  }

  // Active nav
  const current = window.location.pathname.split('/').pop().replace('.html', '');
  document.querySelectorAll('.nav-item[data-page]').forEach(item => {
    if (item.dataset.page === current) item.classList.add('active');
    item.addEventListener('click', () => {
      const page = item.dataset.page;
      if (page === 'logout') { auth.logout(); return; }
      window.location.href = `/pages/${page}.html`;
    });
  });

  // Roles visibility
  const role = user.role;
  document.querySelectorAll('[data-roles]').forEach(el => {
    const allowed = el.dataset.roles.split(',');
    if (!allowed.includes(role)) el.style.display = 'none';
  });

  // Notifications
  loadNotifications();
}

// ---- NOTIFICATIONS ----
async function loadNotifications() {
  try {
    const notifs = await api.get('/notifications');
    const unread = notifs.filter(n => !n.is_read).length;
    const dot = document.querySelector('.notif-dot');
    if (dot) dot.style.display = unread > 0 ? 'block' : 'none';

    const list = document.getElementById('notif-list');
    if (list) {
      if (!notifs.length) {
        list.innerHTML = '<div class="empty-state" style="padding:2rem"><div class="empty-icon">🔔</div><p>No notifications</p></div>';
        return;
      }
      list.innerHTML = notifs.map(n => `
        <div class="notif-item ${!n.is_read ? 'unread' : ''}" onclick="markRead(${n.id})">
          <div class="notif-title">${n.title}</div>
          <div class="notif-msg">${n.message}</div>
          <div class="notif-time">${timeAgo(n.created_at)}</div>
        </div>
      `).join('');
    }
  } catch (e) {}
}

async function markRead(id) {
  try { await api.put(`/notifications/${id}/read`); loadNotifications(); } catch (e) {}
}

function toggleNotifPanel() {
  const panel = document.getElementById('notif-panel');
  if (panel) panel.classList.toggle('open');
}

// ---- HELPERS ----
function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatCurrency(amount) {
  if (!amount) return '₹0';
  return '₹' + Number(amount).toLocaleString('en-IN');
}

function statusBadge(status) {
  const map = {
    draft: 'badge-gray', active: 'badge-teal', under_review: 'badge-amber',
    approved: 'badge-green', rejected: 'badge-rose', completed: 'badge-purple',
    filed: 'badge-teal', expired: 'badge-gray', pending: 'badge-amber'
  };
  return `<span class="badge ${map[status] || 'badge-gray'}">${status?.replace(/_/g, ' ')}</span>`;
}

function iprTypeBadge(type) {
  const map = { patent: 'badge-purple', copyright: 'badge-teal', trademark: 'badge-amber', design: 'badge-green', trade_secret: 'badge-rose' };
  return `<span class="badge ${map[type] || 'badge-gray'}">${type}</span>`;
}

function progressBar(pct) {
  return `<div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>`;
}

function roleBadge(role) {
  const labels = { researcher: '🔬 Researcher', investor: '💼 Investor', ipr_professional: '⚖️ IPR Pro', admin: '🛡️ Admin' };
  return labels[role] || role;
}

// Animate numbers on page load
function animateNumber(el, target, duration = 1200) {
  let start = 0;
  const step = target / (duration / 16);
  const timer = setInterval(() => {
    start = Math.min(start + step, target);
    el.textContent = Math.floor(start).toLocaleString();
    if (start >= target) clearInterval(timer);
  }, 16);
}

// ---- SEARCH ----
function initSearch() {
  const searchInput = document.getElementById('global-search');
  if (searchInput) {
    searchInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        const val = searchInput.value.trim();
        if (val) window.location.href = `/pages/projects.html?search=${encodeURIComponent(val)}`;
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initSearch();
  // Stagger animations
  document.querySelectorAll('.stagger-1, .stagger-2, .stagger-3, .stagger-4').forEach(el => {
    el.classList.add('fade-in-up');
  });
});

// ─── SHARED LAYOUT COMPONENT ───────────────────────────────────────
// Renders sidebar + topbar for all dashboard pages

const IPR_APP = {
  currentUser: null,
  notifications: [],

  init() {
    this.loadUser();
    this.renderLayout();
    this.bindEvents();
    this.highlightActiveNav();
    this.loadNotifications();
    this.initToast();
  },

  loadUser() {
    const stored = localStorage.getItem('ipr_user');
    if (stored) {
      this.currentUser = JSON.parse(stored);
    } else {
      // Demo user
      this.currentUser = {
        id: 1,
        name: 'Dr. Priya Sharma',
        role: 'Researcher',
        email: 'priya.sharma@iit.ac.in',
        avatar: 'PS'
      };
      localStorage.setItem('ipr_user', JSON.stringify(this.currentUser));
    }
  },

  getNavItems() {
    const role = this.currentUser?.role || 'Researcher';
    const base = [
      { icon: '🏠', label: 'Dashboard', href: 'dashboard.html', id: 'dashboard' },
      { icon: '📂', label: 'Projects', href: 'projects.html', id: 'projects' },
      { icon: '⚖️', label: 'IPR Status', href: 'ipr.html', id: 'ipr' },
    ];

    if (role === 'Investor' || role === 'Admin') {
      base.push({ icon: '💰', label: 'Investor Hub', href: 'investor.html', id: 'investor' });
    }
    if (role === 'Admin') {
      base.push({ icon: '🛠️', label: 'Admin Panel', href: 'admin.html', id: 'admin', badge: '3' });
    }

    base.push(
      { section: 'Account' },
      { icon: '🔔', label: 'Notifications', href: '#notifications', id: 'notifs', badge: '5' },
      { icon: '👤', label: 'Profile', href: 'profile.html', id: 'profile' },
      { icon: '⚙️', label: 'Settings', href: 'settings.html', id: 'settings' },
    );

    if (role !== 'Investor') {
      base.splice(3, 0,
        { section: 'Collaboration' },
        { icon: '🤝', label: 'Investor Hub', href: 'investor.html', id: 'investor' },
      );
    }

    return base;
  },

  renderLayout() {
    const user = this.currentUser;
    const navItems = this.getNavItems();

    const navHtml = navItems.map(item => {
      if (item.section) {
        return `<div class="nav-section-label">${item.section}</div>`;
      }
      const badge = item.badge ? `<span class="nav-badge">${item.badge}</span>` : '';
      return `
        <a href="${item.href}" class="nav-item" data-id="${item.id}">
          <span class="nav-icon">${item.icon}</span>
          <span>${item.label}</span>
          ${badge}
        </a>`;
    }).join('');

    const sidebar = document.createElement('aside');
    sidebar.className = 'sidebar';
    sidebar.id = 'sidebar';
    sidebar.innerHTML = `
      <div class="sidebar-logo">
        <div class="logo-icon">⚖️</div>
        <div class="logo-text">IPR <span>Platform</span></div>
      </div>
      <nav class="sidebar-nav">${navHtml}</nav>
      <div class="sidebar-footer">
        <div class="user-card">
          <div class="user-avatar">${user.avatar || user.name.substring(0,2).toUpperCase()}</div>
          <div class="user-info">
            <div class="user-name">${user.name}</div>
            <div class="user-role">${user.role}</div>
          </div>
          <button onclick="IPR_APP.logout()" title="Logout" style="background:none;border:none;color:var(--slate);cursor:pointer;font-size:1rem;margin-left:auto;padding:4px;">🚪</button>
        </div>
      </div>
    `;

    const topbar = document.createElement('header');
    topbar.className = 'topbar';
    topbar.id = 'topbar';
    topbar.innerHTML = `
      <div class="topbar-left">
        <button class="menu-toggle" id="menuToggle" aria-label="Toggle menu">☰</button>
        <span class="page-title" id="pageTitle">Dashboard</span>
        <div class="search-bar topbar-search">
          <span class="search-icon">🔍</span>
          <input type="text" id="globalSearch" placeholder="Search projects, IPR, researchers..." />
        </div>
      </div>
      <div class="topbar-right">
        <div style="position:relative">
          <button class="icon-btn" id="notifBtn" title="Notifications">
            🔔
            <span class="badge" id="notifBadge">5</span>
          </button>
          <div class="notif-panel" id="notifPanel">
            <div class="notif-header">
              <h4>Notifications</h4>
              <button onclick="IPR_APP.clearNotifs()" style="background:none;border:none;color:var(--teal);cursor:pointer;font-size:0.75rem;">Mark all read</button>
            </div>
            <div id="notifList"></div>
          </div>
        </div>
        <a href="../index.html" class="icon-btn" title="Home">🏠</a>
        <div class="user-avatar" style="cursor:pointer" onclick="window.location='profile.html'" title="${user.name}">${user.avatar || user.name.substring(0,2).toUpperCase()}</div>
      </div>
    `;

    document.body.prepend(topbar);
    document.body.prepend(sidebar);

    // Background
    const bgMesh = document.createElement('div');
    bgMesh.className = 'bg-mesh';
    const bgGrid = document.createElement('div');
    bgGrid.className = 'bg-grid';
    document.body.prepend(bgGrid);
    document.body.prepend(bgMesh);
  },

  loadNotifications() {
    this.notifications = [
      { text: 'Patent #2024-001 status updated to "Under Review"', time: '2 mins ago', read: false },
      { text: 'Dr. Kumar accepted your project collaboration request', time: '1 hour ago', read: false },
      { text: 'New investor expressed interest in BioSensor Project', time: '3 hours ago', read: false },
      { text: 'Project "AI Diagnostics" approved by admin', time: 'Yesterday', read: true },
      { text: 'Trademark filing deadline in 7 days', time: '2 days ago', read: true },
    ];
    this.renderNotifs();
  },

  renderNotifs() {
    const list = document.getElementById('notifList');
    if (!list) return;
    const unread = this.notifications.filter(n => !n.read).length;
    const badge = document.getElementById('notifBadge');
    if (badge) badge.textContent = unread || '';

    list.innerHTML = this.notifications.map(n => `
      <div class="notif-item">
        <div class="notif-dot" style="${n.read ? 'background:var(--slate)' : ''}"></div>
        <div>
          <div class="notif-text">${n.text}</div>
          <div class="notif-time">${n.time}</div>
        </div>
      </div>
    `).join('');
  },

  clearNotifs() {
    this.notifications.forEach(n => n.read = true);
    this.renderNotifs();
  },

  bindEvents() {
    // Sidebar toggle
    document.getElementById('menuToggle')?.addEventListener('click', () => {
      const sidebar = document.getElementById('sidebar');
      const mainContent = document.querySelector('.main-content');
      const topbar = document.getElementById('topbar');
      const isMobile = window.innerWidth <= 768;

      if (isMobile) {
        sidebar.classList.toggle('mobile-open');
      } else {
        sidebar.classList.toggle('sidebar-collapsed');
        if (mainContent) {
          mainContent.style.marginLeft = sidebar.classList.contains('sidebar-collapsed') ? '70px' : 'var(--sidebar-width)';
        }
        if (topbar) {
          topbar.style.left = sidebar.classList.contains('sidebar-collapsed') ? '70px' : 'var(--sidebar-width)';
        }
      }
    });

    // Notifications panel
    document.getElementById('notifBtn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      document.getElementById('notifPanel')?.classList.toggle('active');
    });

    document.addEventListener('click', () => {
      document.getElementById('notifPanel')?.classList.remove('active');
    });

    // Global search
    document.getElementById('globalSearch')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const q = e.target.value.trim();
        if (q) window.location.href = `projects.html?search=${encodeURIComponent(q)}`;
      }
    });

    // Mobile overlay close
    document.addEventListener('click', (e) => {
      const sidebar = document.getElementById('sidebar');
      const toggle = document.getElementById('menuToggle');
      if (window.innerWidth <= 768 && sidebar?.classList.contains('mobile-open')) {
        if (!sidebar.contains(e.target) && !toggle?.contains(e.target)) {
          sidebar.classList.remove('mobile-open');
        }
      }
    });
  },

  highlightActiveNav() {
    const page = window.location.pathname.split('/').pop() || 'dashboard.html';
    document.querySelectorAll('.nav-item').forEach(item => {
      const href = item.getAttribute('href');
      if (href && href !== '#notifications' && page.includes(href.split('/').pop())) {
        item.classList.add('active');
      }
    });
  },

  logout() {
    localStorage.removeItem('ipr_user');
    window.location.href = '../pages/auth.html';
  },

  // ─── TOAST ────────────────────────────────────────
  initToast() {
    if (!document.getElementById('toast-container')) {
      const tc = document.createElement('div');
      tc.id = 'toast-container';
      document.body.appendChild(tc);
    }
  },

  toast(msg, type = 'success', duration = 3500) {
    const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
    const tc = document.getElementById('toast-container');
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    t.innerHTML = `<span class="toast-icon">${icons[type]}</span><span>${msg}</span>`;
    tc.appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateX(20px)'; setTimeout(() => t.remove(), 300); }, duration);
  },

  // ─── MODAL ────────────────────────────────────────
  openModal(id) {
    const m = document.getElementById(id);
    if (m) { m.classList.add('active'); document.body.style.overflow = 'hidden'; }
  },

  closeModal(id) {
    const m = document.getElementById(id);
    if (m) { m.classList.remove('active'); document.body.style.overflow = ''; }
  },

  // ─── API HELPERS ──────────────────────────────────
  async apiGet(endpoint) {
    try {
      const res = await fetch(`http://localhost:3000/api/${endpoint}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('ipr_token')}` }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('API call failed (using demo data):', err.message);
      return null;
    }
  },

  async apiPost(endpoint, data) {
    try {
      const res = await fetch(`http://localhost:3000/api/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('ipr_token')}`
        },
        body: JSON.stringify(data)
      });
      return await res.json();
    } catch (err) {
      console.warn('API call failed:', err.message);
      return null;
    }
  },

  // ─── FORMATTERS ───────────────────────────────────
  formatDate(d) {
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  },

  statusBadge(status) {
    const map = {
      'Approved': 'badge-approved',
      'Pending': 'badge-pending',
      'Under Review': 'badge-review',
      'Filed': 'badge-filed',
      'Rejected': 'badge-rejected',
      'Active': 'badge-active',
      'Inactive': 'badge-inactive',
    };
    return `<span class="badge ${map[status] || 'badge-pending'}">${status}</span>`;
  },

  // ─── CHARTS ───────────────────────────────────────
  renderDonut(canvasId, data, labels, colors) {
    const ctx = document.getElementById(canvasId)?.getContext('2d');
    if (!ctx) return;
    if (window.Chart) {
      new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels,
          datasets: [{ data, backgroundColor: colors, borderWidth: 0, hoverOffset: 6 }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: { color: '#8896B3', font: { family: 'DM Sans', size: 12 }, padding: 16, boxWidth: 12, borderRadius: 6 }
            }
          },
          cutout: '68%'
        }
      });
    }
  },

  renderBar(canvasId, labels, datasets) {
    const ctx = document.getElementById(canvasId)?.getContext('2d');
    if (!ctx) return;
    if (window.Chart) {
      new Chart(ctx, {
        type: 'bar',
        data: { labels, datasets },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { labels: { color: '#C4CDE4', font: { family: 'DM Sans' } } } },
          scales: {
            x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#8896B3' } },
            y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#8896B3' }, beginAtZero: true }
          }
        }
      });
    }
  },

  renderLine(canvasId, labels, datasets) {
    const ctx = document.getElementById(canvasId)?.getContext('2d');
    if (!ctx) return;
    if (window.Chart) {
      new Chart(ctx, {
        type: 'line',
        data: { labels, datasets },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { labels: { color: '#C4CDE4', font: { family: 'DM Sans' } } } },
          scales: {
            x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#8896B3' } },
            y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#8896B3' }, beginAtZero: true }
          },
          elements: { line: { tension: 0.4 }, point: { radius: 4, hoverRadius: 7 } }
        }
      });
    }
  }
};

// Auto-init
document.addEventListener('DOMContentLoaded', () => IPR_APP.init());

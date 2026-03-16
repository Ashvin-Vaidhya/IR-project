# 🔬 Centralized IPR & Project Management Platform

A full-stack web application for managing research projects and Intellectual Property Rights (IPR) — connecting Researchers, Investors, IPR Professionals, and Administrators on a single unified platform.

---

## 📁 Project Structure

```
ipr-platform/
├── frontend/                    # Static HTML/CSS/JS Frontend
│   ├── index.html               # Landing / Home Page
│   ├── css/
│   │   ├── home.css             # Public pages (landing, about, contact)
│   │   ├── auth.css             # Login / Register page styles
│   │   └── main.css             # Dashboard app styles
│   ├── js/
│   │   ├── app.js               # Shared layout: sidebar, topbar, utilities
│   │   └── main.js              # Additional helpers (if used standalone)
│   └── pages/
│       ├── auth.html            # Login & Registration
│       ├── dashboard.html       # Main Dashboard with charts
│       ├── projects.html        # Project Management (list + kanban)
│       ├── ipr.html             # IPR Status Tracker
│       ├── investor.html        # Investor Hub
│       ├── admin.html           # Admin Panel
│       ├── profile.html         # User Profile
│       ├── about.html           # About the Platform
│       └── contact.html         # Contact Page
│
└── backend/                     # Node.js + Express REST API
    ├── server.js                # Main Express server
    ├── .env                     # Environment variables (create from .env.example)
    ├── .env.example             # Environment template
    ├── package.json
    ├── config/
    │   ├── db.js                # MySQL connection pool
    │   └── schema.sql           # Database schema + seed data
    ├── middleware/
    │   └── auth.js              # JWT authentication middleware
    ├── routes/
    │   ├── auth.js              # POST /api/auth/login, /register
    │   ├── projects.js          # CRUD /api/projects + stats + documents
    │   ├── ipr.js               # CRUD /api/ipr + stats
    │   └── users.js             # /api/users, /notifications, /investments
    └── uploads/                 # Auto-created on server start
        ├── documents/           # Project document uploads
        └── ipr/                 # IPR document uploads
```

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** v18+ 
- **MySQL** 8.0+
- **npm** or **yarn**

---

### Step 1 — Database Setup

```bash
# Log into MySQL
mysql -u root -p

# Run the schema
source /path/to/ipr-platform/backend/config/schema.sql
```

This creates the `ipr_platform` database with all tables and sample data including 4 demo users.

---

### Step 2 — Backend Setup

```bash
cd ipr-platform/backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your MySQL credentials

# Start the server
npm start
# or for development with auto-reload:
npm run dev
```

Server runs at **http://localhost:5000**

---

### Step 3 — Frontend

The frontend is **static HTML** served directly by Express from the `frontend/` folder.

Open **http://localhost:5000** in your browser.

No build step required!

---

## 🔑 Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| 🛡️ Admin | admin@iprplatform.com | password |
| 🔬 Researcher | priya@research.in | password |
| 💼 Investor | raj@ventures.in | password |
| ⚖️ IPR Professional | sunita@iprlaw.in | password |

> Demo passwords use bcrypt hash of `password`. The seed in schema.sql uses a placeholder hash — update with `bcrypt.hash('password', 10)` for production.

---

## 🌐 API Reference

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login, returns JWT token |

### Projects
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects` | List all projects (role-filtered) |
| GET | `/api/projects/:id` | Get project details + team + IPR + docs |
| POST | `/api/projects` | Create project (researcher/admin) |
| PUT | `/api/projects/:id` | Update project |
| POST | `/api/projects/:id/documents` | Upload document |
| GET | `/api/projects/stats/overview` | Dashboard statistics |

### IPR Records
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/ipr` | List IPR records (role-filtered) |
| GET | `/api/ipr/:id` | Get IPR record details |
| POST | `/api/ipr` | Create IPR record (with optional file upload) |
| PUT | `/api/ipr/:id` | Update IPR record + triggers notification |
| GET | `/api/ipr/stats/overview` | IPR statistics |

### Users & Notifications
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | List all users (admin only) |
| PUT | `/api/users/:id/status` | Activate/deactivate user |
| GET | `/api/users/profile` | Current user's profile |
| GET | `/api/notifications` | Current user's notifications |
| PUT | `/api/notifications/:id/read` | Mark notification read |
| PUT | `/api/notifications/read-all` | Mark all read |
| GET | `/api/investments` | List investments (role-filtered) |
| POST | `/api/investments` | Submit investment (investors only) |

### All protected routes require header:
```
Authorization: Bearer <jwt_token>
```

---

## 🎨 Design System

| Token | Value | Usage |
|-------|-------|-------|
| `--navy` | `#0B1437` | Page background |
| `--navy-mid` | `#112057` | Sidebar, cards |
| `--teal` | `#00C9A7` | Primary accent, CTAs |
| `--gold` / `--amber` | `#F5A623` | Investment, warnings |
| `--rose` | `#FF6B8A` | Errors, urgent alerts |
| `--green` | `#06D6A0` | Success, approved |
| `--purple` | `#7B5EA7` | IPR professional accent |

**Fonts:**
- Display: `DM Serif Display` — headings, brand
- Body: `DM Sans` — all UI text
- Mono: `JetBrains Mono` — stats, codes, badges

---

## 👥 Role Permissions

| Feature | Researcher | Investor | IPR Pro | Admin |
|---------|-----------|---------|---------|-------|
| Create Projects | ✅ | ❌ | ❌ | ✅ |
| View All Projects | Own only | Public | ✅ | ✅ |
| File IPR | ✅ | ❌ | ✅ | ✅ |
| Update IPR Status | ❌ | ❌ | ✅ | ✅ |
| Submit Investment | ❌ | ✅ | ❌ | ✅ |
| Manage Users | ❌ | ❌ | ❌ | ✅ |
| Approve Projects | ❌ | ❌ | ❌ | ✅ |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Charts | Chart.js 4.x |
| Icons | Font Awesome 6.5 |
| Backend | Node.js 18+, Express 4.x |
| Database | MySQL 8.0 |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| File Uploads | Multer |
| ORM/Query | mysql2 (promise API) |

---

## 🔒 Security Features

- **JWT Authentication** — 24h token expiry
- **bcrypt password hashing** — salt rounds: 10
- **Role-based middleware** — every protected route checks role
- **File upload limits** — 10MB for docs, 20MB for IPR files
- **CORS configured** — restrict origins in production
- **SQL injection prevention** — parameterized queries via mysql2

---

## 📦 Production Deployment

```bash
# Set production env
NODE_ENV=production
JWT_SECRET=<long-random-secret>
DB_PASSWORD=<strong-password>

# Use PM2 for process management
npm install -g pm2
pm2 start server.js --name ipr-platform

# Or with nginx reverse proxy on port 80 → 5000
```

---

## 📄 License

MIT License — Free to use for educational and institutional purposes.

---

Built with ❤️ for India's Research & Innovation Ecosystem | Nagpur, Maharashtra

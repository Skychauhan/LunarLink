# 🌙 Lunar Link

> A private, internal WiFi code management portal built for seamless code distribution and tracking.

---

## Overview

**Lunar Link** is a lightweight, fully client-side web application that allows controlled distribution of WiFi access codes across multiple speed tiers. It features a clean, responsive UI with dark mode support, real-time Supabase backend integration, and a role-based access system.

This project is intended for **private, internal use only** and is not designed for public distribution.

---

## Features

- 🚀 **Multi-Speed Code Distribution** — Supports 16 Mbps, 20 Mbps, and 50 Mbps speed tiers
- 📊 **Admin Dashboard** — Upload code batches, monitor statistics, and manage inventory
- 🔍 **History & Search** — Full searchable log of all distributed codes with speed and batch filters
- 🌗 **Dark / Light Mode** — Persistent theme toggle across all pages
- 📱 **Fully Responsive** — Works on mobile, tablet, and desktop
- ☁️ **Supabase Backend** — Real-time cloud database for codes, history, batches, and stats
- 📁 **Batch Upload** — Supports CSV, TXT, and Excel (.xlsx / .xls) file uploads
- ⚠️ **Low Stock Alerts** — Automatic warnings when code inventory drops below threshold
- 🔒 **Session-Based Auth** — Secure session management with auto-expiry

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Styling | Custom CSS with CSS Variables (light/dark) |
| Database | [Supabase](https://supabase.com) (PostgreSQL) |
| Hosting | GitHub Pages |
| File Parsing | SheetJS (XLSX) |

---

## Project Structure

```
LunarLink/
├── index.html          # Login page
├── user.html           # User dashboard (code selection)
├── admin.html          # Admin dashboard (batch upload & stats)
├── history.html        # Code usage history
├── owner.html          # Owner information page
├── disclaimer.html     # Legal disclaimer page
│
├── main.css            # Global styles & CSS variables
├── login.css           # Login page specific styles
├── components.css      # Reusable UI components
│
├── config.js           # App configuration & settings
├── db.js               # Supabase client initialization
├── storage.js          # All database operations
├── auth.js             # Authentication & session management
├── theme.js            # Dark/light mode toggle
├── admin.js            # Admin dashboard logic
├── user.js             # User dashboard logic
├── history.js          # History page logic
│
└── README.md           # This file
```

---

## Database Schema

The app uses four Supabase tables:

**`codes`** — Stores available WiFi codes
| Column | Type | Description |
|--------|------|-------------|
| id | int | Auto-increment primary key |
| code | text | The WiFi code string |
| speed | text | Speed tier (16mbps / 20mbps / 50mbps) |
| batch | text | Batch name it was uploaded under |
| status | text | `unused` |
| added_on | timestamp | Upload timestamp |

**`history`** — Log of all used codes
| Column | Type | Description |
|--------|------|-------------|
| id | int | Auto-increment primary key |
| code | text | The used code |
| speed | text | Speed tier |
| batch | text | Source batch |
| used_on | timestamp | When it was used |

**`batches`** — Batch upload records
| Column | Type | Description |
|--------|------|-------------|
| id | int | Auto-increment primary key |
| batch_name | text | Name of the batch |
| speed | text | Speed tier |
| total_codes | int | Number of codes uploaded |
| uploaded_on | timestamp | Upload timestamp |

**`stats`** — Global statistics (single row, id = 1)
| Column | Type | Description |
|--------|------|-------------|
| total_codes_uploaded | int | Lifetime codes uploaded |
| codes_used | int | Total codes successfully used |
| yes_clicks | int | Count of "Yes, it worked" |
| no_clicks | int | Count of "No, try another" |
| batches_uploaded | int | Total batches uploaded |
| last_updated | timestamp | Last stats update |

---

## Setup & Deployment

### 1. Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Create the four tables as described in the schema above
3. Copy your **Project URL** and **Anon Key** from Project Settings → API
4. Update `db.js` with your credentials:

```js
var SUPABASE_URL = "your-project-url";
var SUPABASE_ANON_KEY = "your-anon-key";
```

### 2. GitHub Pages Deployment

1. Push all files to the **root** of your GitHub repository's `main` branch
2. Go to **Settings → Pages**
3. Set source to **Deploy from branch → main → / (root)**
4. Add an empty `.nojekyll` file to the repo root (prevents Jekyll from blocking files)
5. Your site will be live at `https://yourusername.github.io/repo-name/`

### 3. File Upload Format

When uploading code batches via the Admin Dashboard, prepare your file with **one code per row**:

```
ssf09fg
linio68
8ho8jfg
xyz123a
```

Supported formats: `.csv`, `.txt`, `.xlsx`, `.xls`

---

## Configuration

All app settings are in `config.js`:

```js
const AppConfig = {
    alerts: {
        lowCodeThreshold: 5,    // Warn when codes ≤ 5
        criticalThreshold: 2    // Critical alert when codes ≤ 2
    },
    auth: {
        sessionTimeout: 3600000 // Session expires after 1 hour
    }
};
```

---

## Pages

| Page | URL | Access |
|------|-----|--------|
| Login | `index.html` | Public |
| User Dashboard | `user.html` | Authenticated users |
| Admin Dashboard | `admin.html` | Admin only |
| History | `history.html` | Admin only |
| Owner Info | `owner.html` | Authenticated users |
| Disclaimer | `disclaimer.html` | Public |

---

## Disclaimer

Lunar Link is a **private internal project** provided "as is" without warranty of any kind. It is not intended for public use or commercial deployment. See [disclaimer.html](disclaimer.html) for full terms.

---

## License

Private project — All rights reserved © 2026 Lunar Link
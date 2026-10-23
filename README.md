# 🎓 Online Quiz & Examination Analytics System

A full-stack, enterprise-grade Online Quiz & Examination Analytics System engineered with **React**, **TypeScript**, **Tailwind CSS**, **Node.js/Express**, and **MonetDB 11.55.9** as its primary analytical column-store database.

---

## 🌟 Key Features & Capabilities

- **High-Performance Analytics with MonetDB**: Utilizes native columnar storage to aggregate exam results, item discrimination indices, and student mastery metrics in real-time.
- **Three Dedicated User Roles (RBAC)**:
  - **🛡️ Administrator**: User provisioning, academic subject catalog management, platform-wide audit analytics.
  - **👩‍🏫 Faculty / Teacher**: Question bank authoring (multi-tier difficulty), exam creation and scheduling, visual cohort analytics via Recharts (score distributions, pass/fail ratios, question difficulty heatmaps, student leaderboards).
  - **🎓 Student**: Timed online assessments, interactive question palette, live auto-save synchronization, post-exam instant feedback with detailed rationales, and historical performance tracking.
- **Academic Subject Catalog**:
  - `CS101`: Data Structures & Algorithms
  - `CS201`: Database Management Systems
  - `CS301`: Full-Stack Web Development
  - `MATH101`: Discrete Mathematics
  - `NOSQL`: NoSQL Database Systems (Document, Key-Value, Column-Family & Graph Databases)
- **Built-in Demo Accounts**:
  - **Faculty / Teacher**: `teacher@exam.com` / `teacher123` (**KARTHIKA NATARAJAN**)
  - **Student**: `student@exam.com` / `student123` (**M.Jeswanth Sai Eswar**)
  - **Administrator**: `admin@exam.com` / `admin123` (System Administrator)

---

## 🏗️ System Architecture

```
┌────────────────────────────────────────────────────────┐
│           Client Layer (React 18 + Vite)               │
│  Tailwind CSS • Recharts Analytics • Lucide React      │
│  Configurable API Client (VITE_API_URL)                │
└──────────────────────────┬─────────────────────────────┘
                           │ HTTP / REST (JWT Bearer Auth)
                           ▼
┌────────────────────────────────────────────────────────┐
│           API Server (Node.js + Express)               │
│  TypeScript • JWT Authentication • Role Middleware     │
│  Server-Side Exam Evaluation • SQL Parameterization    │
└──────────────────────────┬─────────────────────────────┘
                           │ Native MAPI Protocol (Port 50000)
                           ▼
┌────────────────────────────────────────────────────────┐
│           Database (MonetDB 11.55.9)                   │
│  High-Performance Columnar RDBMS                       │
│  8 Normalized Tables • ACID Transactions               │
└────────────────────────────────────────────────────────┘
```

### Normalized Database Schema in MonetDB:
1. `app_users`: User credentials, bcrypt hashes, roles (`admin`, `teacher`, `student`), account status. *(Note: Named `app_users` to respect MonetDB system table `sys.users`).*
2. `subjects`: Academic subjects and departmental course codes.
3. `questions`: Question bank items with question text, difficulty level, default marks, and explanation.
4. `question_options`: Multiple-choice options linked to questions with correct option flags.
5. `exams`: Exam configurations (title, duration in minutes, total marks, passing threshold, publish status).
6. `exam_questions`: Exam-to-question associations with custom sequence order and allocated marks.
7. `exam_attempts`: Student exam sessions with start time, server-enforced deadline, submission timestamp, total score, percentage, and pass/fail outcome.
8. `student_answers`: Granular student response records, correctness evaluations, and individual marks awarded.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, TypeScript, Vite, React Router 6, Tailwind CSS |
| **Data Visualization** | Recharts, Lucide React Icons |
| **Backend** | Node.js (v18+ or v20+), Express 4, TypeScript, tsx |
| **Database** | MonetDB 11.55.9 (Column-store, MAPI protocol) |
| **DB Driver** | `monetdb` (v2.2.0 native Node.js driver) |
| **Security & Auth** | JSON Web Tokens (`jsonwebtoken`), `bcryptjs`, RBAC middleware |
| **Validation** | Zod, UUID v4 |

---

## ⚙️ Prerequisites & MonetDB Setup

### 1. MonetDB 11.55.9 Installation
Ensure MonetDB is installed and running on your machine:
- **Default Port**: `50000`
- **Default Database**: `demo`
- **Default Superuser**: `monetdb`
- **Default Password**: `monetdb`

#### Verifying MonetDB on Windows:
- Ensure the MonetDB service is started via the Windows Services manager (`services.msc`), or launch MonetDB Server for your database:
  ```powershell
  # Using MonetDB command prompt or service manager
  monetdb start demo
  monetdb status demo
  ```
- To test connection via `mclient`:
  ```powershell
  mclient -u monetdb -d demo
  ```

### 2. Node.js & npm
- Node.js 18.0.0 or higher (Node 20+ LTS recommended)
- npm 9.0.0 or higher

---

## 🔐 Environment Variables

The project uses `.env` files for secure configuration. Copy the example templates before launching:

```bash
# Server configuration
cp server/.env.example server/.env

# Client configuration (optional if using defaults)
cp client/.env.example client/.env
```

### Backend (`server/.env`)
| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `PORT` | Port the Express server listens on | `5000` |
| `NODE_ENV` | Application environment (`development` / `production`) | `production` |
| `JWT_SECRET` | Secret key used for signing JWT tokens (use 32+ characters in production) | *Generated secure string* |
| `JWT_EXPIRES_IN` | Token expiration duration | `7d` |
| `MONETDB_HOST` | Host address of the MonetDB instance | `127.0.0.1` |
| `MONETDB_PORT` | MAPI protocol port of MonetDB | `50000` |
| `MONETDB_DATABASE`| Name of target MonetDB database | `demo` |
| `MONETDB_USER` | MonetDB username | `monetdb` |
| `MONETDB_PASSWORD`| MonetDB user password | `monetdb` |
| `CORS_ORIGIN` | Allowed CORS origins (comma-separated if multiple) | `http://localhost:3000` |

### Frontend (`client/.env`)
| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `VITE_API_URL` | Base API URL prefix for backend REST calls | `/api` |
| `VITE_BACKEND_URL` | Target server URL for Vite development reverse proxy | `http://localhost:5000` |

---

## 🚀 Quick Start (Development)

### 1. Install Dependencies
From the repository root:
```bash
npm run install:all
```
*(Or run `npm install` inside both `server/` and `client/` directories)*

### 2. Seed the Database
Initialize schema tables and seed default subjects, questions, exams, and demo users:
```bash
npm run seed
```

### 3. Run Development Servers
Open two terminal windows:

**Terminal 1 (Backend API):**
```bash
npm run server
# Starts Express backend on http://localhost:5000 with hot reload
```

**Terminal 2 (Frontend Client):**
```bash
npm run client
# Starts Vite React dev server on http://localhost:3000
```

Open **`http://localhost:3000`** in your browser.

---

## 📦 Production Build & Deployment

### 1. Building for Production
Run the unified build command from the root directory:
```bash
npm run build
```
This runs:
- `tsc` in `server/` -> outputs compiled JavaScript into `server/dist/`
- `tsc && vite build` in `client/` -> outputs minified static assets into `client/dist/`

### 2. Running the Production Backend
Start the compiled Node.js server:
```bash
npm start
# (Runs 'node dist/server.js' inside server/)
```

### 3. Serving the Frontend
You can serve the frontend (`client/dist`) using any production static file server or reverse proxy:

#### Option A: Nginx Reverse Proxy (Recommended for Linux/Cloud VMs)
```nginx
server {
    listen 80;
    server_name exam.yourdomain.com;

    # Serve React client build
    location / {
        root /var/www/exam-analytics/client/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # Proxy API calls to Express backend
    location /api/ {
        proxy_pass http://127.0.0.1:5000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

#### Option B: PM2 Process Management (Node.js Backend)
```bash
cd server
npm install -g pm2
pm2 start dist/server.js --name "exam-analytics-api"
pm2 save
pm2 startup
```

---

## 🔒 Security & Data Integrity

- **Strict Answer Key Masking**: The backend strictly strips `is_correct` flags and learning explanations from question payloads during active exam attempts.
- **Server-Side Grading**: Evaluation and scoring logic execute entirely on the server against MonetDB source-of-truth records when submitted.
- **Server-Enforced Timing**: Attempt countdowns are bounded by server timestamps in MonetDB. Overdue submissions automatically convert to `time_expired`.
- **SQL Parameterization**: Queries are sanitized through automated parameter escaping, defending against SQL injection.
- **Credential Protection**: Passwords are cryptographically hashed using `bcrypt` (10 salt rounds). Database credentials and secrets are kept strictly in `.env` files and never committed to version control.
- **Role-Based Access Control**: API endpoints enforce role checks (`admin`, `teacher`, `student`) via Express middleware before executing controller actions.

---

## 🐙 Pushing to GitHub

Follow these steps to publish this project to GitHub:

### Step 1: Initialize Git and Verify Staging
```bash
git status
```
Ensure that `.env` files are ignored and only `.env.example` templates are staged.

### Step 2: Commit All Prepared Files
```bash
git add .
git commit -m "feat: prepare project for production deployment and GitHub release"
```

### Step 3: Create a GitHub Repository
1. Log into your account on [GitHub](https://github.com/new).
2. Create a new repository named `exam-analytics-system` (choose Public or Private).
3. Do **not** initialize with a README, .gitignore, or license (we already have them).

### Step 4: Link Remote and Push
```bash
# Rename current branch to main (if preferred)
git branch -M main

# Add your GitHub remote repository URL
git remote add origin https://github.com/YOUR_USERNAME/exam-analytics-system.git

# Push the codebase
git push -u origin main
```

---

## 📄 License
This project is licensed under the ISC License.

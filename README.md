# React-Node-Project

A full-stack **React + Node.js + Express + Postgres + Redis + PM2 + Nginx + GitHub Actions + Docker + TypeScript** application with a clean separation of frontend and backend with **TypeScript** as the main language, CI/CD using **GitHub Actions**, local development with **Docker**, and production deployment on **Ubuntu with Nginx**.

---

## 📁 Project Structure

```text
.github/workflows
  ├── deploy-backend.yml
  └── deploy-frontend.yml

backend/            # Node.js backend service
frontend/           # React frontend (Vite)
docker/             # Local development Docker setup (Postgres, Redis)
docker-n8n/         # Production n8n Docker host used for automation

.gitignore
README.md
```

---

## 🚀 Frontend

**Tech Stack**

- React (Vite)
- pnpm
- Nginx (production)

### 🔧 Local Development

```bash
cd frontend
cp .env.example .env   # create and configure env file
pnpm install
pnpm run dev
```

The frontend will be available on the local Vite dev server.

### 🌐 Production

- Built via GitHub Actions (`deploy-frontend.yml`)
- Served using **Nginx** on an **Ubuntu server**
- Static files are deployed to `/var/www/react-app`

---

## 🧠 Backend

**Tech Stack**

- Node.js
- pnpm
- PostgreSQL
- Redis

### 🔧 Local Development

```bash
cd backend
cp .env.example .env   # create and configure env file
pnpm install
pnpm run dev
```

### 🌐 Production

- Deployed via GitHub Actions (`deploy-backend.yml`)
- Runs on **Ubuntu** (PM2 / Node runtime)
- Reverse-proxied by **Nginx**

---

## 🐳 Docker Setup

### ✅ Local Development (Database & Cache)

The `docker/` directory is used **only for local development** and includes:

- **PostgreSQL**
- **Redis**

```bash
cd docker
docker compose up -d
```

This allows the backend to run locally without installing Postgres or Redis on the host machine.

### 🏭 Production (n8n)

- The `docker-n8n/` directory is used for **production hosting of n8n**
- Completely separate from application services

---

## 🔁 CI/CD (GitHub Actions)

Located in `.github/workflows`:

- `deploy-frontend.yml`

  - Pulls latest code
  - Installs dependencies
  - Builds frontend
  - Deploys to Nginx root

- `deploy-backend.yml`

  - Pulls latest code
  - Installs dependencies
  - Builds backend
  - Restarts backend service

Deployments are triggered automatically on push to the main branch.

---

## 🖥️ Server Setup

- **OS:** Ubuntu
- **Web Server:** Nginx
- **Frontend:** Served as static files via Nginx
- **Backend:** Node.js app behind Nginx reverse proxy
- **Databases:**

  - Local ( Development ) → Docker (Postgres, Redis)
  - Production → ( Postgres -> Supabase) ( Redis -> Redis IO ) ( N8N -> Backend Service for Automation )

---

## 📌 Notes

- `.env` files are required

---

## 🧪 Getting Started (Quick Start)

```bash
# Clone repository
git clone <repo-url>
cd React-Node-Project

# Start local databases
cd docker
docker compose up -d

# Run backend
cd ../backend
pnpm install
pnpm run dev

# Run frontend
cd ../frontend
pnpm install
pnpm run dev
```

---

## 📄 License

MIT License

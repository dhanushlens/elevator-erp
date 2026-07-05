# Elevator Service Management System (ERP)

A production-ready, full-stack ERP for elevator service companies: customers, companies, elevators, technicians, services, salaries, attendance, invoices, reports, analytics, notifications, calendar and audit — with a premium Apple-inspired UI (glassmorphism, aqua/mint theme, dark mode, Framer Motion animations).

## Tech Stack

| Layer    | Technology |
|----------|------------|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS, Framer Motion, TanStack Query, React Hook Form + Zod, Recharts, Lucide Icons, Axios |
| Backend  | Node.js, Express, Mongoose, JWT (access + refresh), bcrypt, Helmet, CORS, express-rate-limit, express-mongo-sanitize, Morgan, Multer |
| Database | MongoDB (Atlas-ready) |
| Deploy   | Vercel (frontend) · Render (backend) · MongoDB Atlas (database) |

## Features

- **Authentication** — register/login/logout, JWT access + refresh tokens, forgot/reset password, role-based authorization (admin / technician / employee), session validation, audit trail.
- **Customers & Companies** — full CRUD, per-customer view (elevators, services, invoices, AMC/warranty, pending payments, visit timeline), per-company history with timeline & calendar views.
- **Elevators** — CRUD with QR code, AMC/warranty tracking, assigned technician, service history.
- **Technicians** — CRUD, performance charts, attendance calendar, salary/advance summary, assigned/upcoming/completed jobs.
- **Services** — CRUD with parts used, before/after photos, signature, status history, monthly calendar.
- **Salary & Attendance** — salary records with advance settlement, printable salary slips, advance payments, monthly attendance grid.
- **Invoices** — line items, tax/discount, payment recording, printable invoice.
- **Reports** — 11 report types × 12 date-range presets (today → lifetime + custom), export to CSV / Excel / PDF, print.
- **Dashboard & Analytics** — live stats, revenue/growth/performance/complaint charts.
- **Global search (⌘K)**, automatic notifications, dark/light mode, responsive layout, professional printing.

## Project Structure

```
elevator-erp/
├── backend/          # Express REST API
│   ├── config/       # DB connection
│   ├── controllers/  # Route handlers (reusable CRUD factory)
│   ├── middleware/   # auth, audit, error handling, uploads
│   ├── models/       # 16 Mongoose models
│   ├── routes/       # /api/* routers
│   ├── utils/        # APIFeatures, tokens, date ranges, seed script
│   └── uploads/      # Uploaded files
└── frontend/         # Next.js app
    ├── app/          # App Router pages ((auth) + (app) groups)
    ├── components/   # layout + ui components
    ├── context/      # Auth + Theme
    ├── hooks/        # useCrud, useDebounce, ...
    ├── lib/          # axios API client
    ├── types/        # shared TypeScript types
    └── utils/        # format + export/print helpers
```

## Getting Started (Local)

Prerequisites: Node 18+, a MongoDB instance (local or Atlas).

```bash
# 1. Backend
cd backend
cp .env.example .env          # edit MONGODB_URI, JWT secrets
npm install
node utils/seed.js            # seeds admin user + sample data
npm run dev                   # http://localhost:5000

# 2. Frontend (new terminal)
cd frontend
cp .env.example .env.local    # NEXT_PUBLIC_API_URL=http://localhost:5000/api
npm install
npm run dev                   # http://localhost:3000
```

Default seeded admin: `admin@example.com` / `Admin@12345` (override with `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`).

## Documentation

- [DEPLOYMENT.md](./DEPLOYMENT.md) — MongoDB Atlas, Render and Vercel deployment guide.
- [API.md](./API.md) — REST API reference.

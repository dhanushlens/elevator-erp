# API Reference

Base URL: `http://localhost:5000/api` (or your Render URL + `/api`).

All endpoints (except `/auth/*` and `/health`) require `Authorization: Bearer <accessToken>`.

Responses follow: `{ "success": true, "data": ..., "total": n, "page": n, "pages": n }` (list metadata on list endpoints). Errors: `{ "success": false, "message": "..." }`.

## List query parameters (all list endpoints)

| Param | Example | Description |
|-------|---------|-------------|
| `page`, `limit` | `?page=2&limit=20` | Pagination |
| `sort` | `?sort=-createdAt` | Sort (prefix `-` for desc) |
| `search` | `?search=acme` | Text search across module-specific fields |
| `fields` | `?fields=name,phone` | Field selection |
| any model field | `?status=completed` | Exact-match filtering; operators supported: `?cost[gte]=1000` |

## Auth — `/auth`

| Method | Path | Body / Notes |
|--------|------|--------------|
| POST | `/auth/register` | `{ name, email, password, role? }` |
| POST | `/auth/login` | `{ email, password }` → `{ user, accessToken, refreshToken }` |
| POST | `/auth/refresh` | `{ refreshToken }` → new token pair |
| POST | `/auth/logout` | Invalidates refresh token |
| GET | `/auth/me` | Current user (session validation) |
| PATCH | `/auth/update-password` | `{ currentPassword, newPassword }` |
| POST | `/auth/forgot-password` | `{ email }` → reset token (returned in dev; email in prod) |
| POST | `/auth/reset-password/:token` | `{ password }` |

## Core CRUD modules

Standard REST for each: `GET /`, `POST /`, `GET /:id`, `PATCH /:id`, `DELETE /:id` (delete is admin-only).

| Module | Base path | Extra endpoints |
|--------|-----------|-----------------|
| Customers | `/customers` | `GET /customers/:id/overview` — elevators, services, invoices, AMC/warranty, pending payments, timeline |
| Companies | `/companies` | `GET /companies/:id/history` — visits, totals, timeline |
| Elevators | `/elevators` | `GET /elevators/:id/service-history` — full service history |
| Technicians | `/technicians` | `GET /technicians/:id/overview` — salary, advances, attendance, jobs, performance |
| Services | `/services` | `GET /services/calendar?month=&year=&technician=` · `GET /services/:id/history` |
| Salary | `/salary` | `GET /salary/:id/slip` · `GET/POST /salary/advances` · `PATCH/DELETE /salary/advances/:id` · `POST /salary/notify-due` |
| Attendance | `/attendance` | `GET /attendance/monthly?month=&year=` |
| Invoices | `/invoices` | `POST /invoices/:id/payment` `{ amount }` |
| Users | `/users` (admin) | `GET /users/activity-logs` · `GET /users/audit-logs` · `GET/PATCH /users/settings` |

## Dashboard — `/dashboard`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/dashboard/stats` | Totals, revenue, pending payments, expiring AMC/warranty, charts, recent activity |
| GET | `/dashboard/analytics` | Growth, technician performance, service/complaint types, salary expenses, AMC revenue |
| GET | `/dashboard/search?q=` | Global search across customers, companies, elevators, technicians, invoices, services |

## Reports — `/reports`

`GET /reports/:type?range=<preset>&from=&to=&save=true`

- **Types**: `customers`, `companies`, `elevators`, `services`, `technicians`, `salary`, `attendance`, `payments`, `revenue`, `amc`, `warranty`
- **Range presets**: `today`, `yesterday`, `this-week`, `last-week`, `this-month`, `last-month`, `3-months`, `6-months`, `1-year`, `3-years`, `lifetime`, `custom` (with `from`/`to`)
- `GET /reports/saved` — previously saved report metadata

## Notifications — `/notifications`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/notifications` | List (`?unread=true` filter) |
| PATCH | `/notifications/:id/read` | Mark one read |
| PATCH | `/notifications/read-all` | Mark all read |
| POST | `/notifications/generate` | (admin) Generate automatic alerts: upcoming services, AMC/warranty expiry, salary due, pending payments |

## Uploads — `/uploads`

`POST /uploads` — multipart form (`files` field, up to 10 files ≤5 MB: images/PDF) → `{ urls: [...] }`. Files served at `/uploads/<name>`.

# Connected Worker – JSA/JSO Safety Platform

A full-stack MVP for Job Safety Assessment (JSA) and Job Safety Observation (JSO) management, inspired by connected worker platforms.

## Architecture

| Layer | Technology |
|-------|-----------|
| Frontend | Angular 21, SCSS, standalone components |
| Backend | Node 20, TypeScript, Express 5 |
| Database | PostgreSQL 16+ via Prisma ORM |
| Auth | JWT with role-based access (Technician, Supervisor, HSE, Admin) |
| Email | MailHog (dev SMTP) |
| Containers | Docker Compose |

## Quick Start (Docker)

```bash
docker compose up --build
```

| Service | URL |
|---------|-----|
| UI | http://localhost:4200 |
| API | http://localhost:3000/api |
| MailHog | http://localhost:8025 |

After containers are up, seed the database:

```bash
docker compose exec api npx prisma db seed
```

## Quick Start (Local Dev)

### Prerequisites
- Node 20+
- PostgreSQL 16+
- A database named `anvldevin` (user: postgres, password: postgres)

### Backend

```bash
cd api
cp .env.example .env
npm install
npx prisma generate --schema prisma/schema.prisma
npx prisma migrate dev --schema prisma/schema.prisma
npx prisma db seed
npm run dev
```

API runs at http://localhost:3000

### Frontend

```bash
cd ui
npm install
npx ng serve
```

UI runs at http://localhost:4200

## Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@connected-worker.local | Password123! |
| Supervisor | supervisor@connected-worker.local | Password123! |
| HSE | hse@connected-worker.local | Password123! |
| Technician | tech1@connected-worker.local | Password123! |
| Technician | tech2@connected-worker.local | Password123! |

## Key Features

### Technician
- Create/edit JSAs with job info, hazards, mitigations, PPE checklist
- Raise flags (request assistance, safety concerns)
- Stop-job with reason and severity (auto-creates JSO task)

### Supervisor / HSE
- Dashboard with live queue of JSAs, flags, stop-jobs
- Review, approve, or reject JSAs with comments
- JSA Strength Score (rules-based, 1-5)
- Complete JSO investigations (root cause, corrective/preventive actions)

### Rules Engine
- Configurable hazard catalog with category-specific mitigations
- PPE requirements per hazard type
- LOTO enforcement for electrical/confined-space hazards
- Strength score calculation with weighted criteria

### Audit & Security
- JWT authentication with role-based guards
- Full audit trail for all record changes
- Immutable approved record snapshots

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/auth/login | Login |
| POST | /api/auth/register | Register user |
| GET | /api/auth/me | Current user profile |
| GET | /api/jsas | List JSAs |
| POST | /api/jsas | Create JSA |
| GET | /api/jsas/:id | Get JSA detail |
| POST | /api/jsas/:id/submit | Submit for review |
| POST | /api/jsas/:id/approve | Approve JSA |
| POST | /api/jsas/:id/reject | Reject JSA |
| POST | /api/jsas/:id/close | Close JSA |
| POST | /api/events/flag | Create flag |
| POST | /api/events/stop-job | Create stop-job |
| GET | /api/jsos | List JSOs |
| POST | /api/jsos/:id/start | Start JSO work |
| POST | /api/jsos/:id/complete | Complete JSO |
| GET | /api/reports/dashboard | Dashboard data |
| GET | /api/reports/export | Export records |

## Project Structure

```
ANVLDevin/
├── docs/                  # Phase 1 requirements documents
│   ├── requirements_draft.md
│   ├── data_model.md
│   ├── api-outline.md
│   ├── fit_gap.md
│   └── open_questions.md
├── api/                   # Express backend
│   ├── prisma/            # Schema & migrations
│   ├── src/
│   │   ├── config/        # App configuration
│   │   ├── middleware/     # Auth, error handling, upload
│   │   ├── routes/        # API route handlers
│   │   ├── rules/         # Scoring & hazard config
│   │   ├── services/      # Business logic
│   │   └── utils/         # Helpers
│   └── Dockerfile
├── ui/                    # Angular frontend
│   ├── src/app/
│   │   ├── auth/          # Login component
│   │   ├── dashboard/     # Dashboard component
│   │   ├── guards/        # Auth & role guards
│   │   ├── jsa/           # JSA list, create, detail
│   │   ├── jso/           # JSO list, detail
│   │   ├── models/        # TypeScript interfaces
│   │   ├── services/      # API & auth services
│   │   └── shared/        # Layout component
│   └── Dockerfile
├── docker-compose.yml
└── .github/workflows/ci.yml
```

## MVP Scope & Deferred

See [docs/fit_gap.md](docs/fit_gap.md) for the full feature matrix.

**Included**: JSA CRUD, hazard/mitigation management, PPE checklist, flags, stop-job escalation, JSO workflow, strength scoring, role-based access, audit trail, dashboard, email notifications via MailHog.

**Deferred**: Offline-first PWA sync, real SMS/email, SSO/LDAP, S3 file storage, voice-to-text, geolocation, advanced analytics, mobile-optimized views.

# Stampley V2 — AIDES-T2D Study Portal

**Stampley V2** is a web application for the **AIDES-T2D** research study (*AI-Driven Emotional Support for Type 2 Diabetes*). It gives participants a guided daily check-in experience, a Diabetes Distress Scale (DDS) onboarding survey, and an AI companion (“Stampley”) tailored to their distress domain. Administrators manage study keys, users, safety signals, and analytics.

Built with **Next.js 16** (App Router), **React 19**, **TypeScript**, **Tailwind CSS v4**, **Prisma 7** (`@prisma/adapter-pg`) on **Neon PostgreSQL**, **NextAuth.js v5**, **Resend**, and **OpenAI**.

---

## Table of contents

1. [Features overview](#features-overview)
2. [Tech stack](#tech-stack)
3. [Project structure](#project-structure)
4. [Application routes](#application-routes)
5. [Participant journey](#participant-journey)
6. [Check-in flow (5 steps)](#check-in-flow-5-steps)
7. [DDS survey](#dds-survey)
8. [Stampley AI](#stampley-ai)
9. [Admin portal](#admin-portal)
10. [Authentication & authorization](#authentication--authorization)
11. [Database](#database)
12. [Server actions & API routes](#server-actions--api-routes)
13. [State management](#state-management)
14. [UI & design system](#ui--design-system)
15. [Environment variables](#environment-variables)
16. [Local development](#local-development)
17. [Database setup (Neon PostgreSQL)](#database-setup-neon-postgresql)
18. [Deployment (Vercel + Neon)](#deployment-vercel--neon)
19. [Scripts](#scripts)
20. [Notes & legacy / duplicate files](#notes--legacy--duplicate-files)

---

## Features overview

| Area | Description |
|------|-------------|
| **Marketing home** | Public landing page with hero, diabetes education sections, banner, how-it-works, and on-demand content |
| **About** | Public about page |
| **Auth** | Register (study key required), login, forgot password, reset password |
| **DDS** | 17-item Diabetes Distress Scale; scores saved to Postgres; domain recommendation |
| **Dashboard** | Participant home: progress, domain focus, charts, link to daily check-in |
| **Check-in** | Multi-step flow: metrics → context → narrative → weekly domain → Stampley support |
| **Stampley** | GPT-4o–generated supportive responses based on check-in data and domain/subscale |
| **Safety** | Flags consecutive high distress (≥9) for escalation |
| **Admin** | Keys, users, dashboard metrics, analytics charts, safety monitoring |

---

## Tech stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16.2.3 (App Router, Turbopack in dev/build) |
| UI | React 19, Tailwind CSS 4, Framer Motion, Lucide React, React Icons |
| Charts | Recharts |
| Auth | next-auth 5 (Credentials provider) |
| Database | Neon PostgreSQL via Prisma 7 + `@prisma/adapter-pg` + `pg` |
| Passwords | bcryptjs |
| Email | Resend |
| AI | OpenAI API (`gpt-4o`) |
| Client state | Zustand (`checkin-store`) |
| Hosting (target) | Vercel + Neon |

---

## Project structure

```
stampley-v2/
├── app/                          # Next.js App Router pages & API
│   ├── (auth)/                   # login, register, forgot/reset password
│   ├── about/                    # public about page
│   ├── admin/                    # admin-only pages (layout enforces ADMIN role)
│   ├── api/                      # Route handlers (auth, check-in, stampley)
│   ├── check-in/                 # participant check-in wizard
│   ├── dashboard/                # participant dashboard
│   ├── survey/dds/               # DDS survey + results
│   ├── layout.tsx                # root layout (nav, footer, AuthProvider)
│   ├── page.tsx                  # marketing home
│   └── globals.css
├── actions/                      # Server Actions ("use server")
│   ├── admin.ts                  # keys, users
│   ├── dds.ts                    # DDS submit, domain confirm
│   ├── password-reset.ts
│   └── register.ts
├── components/
│   ├── admin/                    # admin shell, tables, forms, charts nav
│   ├── auth/                     # SessionProvider wrapper
│   ├── charts/                   # Recharts used on dashboard/admin
│   ├── check-in/                 # sidebar, Stampley support UI (large chat component)
│   ├── daily-metrics/            # glucometer, bio monitor, wellness radar
│   ├── home/                     # landing page sections (Hero, MenuBar, Footer, etc.)
│   ├── stampley/                 # conversation sidebar
│   └── ui/                       # shared UI (orbs, voice containers, domain cards)
├── lib/
│   ├── auth.ts                   # NextAuth handlers + credentials authorize
│   ├── auth.config.ts            # shared callbacks, authorized() for middleware
│   ├── prisma.ts                 # PrismaClient singleton + PrismaPg adapter
│   ├── dds-scoring.ts            # DDS domain score calculation
│   ├── email.ts                  # Resend password-reset and study-key emails
│   ├── schema.sql                # historical SQL (reference only)
│   └── stampley-prompt.ts        # OpenAI prompt builder for Stampley
├── store/
│   ├── checkin-store.ts          # Zustand: in-progress check-in fields
│   └── conversation-storage.ts   # localStorage helpers for Stampley chat history
├── types/
│   └── next-auth.d.ts            # session user id + role typing
├── public/                       # images, videos, logos
├── prisma/                       # schema.prisma + Prisma Migrate history
├── prisma7.config.ts             # Prisma 7 CLI datasource config
├── middleware.ts                 # Auth.js middleware (protected route matcher)
├── amplify.yml                   # leftover AWS Amplify config (not used by Vercel)
├── package.json
└── README.md
```

---

## Application routes

### Public

| Route | Purpose |
|-------|---------|
| `/` | Marketing home (`app/page.tsx` + `components/home/*`) |
| `/about` | About page |
| `/login` | Sign in |
| `/register` | Register with study key |
| `/forgot-password` | Request reset email |
| `/reset-password` | Set new password from token |

### Participant (login required; middleware protects `/dashboard`, `/check-in`, DDS results)

| Route | Purpose |
|-------|---------|
| `/dashboard` | Participant home; redirects to DDS if not completed |
| `/survey/dds` | 17-question DDS survey |
| `/survey/dds/results` | Scores + confirm focus domain |
| `/check-in` | Check-in entry |
| `/check-in/daily-metrics` | Step 1: distress, mood, energy |
| `/check-in/contextual-factors` | Step 2: context tags |
| `/check-in/clinical-narrative` | Step 3: reflection + coping |
| `/check-in/weekly-domain` | Step 4: weekly focus domain |
| `/check-in/stampley-support` | Step 5: submit check-in + Stampley AI |
| `/check-in/chat` | Additional chat route (if used) |

### Admin (login + `role === 'ADMIN'`)

| Route | Purpose |
|-------|---------|
| `/admin` | Admin entry redirect |
| `/admin/dashboard` | Overview stats |
| `/admin/keys` | Generate/delete study keys |
| `/admin/users` | List/create/delete users, toggle roles |
| `/admin/analytics` | Participation & domain analytics |
| `/admin/safety` | High-distress / escalation monitoring |

### API

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/auth/[...nextauth]` | * | NextAuth handlers |
| `/api/check-in/submit` | POST | Persist daily check-in + update study progress |
| `/api/stampley/generate` | POST | OpenAI Stampley response JSON |
| `/api/debug` | GET | Health check for env vars (no secrets exposed) |

---

## Participant journey

1. **Register** at `/register` with email, password, and a valid **study key** (`study_keys` table, single-use).
2. **Log in** at `/login` (credentials → `users` table, bcrypt verify).
3. **Complete DDS** at `/survey/dds` (17 items, 1–6 scale) → saved to `dds_responses`.
4. **Confirm domain** at `/survey/dds/results` → updates `dds_responses.confirmed_domain` and seeds `user_weekly_domains` + `user_study_progress`.
5. **Dashboard** at `/dashboard` — blocked until DDS row exists and domain is confirmed.
6. **Daily check-in** via `/check-in/*` — client state in Zustand until final submit.
7. **Submit** on Stampley step → `POST /api/check-in/submit` then `POST /api/stampley/generate`.

---

## Check-in flow (5 steps)

Defined in `app/check-in/constants/navigation.ts`:

| Step | Path | Data collected |
|------|------|----------------|
| 1 Daily Metrics | `/check-in/daily-metrics` | `distress`, `mood`, `energy` (0–10) |
| 2 Contextual Factors | `/check-in/contextual-factors` | `contextTags` (JSON array) |
| 3 Clinical Narrative | `/check-in/clinical-narrative` | `reflection`, `copingAction` |
| 4 Weekly Domain | `/check-in/weekly-domain` | `domain` (Emotional, Regimen, Physician, Interpersonal) |
| 5 Stampley Support | `/check-in/stampley-support` | Submit + AI conversation |

**Layout:** `app/check-in/layout.tsx` requires auth, shows collapsible step sidebar (`components/check-in/CollapsibleSidebar.tsx`, `StepSidebar.tsx`).

**Submit API** (`app/api/check-in/submit/route.ts`):

- Resolves `domain` from body, or falls back to `user_weekly_domains` / `dds_responses.confirmed_domain`.
- Computes `week_number` / `day_number` from `user_study_progress.study_start_date`.
- Picks **subscale** from a rotating map per domain and day (e.g. Emotional → “Feeling Overwhelmed”, …).
- Inserts into `check_in_submissions`.
- Updates `user_study_progress` (total check-ins, consecutive high distress).
- Returns `needsSafetyEscalation` when distress ≥ 9 for 2 consecutive days.

---

## DDS survey

- **UI:** `app/survey/dds/page.tsx` (client component, 17 questions grouped by domain).
- **Submit:** Server Action `submitDDS` in `actions/dds.ts` → `INSERT`/`UPDATE` on `dds_responses` (one row per `user_id`).
- **Scoring:** `lib/dds-scoring.ts` — averages per domain; `recommended_domain` = highest subscale mean.
- **Results:** `app/survey/dds/results/page.tsx` loads scores; `confirmDomain` in `actions/dds.ts` sets confirmed domain and week-1 focus.

**Important:** `dds_responses` is required at runtime but is **not** included in `lib/schema.sql` in this repo. Your database must have this table (see [Database](#database)).

---

## Stampley AI

1. **Prompt:** `lib/stampley-prompt.ts` builds a structured prompt from check-in fields, domain, subscale, day/week, and domain-specific micro-skills.
2. **API:** `app/api/stampley/generate/route.ts` — authenticated POST, calls OpenAI `gpt-4o`, expects JSON with: `greeting`, `validation`, `reflection_question`, `micro_skill`, `education_chip`, `closure`.
3. **UI implementations:**
   - `app/check-in/stampley-support/page.tsx` — simpler flow (submit → generate → display).
   - `components/check-in/stampley-support/page.tsx` — richer chat UI with sidebar and `store/conversation-storage.ts` (browser localStorage).
4. **Voice / experimental:** `app/check-in/hooks/useElevenLabs.ts`, `useAudioAnalyser.ts`, and `components/ui/StampleyVoiceAgent.tsx` support voice-oriented UX (optional).

---

## Admin portal

Wrapped by `app/admin/layout.tsx` (ADMIN-only) and `components/admin/admin-app-shell.tsx`.

| Feature | Implementation |
|---------|----------------|
| Study keys | `actions/admin.ts` → `generateStudyKey`, `deleteStudyKey` |
| Users | `createUser`, `deleteUser`, `toggleUserRole` |
| Dashboard | Aggregates counts from `users`, `study_keys`, `check_in_submissions` |
| Analytics | Charts in `components/charts/*` |
| Safety | Queries check-ins with high distress / escalation flags |

Admins can also add users via `components/admin/add-user-form.tsx` (inline server action).

---

## Authentication & authorization

| File | Role |
|------|------|
| `lib/auth.ts` | NextAuth instance: Credentials provider, DB lookup, bcrypt |
| `lib/auth.config.ts` | JWT/session callbacks; `authorized()` for route protection |
| `middleware.ts` | Re-exports `auth` as middleware; matcher for dashboard, admin, check-in, DDS results |
| `components/auth/auth-provider.tsx` | Client `SessionProvider` |
| `types/next-auth.d.ts` | Extends session with `id`, `role` (`ADMIN` \| `PARTICIPANT`) |

**Roles:**

- `PARTICIPANT` — study flow, dashboard, check-in.
- `ADMIN` — `/admin/*` only (non-admins redirected to `/dashboard`).

**Secrets:** `AUTH_SECRET` or `NEXTAUTH_SECRET`; dev fallback in `resolveAuthSecret()` when not in production.

---

## Database

**Runtime:** `lib/prisma.ts` — Prisma 7 `PrismaClient` with `@prisma/adapter-pg` (`PrismaPg`) from `DATABASE_URL`.

**Schema:** `prisma/schema.prisma` is the current schema. Apply it with Prisma Migrate (`prisma/migrations/**`).

**Historical SQL (reference only, not used at runtime):** `lib/schema.sql` and `migrations/*.sql`. Do not run `scripts/run-migration.mjs` — that runner has been removed.

**Schema file (historical `lib/schema.sql`) defined:**

| Table | Purpose |
|-------|---------|
| `users` | Accounts (`role`, `study_id`, bcrypt `password`) |
| `study_keys` | Registration keys (`is_used`) |
| `check_in_submissions` | Daily check-in rows |
| `reflections` | Optional standalone reflections |
| `password_reset_tokens` | Hashed reset tokens + expiry |
| `user_weekly_domains` | Domain per user per week (unique `user_id`, `week_number`) |
| `user_study_progress` | Study start, week, totals, safety counters |

Tables are defined in `prisma/schema.prisma` (including `dds_responses`, post-survey, Stampley chat sessions, and the tables listed above). Do not apply historical SQL by hand against Neon.

**Baseline onboarding** (`baseline_*` tables and `/baseline/*` routes) was removed from the app; those tables may still exist in older databases but are unused by current code.

---

## Server actions & API routes

### Server actions (`actions/`)

| File | Functions |
|------|-----------|
| `register.ts` | `registerWithKey` — validate key, create user, mark key used |
| `password-reset.ts` | Request reset email, validate token, update password |
| `dds.ts` | `submitDDS`, `confirmDomain` |
| `admin.ts` | `generateStudyKey`, `deleteStudyKey`, `createUser`, `deleteUser`, `toggleUserRole` |

### API routes (`app/api/`)

| Route | Behavior |
|-------|----------|
| `check-in/submit` | Auth required; INSERT check-in; UPDATE progress; safety logic |
| `stampley/generate` | Auth required; OpenAI completion |
| `debug` | Local-only env presence check; **404 in production** |

---

## State management

| Store | Location | Contents |
|-------|----------|----------|
| Check-in (session) | `store/checkin-store.ts` | distress, mood, energy, contextTags, reflection, copingAction, domain |
| Conversations (persistent) | `store/conversation-storage.ts` | localStorage for Stampley chat threads |

Check-in data lives in Zustand until submit; **only the submit API** writes check-in rows to Postgres.

---

## UI & design system

- **Fonts:** Fraunces (headings), Outfit (body), JetBrains Mono (labels) — often loaded via Google Fonts `<style>` blocks on pages.
- **Palette:** Warm neutrals (`#fefdfb`, `#f7f3ed`), brown accents (`#8B6F47`).
- **Home components:** `MenuBar`, `MainHeader`, `TopBar`, `HeroSection`, `DiabetesInfoSection`, `DiabetesNumbersSection`, `Banner`, `HowItWorksSection`, `OnDemandSection`, `Footer`.
- **Daily metrics:** `Glucometer`, `BioMonitor`, `DailyWellnessRadar` — visual sliders/charts for wellness inputs.
- **Charts:** distress trends, mood/energy, domain donut, weekly participation, check-in activity.

**Assets:** `public/images/`, `public/videos/diabeticsvideo.mp4`, logos under `public/images/stampleyLogo.png`, etc.

---

## Environment variables

Create `.env.local` from `.env.example` (never commit secrets):

| Variable | Required | Purpose |
|----------|----------|---------|
| `DATABASE_URL` | Yes | Neon PostgreSQL connection string for Prisma |
| `AUTH_SECRET` or `NEXTAUTH_SECRET` | Yes (prod) | NextAuth signing secret (`openssl rand -base64 32`) |
| `NEXTAUTH_URL` | Yes | App origin for password-reset links (e.g. `http://localhost:3000`) |
| `AUTH_URL` | Optional | Fallback origin for study-key emails only |
| `OPENAI_API_KEY` | Yes (Stampley) | Stampley generation (server-only) |
| `RESEND_API_KEY` | For email | Resend API |
| `EMAIL_FROM` | Production email | Verified Resend sender; otherwise falls back to Resend onboarding address |
| `NODE_ENV` | Auto | `development` / `production` |

Set the same variables in the Vercel project for production. Do not use the old AWS RDS `DATABASE_URL`.

---

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm run build   # production build
npm run start   # run production server
npm run lint    # ESLint
```

**Prerequisites:** Node.js, Neon (or local) PostgreSQL reachable from your machine, Prisma schema applied, env vars set.

**Auth smoke test:** [http://localhost:3000/api/auth/providers](http://localhost:3000/api/auth/providers) should return credentials provider JSON.

**Debug env (local only, no DB query):** `GET /api/debug` — booleans for secret/DB URL presence. Returns 404 when `NODE_ENV=production`.

---

## Database setup (Neon PostgreSQL)

The application uses **Prisma 7** against a **new Neon PostgreSQL** database. Do not point `DATABASE_URL` at the old AWS RDS instance.

### 1. Create a Neon project

Create a PostgreSQL database in Neon and copy the connection string. Use SSL (`sslmode=require` is typical for Neon).

### 2. Connection string

Set `DATABASE_URL` in `.env.local` to the Neon URL. Do not commit it.

### 3. Apply schema (Prisma Migrate)

Schema lives in `prisma/schema.prisma`. Migration history is in `prisma/migrations/`.

Local development (when you intend to change schema):

```bash
npx prisma migrate dev
```

Production / existing Neon database (run later, not as part of `npm run build`):

```bash
npx prisma migrate deploy
```

Historical files `lib/schema.sql` and `migrations/*.sql` are reference only. The old `scripts/run-migration.mjs` runner has been removed.

Verify tables with Prisma Studio or `psql` against Neon if needed.

---

## Deployment (Vercel + Neon)

Target production architecture: **Vercel** + **Neon PostgreSQL**. This repository is prepared for that host; connecting the Vercel project is a later step.

Expected Vercel build command: `npm run build` (`next build`). `postinstall` runs `prisma generate` so the generated client in `lib/generated/prisma` exists on a clean checkout.

Do **not** add `prisma migrate deploy` to the Vercel build command unless that is chosen explicitly later. Apply production migrations once against Neon with:

```bash
npx prisma migrate deploy
```

Set the environment variables from [Environment variables](#environment-variables) in the Vercel project. Use the Neon `DATABASE_URL`, not AWS RDS.

`amplify.yml` is leftover AWS Amplify configuration. It is **not** used by Vercel and is retained until an explicit later cleanup.

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server (Turbopack) |
| `npm run build` | Production build (`next build`) |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run bootstrap:admin` | Create the first admin on Neon (`INITIAL_ADMIN_PASSWORD`) |
| `npm run create:admin` | Create an additional admin (`NEW_ADMIN_EMAIL`, `NEW_ADMIN_PASSWORD`) |

---

## Notes & legacy / duplicate files

The repo may contain **duplicate or experimental copies** — prefer the primary paths below:

| Prefer | Instead of |
|--------|------------|
| `app/check-in/stampley-support/page.tsx` | `components/check-in/stampley-support/page.tsx` (alternate full chat UI; may be wired separately) |
| `store/conversation-storage.ts` | `app/check-in/stampley-support/conversationStorage.ts` |
| — | `app/check-in/stampley-support copy/` (old copies) |
| — | `app/HowItWorksSection.tsx` (duplicate; home uses `components/home/HowItWorksSection.tsx`) |

**Next.js 16 note:** Build may warn that the `middleware` file convention is deprecated in favor of `proxy` — middleware still works; see Next.js docs when migrating.

**AGENTS.md:** This project uses Next.js 16 with breaking changes vs older docs — check `node_modules/next/dist/docs/` when upgrading APIs.

---

## Study domain reference

**Domains:** Emotional, Regimen, Physician, Interpersonal.

**Weekly subscales (rotate by day within check-in submit):**

- **Emotional:** Feeling Overwhelmed, Feeling Discouraged, Feeling Burned Out, Fear of Complications, Mental Energy Drain  
- **Regimen:** Blood Sugar Testing, Routine Failure, Management Confidence, Meal Plan Adherence, Self-Management Motivation  
- **Physician:** Doctor Knowledge, Care Directions, Doctor Responsiveness, Doctor Access  
- **Interpersonal:** Social Support for Self-Care, Family Appreciation, Emotional Support from Others  

**Safety rule:** `needs_safety_escalation` when distress ≥ 9 on two consecutive check-ins.

---

## License & study context

Private research application for **AIDES-T2D**. Not intended as a substitute for medical care. Stampley provides supportive psychoeducation only; crisis resources should be shown when safety escalation triggers.

For questions about study operations, contact the research team listed on the About page / study materials.

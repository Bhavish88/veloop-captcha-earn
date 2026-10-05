# VELoop CAPTCHA Earn

A server-authoritative CAPTCHA micro-task and wallet reward system built with **React/Vite** on the frontend and **Python/Django REST Framework/PostgreSQL** on the backend.

The platform is designed around strict backend authority: the client never determines rewards, correctness, or user identity. All visual alphanumeric challenges are generated, timed, verified, and rewarded server-side with PostgreSQL row-level locks and an immutable ledger.

---

## 1. Overview

VELoop CAPTCHA Earn enables authenticated members to solve timed alphanumeric visual challenges and earn instant Gem rewards:
- **Correct Answer**: `+1.00 GEM`
- **Incorrect Answer**: `+0.50 GEM` (participation reward)

A mock rewarded-ad flow enables users to finalize claims or dismiss challenges before receiving a subsequent challenge. The backend is the sole authority for challenge lifecycles, correctness evaluation, reward amounts, and wallet mutations.

---

## 2. Features

- **JWT Authentication**: Secure user registration, credential authentication, active account verification, and SimpleJWT token refresh.
- **Server-Authoritative CAPTCHA**: 6-character uppercase alphanumeric strings omitting ambiguous characters (`O`, `0`, `I`, `1`).
- **4 Distinct Options**: Exactly one correct answer, two subtly modified similar distractors, and one distinct random option, shuffled per challenge.
- **Server-Side Expiration**: Strict 120-second lifecycle enforced server-side via timezone-aware PostgreSQL timestamps.
- **Exact Decimal Gems**: Zero floating-point arithmetic. High-precision `DecimalField(max_digits=14, decimal_places=2)`.

---

## Live Demo

> **Deployment Status**: Deployment configuration is ready, but manual platform authentication/deployment is required.
> Live deployment credentials and cloud accounts are not embedded in this development environment to preserve security.

Once authenticated to the cloud host (Render / Vercel):
- **Frontend**: `https://veloop-frontend.onrender.com` (or user's Vercel deployment URL)
- **Backend API**: `https://veloop-backend.onrender.com`
- **Atomic Wallet & Ledger**: Every balance mutation executes inside `transaction.atomic()` using PostgreSQL row-level locks (`select_for_update()`).
- **Immutable Transaction Ledger**: Records `balance_before` and `balance_after` on every `WalletTransaction` for auditable reconciliation.
- **Anti-Cheat & Replay Protection**: Challenges are single-use. Replay verifications return `409 ALREADY_VERIFIED`. Client-injected rewards or correctness flags are strictly ignored.
- **User Isolation**: Challenges belong strictly to the authenticated user (`request.user`). Cross-user verification or claim attempts fail safely with `404 Not Found`.
- **Claim & No Thanks Flow**: Represents a mock rewarded-ad flow. The reward is credited during verification; Claim and No Thanks are state transitions that **never** double-credit rewards.
- **Premium Fintech UI**: Dark navy/black theme with clean typography, live timer, instant option selection, 0.5s verification animation, and responsive layout.

---

## 3. Tech Stack

### Frontend
- **Framework**: React 19 + Vite 8
- **Routing**: React Router DOM 7
- **Styling**: Tailwind CSS 4
- **HTTP Client**: Axios with JWT Bearer interceptor

### Backend
- **Framework**: Python 3.13 + Django 6.1 + Django REST Framework 3.18
- **Authentication**: SimpleJWT (`djangorestframework-simplejwt`)
- **Concurrency & Locking**: Django ORM `select_for_update()` + `transaction.atomic()`
- **Testing**: Django `TestCase` and `TransactionTestCase` (multithreaded concurrency tests)

### Database
- **Database Engine**: PostgreSQL 18 (Local instance on port 5432)
- **Database Driver**: `psycopg` 3.3

---

## 4. Architecture

```text
               ┌────────────────────────────────────────┐
               │         React + Vite Frontend          │
               │   (Option Selection, Timer, Mock Ad)   │
               └───────────────────┬────────────────────┘
                                   │ HTTPS / JSON (JWT)
                                   ▼
               ┌────────────────────────────────────────┐
               │       Django REST Framework API        │
               │     (Authentication & Rate Limits)     │
               └───────────────────┬────────────────────┘
                                   │
         ┌─────────────────────────┴─────────────────────────┐
         ▼                                                   ▼
┌─────────────────────────────┐             ┌─────────────────────────────┐
│       CAPTCHA Service       │             │       Wallet Service        │
│  - 6-Char Alphanumeric Gen  │             │  - Atomic select_for_update │
│  - 4 Shuffled Options       │             │  - Decimal Gem Arithmetic   │
│  - Server-Side Verification │────────────▶│  - +1.00 / +0.50 Credit     │
│  - 120s Expiry Enforcement  │             │  - Append-Only Ledger Entry │
└──────────────┬──────────────┘             └──────────────┬──────────────┘
               │                                           │
               └─────────────────────┬─────────────────────┘
                                     │ SQL Transactions
                                     ▼
                      ┌─────────────────────────────┐
                      │     PostgreSQL Database     │
                      │  - core_user                │
                      │  - wallets_wallet           │
                      │  - wallets_transaction      │
                      │  - captcha_challenge        │
                      │  - captcha_attempt          │
                      └─────────────────────────────┘
```

---

## 5. CAPTCHA Lifecycle Flow

```text
User                      Frontend                         Django Backend                     PostgreSQL
 │                           │                                    │                               │
 │─── Navigate to /captcha ──▶│                                    │                               │
 │                           │─── GET /api/captcha/current/ ─────▶│                               │
 │                           │                                    │─── Query/Generate Challenge ──▶│
 │                           │◀── { challengeId, question, options } ──────────────────────────────│
 │                           │    (Server secrets & correct_option NOT exposed)                    │
 │                           │                                    │                               │
 │─── Clicks Option ────────▶│                                    │                               │
 │                           │─── Lock UI & Show 0.5s Spinner     │                               │
 │                           │─── POST /api/captcha/verify/ ─────▶│                               │
 │                           │    { challengeId, selectedOption } │─── Lock row select_for_update ─▶
 │                           │                                    │─── Validate Expiry & Replay ──▶
 │                           │                                    │─── Compute +1.00 or +0.50 ────▶
 │                           │                                    │─── Credit Wallet & Ledger ────▶
 │                           │◀── { result, reward, status } ─────│                               │
 │                           │                                    │                               │
 │◀── Display Result ────────│                                    │                               │
 │    (Green / Red Banner)   │                                    │                               │
 │                           │                                    │                               │
 │─── Click "Claim" ────────▶│─── 3-Second Mock Rewarded Ad       │                               │
 │                           │─── POST /api/captcha/claim/ ──────▶│─── Mark CLAIMED (No Extra $)──▶│
 │                           │◀── { status: "CLAIMED" } ──────────│                               │
 │                           │                                    │                               │
 │                           │─── Auto-fetch next challenge ─────▶│─── Generate Fresh Challenge ──▶│
```

---

## 6. Security & Anti-Cheat

1. **Server Authority**: The frontend submits only `challengeId` and `selectedOption`. Submitting fake client fields (`reward: 999`, `isCorrect: true`, `walletBalance: 99999`) has zero impact; the server computes rewards independently.
2. **Secret Hiding**: `correct_option` is strictly server-only. It is excluded from all serializers, views, and React bundles.
3. **User Isolation**: Every challenge is keyed to `request.user`. User B attempting to view, verify, or claim User A's challenge receives `404 Not Found`.
4. **Replay Protection**: Completed challenges transition out of `PENDING`. Subsequent verifications return `409 ALREADY_VERIFIED`.
5. **Concurrency Locks**: High-frequency concurrent submissions for the same challenge serialize on `select_for_update()`. Exactly one transaction awards the reward; all others are rejected.
6. **Double-Claim Prevention**: Claim and Dismiss actions transition challenge status and **never** mutate wallet balances or insert ledger transactions.

---

## 7. API Endpoints

### Authentication
- `POST /api/auth/register/` — Registers user and provisions initial wallet (`gems=0.00`).
- `POST /api/auth/login/` — Authenticates credentials and returns JWT access & refresh tokens.
- `POST /api/auth/token/refresh/` — Refreshes JWT access token.
- `GET /api/auth/me/` — Retrieves authenticated user profile (password hashes excluded).

### Wallet
- `GET /api/wallet/` — Retrieves authenticated user's wallet balances.
- `GET /api/wallet/summary/` — Returns currency balances (`gems`, `ves`, `sves`, `tokens`, `spins`).
- `GET /api/wallet/transactions/` — Paginated transaction ledger (`balanceBefore`, `balanceAfter`, `referenceId`).

### CAPTCHA
- `GET /api/captcha/current/` — Returns active pending challenge or generates a fresh one.
- `POST /api/captcha/verify/` — Evaluates option, awards `+1.00` or `+0.50` GEM, and records attempt.
- `POST /api/captcha/claim/` — Finalizes mock-ad claim flow (`CLAIMED`). Does not award extra Gems.
- `POST /api/captcha/dismiss/` (alias: `/no-thanks/`) — Finalizes no-thanks flow (`DISMISSED`). Does not award extra Gems.

---

## 8. Environment Setup

### Prerequisites
- Python 3.12+
- Node.js 20+
- PostgreSQL 16+

### Backend Setup
```bash
cd backend_django

# Create and activate virtualenv
python -m venv venv
# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables (.env)
# Copy template and set your local PostgreSQL credentials:
cp .env.example .env

# Run database migrations
python manage.py migrate

# Start backend server
python manage.py runserver 8000
```

### Frontend Setup
```bash
cd frontend

# Install packages
npm install

# Configure environment variables (.env)
echo "VITE_API_URL=http://localhost:8000/api" > .env

# Start development server
npm run dev
```

---

## 9. Testing & Quality Assurance

### Backend Tests (Django Test Runner)
```bash
cd backend_django

# Run Django system checks
python manage.py check

# Run CAPTCHA app test suite (unit, anti-cheat, isolation, concurrency)
python manage.py test apps.captcha

# Run full project test suite
python manage.py test apps
```
- **Total Backend Tests**: **60 tests**
- **Test Result**: `OK` (0 failures, 0 errors)

### Frontend Quality Checks
```bash
cd frontend

# Run ESLint
npm run lint

# Run production build
npm run build
```
- **Lint Result**: `0 errors, 0 warnings`
- **Build Result**: `vite build` completed in ~450ms

---

## 10. Project Directory Structure

```text
veloop-captcha-earn/
├── backend_django/
│   ├── apps/
│   │   ├── authentication/     # Register, Login, Me, Token Refresh
│   │   ├── captcha/            # Generator, Lifecycle, Verify, Claim, Anti-Cheat
│   │   ├── core/               # Custom UUID User, Standard Renderers, Exceptions
│   │   └── wallets/            # Wallet, Ledger, Atomic Concurrency Services
│   ├── config/                 # Settings, SimpleJWT config, Throttles, URLs
│   ├── manage.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── captcha/        # CaptchaCard, Options, Status, Reward, MockAd
│   │   │   ├── BrandMark.jsx
│   │   │   └── DashboardNavbar.jsx
│   │   ├── context/            # AuthContext, Token persistence
│   │   ├── pages/              # CaptchaPage, Dashboard, Wallet, Auth Pages
│   │   ├── services/           # api.js, captchaService.js
│   │   ├── App.jsx             # React Router configuration
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
├── README.md
├── SECURITY_TEST_REPORT.md
├── PROJECT_REPORT.md
└── MIGRATION_PLAN.md
```

---

## 11. Production Deployment

The project is fully prepared for multi-service cloud production deployment using infrastructure-as-code manifests.

### Architecture Overview

- **Frontend**:
  - **Technology**: React 19 + Vite 8 (Single Page Application)
  - **Target Platform**: Render Static Site (or Vercel)
  - **Build Command**: `npm install && npm run build`
  - **Publish Directory**: `dist`
  - **Routing**: SPA fallback rewrite `/*` -> `/index.html` (configured via `render.yaml` and `frontend/vercel.json`)

- **Backend**:
  - **Technology**: Django 6.1 + Django REST Framework 3.18
  - **Target Platform**: Render Web Service
  - **WSGI Server**: Gunicorn (`gunicorn config.wsgi:application`)
  - **Static Files**: WhiteNoise (`whitenoise.storage.CompressedManifestStaticFilesStorage`)
  - **Build Command**: `pip install -r requirements.txt && python manage.py migrate && python manage.py collectstatic --noinput`
  - **Process Definition**: Configured in `backend_django/Procfile` and `render.yaml`

- **Database**:
  - **Technology**: Managed PostgreSQL 18
  - **Target Platform**: Render PostgreSQL (or Supabase / Neon / AWS RDS)
  - **Connection**: SSL connection via `DATABASE_URL`

### Environment Variables (Names Only)

#### Backend Environment Variables
- `DEBUG` (`False` in production)
- `SECRET_KEY` (cryptographically generated production secret)
- `ALLOWED_HOSTS` (comma-separated deployed backend hostnames, e.g., `.onrender.com`)
- `DATABASE_URL` (PostgreSQL connection URI)
- `CORS_ALLOWED_ORIGINS` (comma-separated deployed frontend origin URLs)
- `CSRF_TRUSTED_ORIGINS` (comma-separated deployed origin URLs)
- `JWT_ACCESS_TOKEN_LIFETIME_DAYS` (access token lifespan)
- `JWT_REFRESH_TOKEN_LIFETIME_DAYS` (refresh token lifespan)

#### Frontend Environment Variables
- `VITE_API_URL` (full URL to deployed Django REST API endpoint, e.g., `https://veloop-backend.onrender.com/api`)

### Automated Blueprint Deployment (Render)

The root [`render.yaml`](file:///c:/B-Projects/Veloop/render.yaml) blueprint defines all three interconnected services (Backend, Database, Frontend):

1. Link this repository to your [Render](https://render.com) dashboard.
2. Select **Blueprints** -> **New Blueprint Instance**.
3. Select this repository branch (`django-postgres-migration`).
4. Render automatically provisions the PostgreSQL database, injects `DATABASE_URL`, builds the Django API, executes database migrations, collects static assets, and builds the Vite frontend.
5. Deployment configuration is ready, but manual platform authentication/deployment is required.


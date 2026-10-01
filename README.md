# VELoop Rewards — Wallet & Withdrawal Backend System

A backend-focused wallet and payout system built with Node.js, Express.js, MongoDB, and Mongoose, with a React frontend for demonstration. It is a local/development assignment project and does not connect to VELoop production systems.

The system is designed around backend-controlled wallet balances, an immutable transaction ledger, atomic wallet operations, withdrawal lifecycle management, idempotency protection, role-based administration, audit logging, and wallet reconciliation.

---

## 1. Project Overview

VELoop Rewards manages multiple wallet currencies and allows users to exchange eligible VE balances for configured payout options.

The backend is the source of truth for:

- Wallet balances
- Payout requirements and values
- Withdrawal account and balance checks
- Withdrawal status, debits, and reversals
- Transaction history
- Administrative wallet adjustments

The frontend requests and displays API data. It does not determine or directly modify wallet balances.

## 2. Core Features

### User Authentication

- User registration and login
- JWT-based authentication and password hashing
- Account-status validation and role-based access control

### Wallet and Ledger

- Five currencies: VE, SVE, GEM, TOKEN, and SPIN
- Backend-managed wallet changes
- Ledger entries with balance-before and balance-after values
- Paginated transaction history and wallet reconciliation

### Withdrawals and Administration

- Database-configured payout options
- Payout detail and balance validation
- Atomic wallet debit and withdrawal creation
- Withdrawal status management and idempotency
- Reversal on rejection or cancellation
- Admin review, wallet operations, and audit logs

### Security

- JWT authentication, admin authorization, and user ownership checks
- Request validation, NoSQL query sanitization, and rate limiting
- Helmet security headers
- Atomic wallet updates and MongoDB transactions

## 3. Architecture

```text
                    React Frontend
                          |
                          v
                    Express.js API
                          |
                          v
                    Authentication
                    /     |      \
                   /      |       \
                  v       v        v
             Controllers  Middleware
                  |
                  v
               Services
                  |
          +-------+--------+
          |                |
          v                v
      Mongoose Models   Business Rules
          |
          v
       MongoDB
```

The backend follows a layered structure:

```text
Routes -> Middleware -> Controllers -> Services -> Models -> MongoDB
```

Business-critical wallet and withdrawal logic lives in backend services rather than the frontend.

## 4. Technology Stack

### Backend

- Node.js, Express.js, MongoDB, Mongoose
- JWT and bcryptjs
- Helmet, CORS, express-rate-limit, MongoDB sanitization middleware

### Frontend

- React, Vite, Axios, React Router
- Tailwind CSS and project CSS (Bootstrap is not used)

### Testing and Development

- Jest, Supertest, Postman
- Nodemon, npm, Git

## 5. Project Structure

```text
README.md
API_DOCUMENTATION.md
.env.example
backend/
  .env.example
  package.json
  src/
    config/ constants/ controllers/ errors/ middleware/
    models/ routes/ seed/ services/ validators/
frontend/
  .env.example
  package.json
  src/
docs/
  Database.md
  README.md                 # pointer to this file
  API.md                    # pointer to API_DOCUMENTATION.md
  VELoop_Rewards_API_FINAL.postman_collection.json
```

## 6. Wallet Design

A wallet document stores the current balances for each supported currency:

```text
Wallet
├── userId
├── ves
├── sves
├── gems
├── tokens
└── spins
```

The backend finds the wallet from the authenticated user. Client-supplied balance values are never accepted as authoritative.

## 7. Ledger Design

Every wallet mutation creates a ledger transaction containing information such as transaction ID, user and wallet IDs, currency, direction, type, amount, balance before and after, source, reference ID, status, description, metadata, and timestamp.

```text
Credit: balanceAfter = balanceBefore + amount
Debit:  balanceAfter = balanceBefore - amount
```

The current wallet balance can be compared against ledger-derived balances during reconciliation.

## 8. Withdrawal Design

```text
GET payout options
  -> select payout method and voucher
  -> submit payout details with Idempotency-Key
  -> backend validates the account, option, details, and balance
  -> atomic wallet debit, ledger entry, pending withdrawal, and audit log
  -> admin review
  -> approve, reject, or cancel
  -> rejection/cancellation creates a reversal credit
```

The wallet is debited when the withdrawal is created. `APPROVED` authorizes a payout but does not mean an external transfer was sent; settlement is not integrated in this project.

## 9. Payout Configuration

Payout requirements are stored in MongoDB and returned by the backend. The frontend does not define required VE or payout amounts.

| Method value | Seeded name | Type | Payout details |
|---|---|---|---|
| `UPI` | UPI | `UPI` | UPI ID (`upiId`) |
| `PAYPAL` | PayPal | `PAYPAL` | Email |
| `AMAZON` | Amazon Pay | `GIFT_CARD` | Email |
| `GOOGLE_PLAY` | Google Play | `GIFT_CARD` | Email |

The current demo seed marks all four methods active and applies the same INR tiers to each: INR 10 for 2,400 VE; INR 25 for 5,800 VE; INR 50 for 10,000 VE; INR 100 for 19,500 VE; INR 150 for 28,500 VE; INR 300 for 52,500 VE; INR 500 for 80,500 VE; INR 1,000 for 150,000 VE. Verify live method availability, eligibility, and pricing before production use. The API returns only database records with `active: true`.

## 10. Idempotency

Withdrawal creation accepts an `Idempotency-Key` header. Repeating a request for the same user with the same key returns the existing withdrawal instead of applying another debit. Admin wallet operations also require idempotency keys.

## 11. Atomicity and Concurrency

Wallet operations use atomic conditional updates, balance checks, and MongoDB transactions. The debit, ledger entry, withdrawal, and audit record are committed together or rolled back together. MongoDB transactions require a replica set, including in local development.

## 12. Withdrawal Status Lifecycle

```text
PENDING -> PROCESSING -> APPROVED
                       -> REJECTED
                       -> CANCELLED
```

Only `PENDING -> PROCESSING` is allowed before a terminal outcome. Approve, reject, and cancel are available only from `PROCESSING`; terminal statuses cannot transition again. `processedAt` records the final admin decision time, not payout settlement time.

## 13. Reversal Accounting

If a debited withdrawal is rejected or cancelled, the system creates a separate `WITHDRAWAL_REVERSAL` credit. The original debit is retained in the ledger rather than deleted or rewritten.

## 14. Reconciliation

Reconciliation compares stored wallet balances with ledger credits minus debits. The admin endpoint reports matches or mismatches; it does not silently alter balances.

## 15. Database Architecture

The database separates current wallet state, immutable ledger events, withdrawal requests, payout configuration, and audit history.

| Model | Responsibility |
|---|---|
| `Wallet` | Current per-user balances for VE, SVE, GEM, TOKEN, and SPIN. |
| `WalletTransaction` | Append-oriented credit/debit ledger with currency, amount, before/after balances, source, reference, and timestamp. |
| `Withdrawal` | Payout option, required currency amount, payout details, related transaction, idempotency key, status, and review timestamps. |
| `PayoutOption` | Active method and voucher configuration, including required balance and payout amount/currency. |
| `AuditLog` | Actor, action, target user/type, reference, metadata, and timestamp for sensitive wallet and withdrawal operations. |
| `User` | Identity, password hash, account status, role, and wallet reference. |
| `AdminWalletOperation` | Admin mutation idempotency record and response snapshot. |

See [Database.md](docs/Database.md) for full fields, relationships, constraints, and indexes.

## 16. API Overview

The API base path is `/api`.

```text
POST /api/auth/register
POST /api/auth/login
GET  /api/wallet
GET  /api/wallet/summary
GET  /api/wallet/transactions
GET  /api/withdrawals/payout-options
POST /api/withdrawals
GET  /api/withdrawals
GET  /api/withdrawals/:withdrawalId
GET  /api/admin/withdrawals
POST /api/admin/withdrawals/:withdrawalId/process
POST /api/admin/withdrawals/:withdrawalId/approve
POST /api/admin/withdrawals/:withdrawalId/reject
POST /api/admin/withdrawals/:withdrawalId/cancel
POST /api/admin/wallet/credit
POST /api/admin/wallet/debit
GET  /api/admin/reconciliation/:userId
```

See [API_DOCUMENTATION.md](API_DOCUMENTATION.md) for authentication, parameters, request/response examples, and errors.

## 17. Security Model

### Authentication and Authorization

JWT authentication protects wallet and withdrawal routes. Admin routes require an authenticated `ADMIN` user. User-facing data is scoped to the authenticated account.

### Validation and Protections

Email, password, amount, currency, payout option, payout details, and pagination inputs are validated. Sensitive routes are rate-limited, MongoDB query input is sanitized, and Helmet adds HTTP security headers.

The demonstration frontend stores JWTs in browser `localStorage`; production should evaluate a safer token-storage approach. Never commit real `.env` files, database credentials, or signing secrets.

## 18. Error Handling

The API uses a consistent error format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description"
  }
}
```

Unexpected server errors return a generic message. Application errors include cases such as insufficient balance, invalid payout details, unavailable payout options, invalid transitions, and rate-limit excess.

## 19. HTTP Status Codes

The API uses `200`, `201`, `400`, `401`, `403`, `404`, `409`, `429`, and `500` as appropriate for success, validation, authentication, authorization, missing resources, conflicts, rate limits, and unexpected errors.

## 20. Postman

The repository includes [VELoop_Rewards_API_FINAL.postman_collection.json](docs/VELoop_Rewards_API_FINAL.postman_collection.json). Set `baseUrl` to `http://localhost:5000/api` and provide a JWT for protected requests.

## 21. Testing

From `backend/`, run:

```powershell
npm test
```

The current Jest suite contains 12 tests covering wallet amount validation, withdrawal status transitions, insufficient balance handling, duplicate idempotency during concurrent requests, user-scoped withdrawal lookup, and rejection reversal orchestration. Withdrawal-service edge tests use mocked models and sessions; they do not exercise a real MongoDB transaction engine or replace full API integration tests. The Postman collection is included, but do not claim its requests were executed unless separately run and recorded.

### Evaluator smoke tests

Start MongoDB, then from `backend/` seed the payout options and demo account as described below. Start the API and frontend, log in as `demo@veloop.test` using the local password set in `DEMO_USER_PASSWORD`, and use the returned JWT for protected API calls. The seeded demo wallet starts with 25,000 VE.

1. **Payout selection:** call `GET /api/withdrawals/payout-options` with the demo JWT, or visit `/withdraw` and select a method. The response lists active options and their server-configured VE costs.
2. **Normal withdrawal:** submit `POST /api/withdrawals` with `Idempotency-Key: eval-withdrawal-001` and body `{"optionId":"UPI_10","payoutDetails":{"upiId":"demo@upi"}}`. Expect a pending withdrawal and a 2,400 VE debit. Confirm the updated balance with `GET /api/wallet` and the debit in `GET /api/wallet/transactions`.
3. **Duplicate request:** resend the exact same withdrawal body with the same user JWT and idempotency key. It should return the existing request without a second debit. Confirm there is only one corresponding withdrawal and ledger debit.
4. **Insufficient balance:** submit an active `UPI_1000` option (150,000 VE required) with valid UPI details and a new idempotency key. The demo balance is below that requirement, so the API should reject it and leave the wallet unchanged.
5. **Credit/debit:** these are admin-only APIs. First provision a development `ADMIN` account through a trusted local database setup; public registration creates `USER` accounts only. Log in as that admin and use its JWT. Get the demo user's ID from the demo login response, then send these requests:

  ```http
  POST /api/admin/wallet/credit
  Authorization: Bearer <ADMIN_JWT>
  Idempotency-Key: eval-credit-001
  Content-Type: application/json

  { "userId": "<DEMO_USER_ID>", "currency": "VE", "amount": 500, "description": "Evaluator test credit" }
  ```

  ```http
  POST /api/admin/wallet/debit
  Authorization: Bearer <ADMIN_JWT>
  Idempotency-Key: eval-debit-001
  Content-Type: application/json

  { "userId": "<DEMO_USER_ID>", "currency": "VE", "amount": 100, "description": "Evaluator test debit" }
  ```

  Use a new idempotency key for each distinct operation. Check the resulting wallet and ledger entries afterward.

These are manual smoke-test instructions, not claims that those integration scenarios are covered by the current Jest suite.

## 22. Local Setup

### Prerequisites

- Node.js and npm compatible with the repository's package versions
- MongoDB configured as a replica set because the application uses multi-document transactions

### Clone the repository

```powershell
git clone <GITHUB_REPOSITORY_URL>
Set-Location veloop-wallet
```

### Backend

From the repository root in PowerShell:

```powershell
Set-Location backend
npm install
Copy-Item .env.example .env
```

Edit `backend/.env` with a development MongoDB replica-set URI, a strong JWT secret, `NODE_ENV=development`, `FRONTEND_URL`, and a local `DEMO_USER_PASSWORD` of at least eight characters. Never use production credentials. The demo seed requires this password variable and does not contain a committed password. Then run:

```powershell
npm run seed:payouts
npm run seed:demo
npm run dev
```

The backend defaults to `http://localhost:5000`; the API base is `http://localhost:5000/api`.

### Frontend

In another terminal:

```powershell
Set-Location frontend
npm install
Copy-Item .env.example .env
npm run dev
```

The Vite server normally runs at `http://localhost:5173`. `VITE_API_URL` configures the API base URL.

## 23. Environment Variables

Backend: `PORT`, `MONGO_URI`, `JWT_SECRET`, `NODE_ENV`, `FRONTEND_URL`, and `DEMO_USER_PASSWORD`. Frontend: `VITE_API_URL`. Templates are provided at the repository root and in the relevant app folders; use `backend/.env.example` when creating `backend/.env`. Never commit `.env` files, actual passwords, MongoDB connection strings, JWT secrets, or API keys.

## 24. Seed Data

Run `npm run seed:payouts` to seed payout configuration. Run it before the demo seed because the sample withdrawal requires active `UPI_10`.

Run `npm run seed:demo` to create the development account `demo@veloop.test`, a wallet containing 25,000 VE, 5,000 SVE, 100 gems, 500 tokens, and 3 spins, sample ledger transactions, and a pending UPI withdrawal. Set a local password in `DEMO_USER_PASSWORD` before running the seed. This command requires `NODE_ENV=development`. Rerunning it resets this dedicated demo account's balances, withdrawal records, and wallet transaction history. Never point it at production data.

Newly registered users start with an empty wallet. Admin accounts must be provisioned outside public registration.

## 25. Scripts

```text
npm run dev          Start backend with Nodemon
npm start            Start backend normally
npm test             Run Jest
npm run seed:payouts Seed payout configuration
npm run seed:demo    Reset/populate the development demo account
```

## 26. Scaling Considerations

For larger production workloads, preserve the ledger as the audit source and keep wallet mutations conditional and transactional. Review indexes and shard keys around user ID and creation time; archive ledger data based on measured query patterns. Move slow payout review, settlement integration, notifications, and reconciliation into durable queues, using an outbox pattern so work cannot be lost between database commits and message publication. Cache only read-only summaries, never cached balances for debit authorization. Add distributed rate limiting, fraud signals, scheduled reconciliation, structured logging, metrics, tracing, alerts, and disaster recovery procedures. Load-test contention and recovery paths before changing database topology.

## 27. Design Principles

- The backend owns wallet balances, payout amounts, and withdrawal status.
- Ledger history is append-oriented and is not silently rewritten.
- Financial operations are atomic and idempotent where appropriate.
- Administrative actions are authenticated, authorized, and auditable.
- User data is scoped to authenticated identity.

## 28. Known Project Scope

This project demonstrates wallet accounting, payout request creation, and administrative review. It does not integrate an external payout provider, confirm settlement, or provide production fraud detection. The frontend is a demonstration client; financial rules remain in the backend.

## 29. Documentation

- [API documentation](API_DOCUMENTATION.md)
- [Database and model documentation](docs/Database.md)
- [Postman collection](docs/VELoop_Rewards_API_FINAL.postman_collection.json)
- [Backend environment template](backend/.env.example)
- [Frontend environment template](frontend/.env.example)

## 30. GitHub Submission

The submitted GitHub repository should contain `backend/`, `frontend/`, `docs/`, the root `README.md`, `API_DOCUMENTATION.md`, and the `.env.example` templates. Push the complete project to the intended GitHub remote and provide that repository URL with the submission.

Before staging or pushing, verify that only example templates are present and that no `.env`, real credentials, passwords, MongoDB connection strings, JWT secrets, or API keys are included. The root `.gitignore` ignores `.env` and `.env.*` while allowing `.env.example` templates. Use development-only credentials and review `git status` before pushing.

## 31. License

This project was developed as an internship/technical assignment demonstration for VELoop Rewards.

# VELoop Rewards — Wallet & Withdrawal Backend System

A backend-focused wallet and payout system built with Node.js, Express.js, MongoDB, and Mongoose, with a React frontend for demonstration.

The system is designed around backend-controlled wallet balances, an immutable transaction ledger, atomic wallet operations, withdrawal lifecycle management, idempotency protection, role-based administration, audit logging, and wallet reconciliation.

---

## 1. Project Overview

VELoop Rewards manages multiple wallet currencies and allows users to exchange eligible VE balances for configured payout options.

The backend is the source of truth for:

- Wallet balances
- Payout requirements
- Payout values
- Withdrawal eligibility
- Withdrawal status
- Wallet deductions and reversals
- Transaction history
- Administrative wallet adjustments

The frontend only requests and displays data. It does not determine or directly modify wallet balances.

---

## 2. Core Features

### User Authentication

- User registration
- User login
- JWT-based authentication
- Password hashing
- Account status validation
- Role-based access control

### Wallet

The wallet supports:

- VE
- SVE
- GEM
- TOKEN
- SPIN

Wallet-changing operations are performed by the backend.

### Wallet Ledger

Every wallet mutation creates a corresponding ledger transaction containing information such as:

- Transaction ID
- User ID
- Wallet ID
- Currency
- Direction
- Transaction type
- Amount
- Balance before
- Balance after
- Source
- Reference ID
- Status
- Description
- Metadata
- Timestamp

### Withdrawals

The withdrawal system supports:

- Backend-controlled payout options
- Payout detail validation
- Balance validation
- Atomic wallet deduction
- Withdrawal creation
- Withdrawal status management
- Idempotency protection
- Rejection reversal
- Cancellation reversal
- Admin review

### Administration

Admin users can:

- View withdrawals
- Approve withdrawals
- Reject withdrawals
- Cancel withdrawals
- Credit user wallets
- Debit user wallets
- Run wallet reconciliation

### Security

Implemented protections include:

- JWT authentication
- Admin authorization
- User ownership checks
- Request validation
- NoSQL injection sanitization
- Rate limiting
- Idempotency protection
- Atomic wallet updates
- MongoDB transactions
- Audit logging

---

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
Routes
  ↓
Middleware
  ↓
Controllers
  ↓
Services
  ↓
Models
  ↓
MongoDB
```

Business-critical wallet and withdrawal logic is kept in the service layer rather than being controlled by the frontend.

---

## 4. Technology Stack

### Backend

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT
- bcryptjs
- Helmet
- CORS
- express-rate-limit
- MongoDB sanitization middleware

### Frontend

- React
- Vite
- Axios
- React Router

### Testing

- Jest
- Supertest
- Postman

### Development

- Nodemon
- Git
- GitHub

---

## 5. Project Structure

```text
VELoop-Rewards/
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── constants/
│   │   ├── controllers/
│   │   ├── errors/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── seed/
│   │   ├── services/
│   │   └── app.js
│   │
│   ├── .env.example
│   ├── .gitignore
│   ├── jest.config.js
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   └── package.json
│
├── docs/
│   ├── API.md
│   ├── DATABASE.md
│   └── ARCHITECTURE.md
│
└── README.md
```

The exact repository structure may vary slightly as the project evolves.

---

## 6. Wallet Design

A wallet document stores the current balance for each supported currency.

```text
Wallet
├── userId
├── ves
├── sves
├── gems
├── tokens
└── spins
```

The wallet balance is not trusted from the client.

For example, a client cannot safely submit:

```json
{
  "ves": 100000
}
```

and cause the backend to accept that value.

All balance changes are calculated and executed by backend services.

---

## 7. Ledger Design

The wallet uses a ledger-based accounting approach.

For a credit:

```text
balanceAfter = balanceBefore + amount
```

For a debit:

```text
balanceAfter = balanceBefore - amount
```

Each mutation records both the previous and resulting balance.

Example:

```text
Transaction
--------------------------------
Currency: VE
Direction: DEBIT
Amount: 2400
Balance Before: 5400
Balance After: 3000
Type: WITHDRAWAL
```

This provides an auditable history of wallet mutations.

The current wallet balance can also be compared against ledger-derived balances during reconciliation.

---

## 8. Withdrawal Design

The withdrawal process is backend controlled.

```text
Client
  |
  v
GET /withdrawals/payout-options
  |
  v
Select payout option
  |
  v
POST /withdrawals
  |
  v
Validate request
  |
  v
Validate payout option/details
  |
  v
Check wallet balance
  |
  v
Atomic wallet debit
  |
  v
Create withdrawal
  |
  v
Create ledger transaction
  |
  v
Create audit log
  |
  v
PENDING
  |
  v
Admin review
  |
  +--------------------+
  |                    |
  v                    v
APPROVED          REJECTED/CANCELLED
                       |
                       v
              WITHDRAWAL_REVERSAL
                       |
                       v
              Restore wallet balance
```

The wallet is deducted when the withdrawal is created.

If the withdrawal is subsequently rejected or cancelled, a compensating reversal transaction restores the deducted amount.

`APPROVED` means an administrator authorized the request for payout. It is not evidence that payment was sent: this application does not execute transfers or store settlement confirmations. `processedAt` is the time the final admin decision was recorded.

---

## 9. Payout Configuration

Payout requirements are stored in the database and returned by the backend.

Example:

```text
UPI_10
Required VE: 2400
Payout: ₹10

UPI_25
Required VE: 5800
Payout: ₹25
```

The frontend does not define these values.

This prevents a client from changing:

```text
requiredAmount
payoutAmount
payoutCurrency
```

to manipulate the withdrawal calculation.

---

## 10. Idempotency

Withdrawal creation accepts an `Idempotency-Key` header.

Example:

```http
Idempotency-Key: postman-withdrawal-001
```

If the same request is submitted again using the same key for the same user, the system prevents duplicate withdrawal processing.

This protects against:

- Double-clicks
- Client retries
- Network retries
- Duplicate API submissions

The intended result is one logical withdrawal rather than multiple wallet deductions.

---

## 11. Atomicity and Concurrency

Wallet mutations are treated as critical financial operations.

The system uses:

- Atomic wallet updates
- Conditional balance checks
- MongoDB transactions
- Ledger creation within the transaction
- Withdrawal creation within the transaction
- Audit creation within the transaction where applicable

The objective is to prevent situations such as:

```text
Request A → checks balance
Request B → checks same balance
Request A → debits
Request B → debits
```

without appropriate concurrency protection.

A withdrawal should only succeed if the required balance can be safely deducted.

---

## 12. Withdrawal Status Lifecycle

Supported statuses:

```text
PENDING
PROCESSING
APPROVED
REJECTED
CANCELLED
```

Typical lifecycle:

```text
PENDING → PROCESSING → APPROVED
                    → REJECTED
                    → CANCELLED
```

Only `PENDING → PROCESSING` is allowed before a terminal outcome. Approve, reject, and cancel are available only from `PROCESSING`; terminal statuses cannot transition again. `APPROVED` means authorized for payout, not paid; this application has no payout execution or settlement tracking. Entering processing records `processingAt`, and terminal outcomes record `processedAt` as the final admin decision time.

Terminal states are not allowed to transition into unrelated later states.

For example, an approved withdrawal cannot simply be changed back to rejected.

---

## 13. Reversal Accounting

Because VE is deducted when the withdrawal is created, rejection or cancellation requires a compensating credit.

Example:

```text
Initial balance
2400 VE

Withdrawal created
-2400 VE

Balance
0 VE

Withdrawal rejected

Reversal
+2400 VE

Final balance
2400 VE
```

The reversal is represented as a separate ledger transaction:

```text
Type: WITHDRAWAL_REVERSAL
Direction: CREDIT
```

The original withdrawal debit is not deleted or modified to pretend that it never happened.

---

## 14. Reconciliation

Reconciliation compares the current wallet balance with the balance calculated from the ledger.

Conceptually:

```text
Expected Balance
=
Initial Balance
+ Credits
- Debits
± Adjustments
```

A reconciliation process can identify:

```text
Wallet Balance
       vs
Ledger Calculated Balance
```

A mismatch indicates that the stored wallet balance and transaction history are not consistent and requires investigation.

---

## 15. Database Models

The backend uses models for:

```text
User
Wallet
WalletTransaction
Withdrawal
PayoutOption
AuditLog
```

### User

Responsible for:

- Identity
- Email
- Password hash
- Role
- Account status
- Wallet reference
- Login metadata

### Wallet

Responsible for:

- User association
- Current balances

### WalletTransaction

Responsible for:

- Immutable wallet ledger records
- Balance before/after
- Transaction type
- Direction
- Currency
- References

### Withdrawal

Responsible for:

- Withdrawal request
- User and wallet association
- Payout option
- Payout details
- Amount
- Status
- Review information
- Idempotency key
- Related transaction

### PayoutOption

Responsible for:

- Backend-controlled payout configuration
- Required VE
- Payout amount
- Payout currency
- Method
- Active status

### AuditLog

Responsible for recording administrative and important wallet/withdrawal actions.

Examples include:

```text
WITHDRAWAL_CREATED
WITHDRAWAL_PROCESSING
WITHDRAWAL_APPROVED
WITHDRAWAL_REJECTED
WITHDRAWAL_CANCELLED
WALLET_CREDIT
WALLET_DEBIT
BALANCE_CORRECTION
PAYOUT_CONFIGURATION_CHANGED
```

---

## 16. API Overview

### Authentication

```text
POST /api/auth/register
POST /api/auth/login
```

### Wallet

```text
GET /api/wallet
GET /api/wallet/summary
GET /api/wallet/transactions
```

### Withdrawals

```text
GET  /api/withdrawals/payout-options
POST /api/withdrawals
GET  /api/withdrawals
GET  /api/withdrawals/:withdrawalId
```

### Admin Withdrawals

```text
GET  /api/admin/withdrawals
POST /api/admin/withdrawals/:withdrawalId/approve
POST /api/admin/withdrawals/:withdrawalId/reject
POST /api/admin/withdrawals/:withdrawalId/cancel
```

### Admin Wallet

```text
POST /api/admin/wallet/credit
POST /api/admin/wallet/debit
```

### Reconciliation

```text
GET /api/admin/reconciliation/:userId
```

Full API documentation is available in:

```text
docs/API.md
```

---

## 17. Security Model

### Authentication

JWT authentication is used for protected endpoints.

### Authorization

Admin routes require:

```text
Authenticated User
        +
ADMIN Role
```

A normal user must not be able to perform administrative wallet or withdrawal actions.

### Ownership

User-facing wallet and withdrawal endpoints operate within the authenticated user's scope.

### Validation

Inputs such as:

- Email
- Password
- Amount
- Currency
- Payout option
- Payout details
- Pagination parameters

are validated before processing.

### NoSQL Injection Protection

MongoDB query input is sanitized to reduce NoSQL injection risks.

### Rate Limiting

Rate limiting is applied to sensitive endpoints such as authentication, withdrawal creation, and administrative wallet operations.

### Secrets

Sensitive configuration is stored in environment variables.

The real `.env` file must not be committed to Git.

---

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

Common application errors include:

```text
INVALID_REQUEST
UNAUTHORIZED
FORBIDDEN
NOT_FOUND
INSUFFICIENT_BALANCE
INVALID_PAYOUT_DETAILS
INVALID_WITHDRAWAL_STATUS
DUPLICATE_REQUEST
INTERNAL_SERVER_ERROR
```

---

## 19. HTTP Status Codes

```text
200 OK
201 Created
400 Bad Request
401 Unauthorized
403 Forbidden
404 Not Found
409 Conflict
429 Too Many Requests
500 Internal Server Error
```

---

## 20. Postman

The project includes a Postman collection covering the primary API surface.

Recommended structure:

```text
VELoop Rewards API
├── Auth
│   ├── Register User
│   └── Login User
├── Wallet
│   ├── Get Wallet
│   ├── Get Wallet Summary
│   └── Get Transactions
├── Withdrawals
│   ├── Get Payout Options
│   ├── Create Withdrawal
│   ├── Get Withdrawals
│   └── Get Withdrawal
├── Admin - Withdrawals
│   ├── List Withdrawals
│   ├── Approve Withdrawal
│   ├── Reject Withdrawal
│   └── Cancel Withdrawal
├── Admin - Wallet
│   ├── Credit Wallet
│   └── Debit Wallet
└── Admin - Reconciliation
    └── Reconcile Wallet
```

Collection variable:

```text
baseUrl = http://localhost:5000/api
```

Authenticated requests use the JWT returned by login.

Recommended exported collection filename:

```text
VELoop_Rewards_API.postman_collection.json
```

---

## 21. Testing

The project uses Jest and Supertest for automated API testing and Postman for manual API verification.

The tested functional scope includes:

- Registration
- Login
- Wallet retrieval
- Wallet summary
- Wallet transactions
- Payout options
- Withdrawal creation
- Withdrawal idempotency
- Withdrawal history
- Individual withdrawal retrieval
- Admin withdrawal listing
- Admin approval
- Admin rejection
- Admin cancellation
- Admin wallet credit
- Admin wallet debit
- Admin authorization
- Wallet reconciliation

Important wallet scenarios include:

```text
Normal credit
Normal debit
Withdrawal
Insufficient balance
Duplicate withdrawal request
Concurrent operations
Withdrawal rejection reversal
Withdrawal cancellation reversal
Invalid payout details
Unauthorized access
Admin authorization
```

Only tests actually executed should be reported as completed in the final project test-results document.

---

## 22. Local Setup

### Prerequisites

Install:

- Node.js
- MongoDB or MongoDB Atlas
- Git

### Clone the repository

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd VELoop-Rewards
```

### Backend

```bash
cd backend
npm install
```

Create:

```text
.env
```

based on:

```text
.env.example
```

Example configuration:

```env
PORT=5000
MONGO_URI=<MONGODB_CONNECTION_STRING>
JWT_SECRET=<STRONG_SECRET>
NODE_ENV=development
```

Start the backend:

```bash
npm run dev
```

The backend runs by default on:

```text
http://localhost:5000
```

API base:

```text
http://localhost:5000/api
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The Vite development server normally runs on:

```text
http://localhost:5173
```

---

## 23. Environment Variables

Required backend variables:

| Variable | Purpose |
|---|---|
| `PORT` | Backend server port |
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | JWT signing secret |
| `NODE_ENV` | Application environment |

Never commit real credentials, connection strings, or JWT secrets.

---

## 24. Seed Payout Options

The backend provides a payout seed script.

Run:

```bash
npm run seed:payouts
```

This populates configured payout options such as:

```text
UPI_10
UPI_25
UPI_50
UPI_100
UPI_150
UPI_300
UPI_500
UPI_1000
```

---

## 25. Scripts

Backend scripts include:

```bash
npm run dev
npm start
npm test
npm run seed:payouts
```

Descriptions:

```text
npm run dev
→ Starts the development server with Nodemon

npm start
→ Starts the backend normally

npm test
→ Runs Jest tests

npm run seed:payouts
→ Seeds payout configuration
```

---

## 26. Scaling Considerations

The current implementation is designed to demonstrate the core correctness and safety requirements of a wallet system.

For larger production workloads, additional infrastructure could include:

### Database

- Proper compound indexes
- Query optimization
- MongoDB replica sets
- Database monitoring
- Backup and disaster recovery

### Asynchronous Processing

Long-running payout processing could be moved to background workers or queues.

```text
API
 ↓
Withdrawal Created
 ↓
Queue
 ↓
Worker
 ↓
Payout Provider
 ↓
Status Update
```

### Caching

Read-heavy data such as active payout options could be cached where appropriate.

### Rate Limiting

Rate limits can be distributed across application instances using shared infrastructure.

### Fraud Detection

Additional controls could include:

- Velocity checks
- Withdrawal limits
- Account risk scoring
- Device/IP analysis
- Suspicious activity detection

### Observability

A production deployment should include:

- Structured logging
- Metrics
- Distributed tracing
- Error monitoring
- Alerts
- Transaction monitoring

### Reconciliation

Scheduled reconciliation jobs can detect accounting inconsistencies automatically.

---

## 27. Design Principles

The system follows several important principles:

### Backend Is the Source of Truth

The client cannot determine:

- Wallet balances
- Required VE
- Payout amounts
- Withdrawal status
- Eligibility

### Ledger Is Append-Oriented

Wallet mutations create transaction records instead of silently changing historical records.

### Financial Operations Are Atomic

Wallet deduction and related records are coordinated using database transactions.

### Duplicate Requests Are Controlled

Idempotency prevents repeated requests from creating multiple logical withdrawals.

### Administrative Actions Are Auditable

Important admin actions create audit records.

### User Data Is Scoped

Users access their own wallet and withdrawal data through authenticated context.

---

## 28. Known Project Scope

This project demonstrates the wallet, ledger, withdrawal, administration, security, and reconciliation architecture required for the assignment.

Actual external payout settlement is outside the demonstrated backend flow unless a real payout provider is separately integrated.

The frontend is a demonstration client. Financial and business rules remain in the backend.

---

## 29. Documentation

Project documentation should include:

```text
README.md
docs/API.md
docs/DATABASE.md
docs/ARCHITECTURE.md
VELoop_Rewards_API.postman_collection.json
```

These documents describe the implementation, API surface, database design, architecture, and API testing workflow.

---

## 30. License

This project was developed as an internship/technical assignment demonstration for VELoop Rewards.

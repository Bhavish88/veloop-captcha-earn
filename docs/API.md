# VELoop Rewards API Documentation

## Base URL

```text
http://localhost:5000/api
```

## Authentication

Protected endpoints require:

```http
Authorization: Bearer <JWT_TOKEN>
```

Admin endpoints additionally require an authenticated user with the `ADMIN` role.

---

# 1. Authentication

## Register

**POST** `/auth/register`

Creates a new user account and wallet.

### Request

```json
{
  "name": "Test User",
  "email": "wallet-test@example.com",
  "password": "Password123"
}
```

### Response

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "<USER_ID>",
      "email": "wallet-test@example.com",
      "name": "Test User",
      "role": "USER",
      "accountStatus": "ACTIVE"
    },
    "token": "<JWT_TOKEN>"
  }
}
```

**Status:** `201 Created`

## Login

**POST** `/auth/login`

Authenticates a user and returns a JWT token.

### Request

```json
{
  "email": "wallet-test@example.com",
  "password": "Password123"
}
```

### Response

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "<USER_ID>",
      "email": "wallet-test@example.com",
      "name": "Test User",
      "role": "USER",
      "accountStatus": "ACTIVE"
    },
    "token": "<JWT_TOKEN>"
  }
}
```

**Status:** `200 OK`

The returned JWT is used for protected APIs.

---

# 2. Wallet

All wallet endpoints require authentication and operate on the authenticated user's wallet.

## Get Wallet

**GET** `/wallet`

### Authentication

Required.

### Description

Returns the authenticated user's wallet balances.

### Response

```json
{
  "success": true,
  "data": {
    "wallet": {
      "ves": 5400,
      "sves": 0,
      "gems": 0,
      "tokens": 0,
      "spins": 0
    }
  }
}
```

**Status:** `200 OK`

## Get Wallet Summary

**GET** `/wallet/summary`

### Authentication

Required.

### Description

Returns the wallet balance summary.

### Response

```json
{
  "success": true,
  "data": {
    "ves": 5400,
    "sves": 0,
    "gems": 0,
    "tokens": 0,
    "spins": 0
  }
}
```

**Status:** `200 OK`

## Get Transactions

**GET** `/wallet/transactions`

### Authentication

Required.

### Description

Returns the authenticated user's wallet transaction history.

### Query Parameters

| Parameter | Description | Default |
|---|---|---:|
| `page` | Page number | `1` |
| `limit` | Records per page; maximum `100` | `20` |
| `currency` | `VE`, `SVE`, `GEM`, `TOKEN`, `SPIN` | — |
| `direction` | `CREDIT` or `DEBIT` | — |

### Example

```http
GET /wallet/transactions?page=1&limit=20&currency=VE&direction=CREDIT
```

### Response

```json
{
  "success": true,
  "data": {
    "transactions": [],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 0,
      "totalPages": 0
    }
  }
}
```

**Status:** `200 OK`

---

# 3. Withdrawals

## Get Payout Options

**GET** `/withdrawals/payout-options`

### Authentication

Required.

### Description

Returns active payout options configured by the backend.

The frontend does not control payout values or required VE amounts.

### Example Response

```json
{
  "success": true,
  "data": {
    "options": [
      {
        "optionId": "UPI_10",
        "method": "UPI",
        "requiredAmount": 2400,
        "payoutAmount": 10,
        "payoutCurrency": "INR"
      }
    ]
  }
}
```

### Current UPI Options

| Option | Required VE | Payout |
|---|---:|---:|
| `UPI_10` | 2400 | ₹10 |
| `UPI_25` | 5800 | ₹25 |
| `UPI_50` | 10000 | ₹50 |
| `UPI_100` | 19500 | ₹100 |
| `UPI_150` | 28500 | ₹150 |
| `UPI_300` | 52500 | ₹300 |
| `UPI_500` | 80500 | ₹500 |
| `UPI_1000` | 150000 | ₹1000 |

## Create Withdrawal

**POST** `/withdrawals`

### Authentication

Required.

### Required Header

```http
Idempotency-Key: <unique-key>
```

The idempotency key prevents duplicate processing when the same withdrawal request is submitted more than once.

### Request

```json
{
  "optionId": "UPI_10",
  "payoutDetails": {
    "upiId": "test@upi"
  }
}
```

### Processing

1. Validate payout option.
2. Validate payout details.
3. Check wallet balance.
4. Atomically debit the required VE.
5. Create the withdrawal.
6. Create the wallet ledger transaction.
7. Create the audit record.
8. Return the withdrawal.

These operations are performed as part of the protected wallet/withdrawal flow.

### Initial Status

```text
PENDING
```

### Example Response

```json
{
  "success": true,
  "data": {
    "withdrawal": {
      "withdrawalId": "WD_xxxxxxxxx",
      "userId": "<USER_ID>",
      "method": "UPI",
      "optionId": "UPI_10",
      "currency": "VE",
      "currencyAmount": 2400,
      "payoutAmount": 10,
      "payoutCurrency": "INR",
      "status": "PENDING"
    }
  }
}
```

**Status:** `201 Created`

## Get Withdrawal History

**GET** `/withdrawals`

### Authentication

Required.

### Description

Returns the authenticated user's withdrawal history.

### Example Response

```json
{
  "success": true,
  "data": {
    "withdrawals": [],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 0,
      "totalPages": 0
    }
  }
}
```

**Status:** `200 OK`

## Get Withdrawal

**GET** `/withdrawals/:withdrawalId`

### Authentication

Required.

### Description

Returns a specific withdrawal belonging to the authenticated user.

### Example

```http
GET /withdrawals/WD_xxxxxxxxx
```

### Example Response

```json
{
  "success": true,
  "data": {
    "withdrawal": {
      "withdrawalId": "WD_xxxxxxxxx",
      "method": "UPI",
      "optionId": "UPI_10",
      "currency": "VE",
      "currencyAmount": 2400,
      "payoutAmount": 10,
      "payoutCurrency": "INR",
      "status": "PENDING",
      "requestedAt": "2026-09-18T12:00:00.000Z"
    }
  }
}
```

**Status:** `200 OK`

---

# 4. Withdrawal Status

Supported statuses:

- `PENDING`
- `PROCESSING`
- `APPROVED`
- `REJECTED`
- `CANCELLED`

Typical lifecycle:

```text
PENDING → PROCESSING → APPROVED
              → REJECTED
              → CANCELLED
```

Only `PENDING → PROCESSING` is allowed before a terminal outcome. Approve, reject, and cancel requests are accepted only while the withdrawal is `PROCESSING`. All terminal statuses reject further transitions. Entering processing records `processingAt`; terminal outcomes record `processedAt`, the time the admin decision was recorded.

`APPROVED` means an administrator reviewed the request and authorized it for payout. It is an approval decision only: this application does not initiate a transfer, record a disbursement reference, or verify that funds were sent. Therefore `APPROVED` is not proof of payment. The withdrawal debit remains in effect; only rejection or cancellation creates a reversal.

When a withdrawal is rejected or cancelled after the wallet has already been debited, the system creates a compensating:

```text
WITHDRAWAL_REVERSAL
```

ledger transaction to restore the wallet balance.

---

# 5. Admin APIs

Admin authentication and `ADMIN` authorization are required.

## View Withdrawals

**GET** `/admin/withdrawals`

### Query Parameters

| Parameter | Description | Default |
|---|---|---:|
| `page` | Page number | `1` |
| `limit` | Records per page; maximum `100` | `20` |
| `status` | `PENDING`, `PROCESSING`, `APPROVED`, `REJECTED`, `CANCELLED` | — |

### Example

```http
GET /admin/withdrawals?status=PENDING&page=1&limit=20
```

### Response

```json
{
  "success": true,
  "data": {
    "withdrawals": [],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 0,
      "totalPages": 0
    }
  }
}
```

**Status:** `200 OK`

## Start Processing Withdrawal

**POST** `/admin/withdrawals/:withdrawalId/process`

### Request Body

Optional:

```json
{
  "reviewNote": "Payout details verified"
}
```

### Result

Transitions an eligible `PENDING` withdrawal to `PROCESSING` and records `processingAt`. Repeated or out-of-order transitions return `400 INVALID_WITHDRAWAL_TRANSITION`.

## Approve Withdrawal

**POST** `/admin/withdrawals/:withdrawalId/approve`

### Request Body

Optional:

```json
{
  "reviewNote": "Withdrawal approved"
}
```

### Result

Changes an eligible `PROCESSING` withdrawal to:

```text
APPROVED
```

The wallet is not debited again because the VE deduction occurs when the withdrawal is created.
This records approval for payout only; it does not execute or confirm payment. `processedAt` records the final admin decision time, not a settlement time.

## Reject Withdrawal

**POST** `/admin/withdrawals/:withdrawalId/reject`

### Request Body

```json
{
  "rejectionReason": "Invalid payout details",
  "reviewNote": "Rejected after review"
}
```

### Result

Changes an eligible `PROCESSING` withdrawal to:

```text
REJECTED
```

If VE was already deducted, a `WITHDRAWAL_REVERSAL` transaction restores the deducted amount.

## Cancel Withdrawal

**POST** `/admin/withdrawals/:withdrawalId/cancel`

### Request Body

Optional:

```json
{
  "reviewNote": "Cancelled during review"
}
```

### Result

Changes an eligible `PROCESSING` withdrawal to:

```text
CANCELLED
```

If VE was already deducted, a `WITHDRAWAL_REVERSAL` transaction restores the deducted amount.

## Admin Wallet Credit

**POST** `/admin/wallet/credit`

### Required Header

```http
Idempotency-Key: <unique-key>
```

### Request Body

```json
{
  "userId": "<USER_ID>",
  "currency": "VE",
  "amount": 500,
  "description": "Admin reward adjustment"
}
```

### Successful Response

```json
{
  "success": true,
  "data": {
    "wallet": {},
    "transaction": {}
  }
}
```

The operation creates an `ADMIN_CREDIT` ledger transaction and an audit record.
Retries with the same key and identical request data return the original result without applying another credit. Reusing a key with different request data returns `409 IDEMPOTENCY_KEY_REUSED`. `amount` must be a positive safe integer. A credit that would raise the wallet currency balance above `9007199254740991` returns `400 WALLET_BALANCE_LIMIT_EXCEEDED`.

## Admin Wallet Debit

**POST** `/admin/wallet/debit`

### Required Header

```http
Idempotency-Key: <unique-key>
```

### Request Body

```json
{
  "userId": "<USER_ID>",
  "currency": "VE",
  "amount": 500,
  "description": "Admin balance adjustment"
}
```

### Successful Response

```json
{
  "success": true,
  "data": {
    "wallet": {},
    "transaction": {}
  }
}
```

The operation creates an `ADMIN_DEBIT` ledger transaction and an audit record.
Retries with the same key and identical request data return the original result without applying another debit. Reusing a key with different request data returns `409 IDEMPOTENCY_KEY_REUSED`. `amount` must be a positive safe integer; insufficient balances return `400 INSUFFICIENT_BALANCE`.

Keys are scoped to the authenticated administrator and retained with the operation record. Use the same key only when retrying one logical operation; generate a new key for a new adjustment.

## Reconciliation

**GET** `/admin/reconciliation/:userId`

### Authentication

Admin authentication required.

### Description

Compares the user's current wallet balances against the calculated balances from the wallet ledger and reports reconciliation results.

---

# 6. Security

The API implements:

- JWT authentication
- Role-based admin authorization
- User ownership checks
- Request validation
- NoSQL injection sanitization
- Rate limiting
- Idempotency protection
- Atomic wallet updates
- MongoDB transactions
- Audit logging

Protected APIs obtain the authenticated user from the authentication context rather than trusting an arbitrary client-supplied user identity.

---

# 7. Important Wallet Rules

The wallet balance is never trusted from the frontend.

All balance-changing operations are performed by the backend.

Every wallet mutation produces a corresponding ledger transaction.

Wallet operations use atomic updates and database transactions to protect balances during concurrent operations.

---

# 8. Withdrawal Flow

```text
Client
  ↓
GET /withdrawals/payout-options
  ↓
Select payout option
  ↓
POST /withdrawals
  ↓
Validate request
  ↓
Check balance
  ↓
Atomic wallet debit
  ↓
Create withdrawal
  ↓
Create ledger transaction
  ↓
Create audit log
  ↓
PENDING
  ↓
Admin review
  ↓
APPROVED / REJECTED / CANCELLED
  ↓
If rejected/cancelled
  ↓
WITHDRAWAL_REVERSAL
  ↓
Wallet balance restored
```

---

# 9. HTTP Status Codes

| Status | Meaning |
|---:|---|
| `200` | Request completed successfully |
| `201` | Resource created successfully |
| `400` | Invalid request or validation/business-rule failure |
| `401` | Authentication missing or invalid |
| `403` | Authenticated user does not have required permission |
| `404` | Requested resource not found |
| `409` | Duplicate or conflicting operation |
| `429` | Rate limit exceeded |
| `500` | Unexpected server-side error |

---

# 10. Error Response

Standard error format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description"
  }
}
```

Examples of application-level error codes include:

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

The exact error code depends on the validation or service failure.

---

# 11. API Request Authentication Summary

| API Group | Authentication | Admin Role |
|---|---|---|
| `/auth/*` | Not required | No |
| `/wallet/*` | Required | No |
| `/withdrawals/*` | Required | No |
| `/admin/withdrawals/*` | Required | Yes |
| `/admin/wallet/*` | Required | Yes |
| `/admin/reconciliation/*` | Required | Yes |

---

# 12. Wallet Currencies

The wallet supports five backend-controlled currencies:

| Code | Wallet Field |
|---|---|
| `VE` | `ves` |
| `SVE` | `sves` |
| `GEM` | `gems` |
| `TOKEN` | `tokens` |
| `SPIN` | `spins` |

Wallet balances are maintained by the backend and represented in the wallet ledger.

---

# 13. Ledger and Accounting

Every wallet balance mutation is represented by a wallet transaction.

A ledger transaction records information such as:

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

For a normal debit:

```text
balanceAfter = balanceBefore - amount
```

For a normal credit:

```text
balanceAfter = balanceBefore + amount
```

For a rejected or cancelled withdrawal, the compensating reversal restores the previously deducted amount.

---

# 14. Postman Collection

The project includes a Postman collection covering the implemented API surface.

Recommended collection structure:

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

For authenticated requests, use the JWT returned by the login endpoint.

---

# 15. API Testing Scope

The implemented API was tested through Postman for the primary wallet and withdrawal flows, including:

- User registration
- User login
- Wallet retrieval
- Wallet summary
- Wallet transaction history
- Payout option retrieval
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

Additional negative/security tests may be documented separately according to the tests actually executed.

---

# 16. Local Development

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

The default API base URL is:

```text
http://localhost:5000/api
```

Required environment variables are documented in `.env.example`.

Never commit the actual `.env` file or production secrets to the repository.

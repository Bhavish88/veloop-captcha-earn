# VELoop Rewards API Documentation

Base URL: `http://localhost:5000/api`.

Successful responses use `{ "success": true, "data": ... }`. Errors use `{ "success": false, "error": { "code": "...", "message": "..." } }`.

## Authentication

Protected routes require `Authorization: Bearer <JWT>`. Registration and login return a one-day JWT. Admin routes also require the authenticated user's `ADMIN` role.

### Register

`POST /auth/register`

```json
{
  "name": "Test User",
  "email": "user@example.test",
  "password": "development-password"
}
```

Creates a user and empty wallet. Passwords must be at least eight characters.

### Login

`POST /auth/login`

```json
{
  "email": "user@example.test",
  "password": "development-password"
}
```

Returns the user summary and JWT.

## Wallet

Wallet endpoints use the authenticated user's identity; the client cannot select another user by passing a user ID.

### Get balances

`GET /wallet`

Returns `data.wallet` with `ves`, `sves`, `gems`, `tokens`, and `spins`.

### Get summary

`GET /wallet/summary`

Returns the authenticated user's currency balances.

### List transactions

`GET /wallet/transactions?page=1&limit=20&currency=VE&direction=DEBIT`

`page` defaults to 1, `limit` defaults to 20 and is capped at 100. Optional `currency` values are `VE`, `SVE`, `GEM`, `TOKEN`, and `SPIN`; optional `direction` values are `CREDIT` or `DEBIT`. The response contains `data.transactions` and `data.pagination`.

## Payout Options and Withdrawals

### List active payout options

`GET /withdrawals/payout-options`

The response `data` is a plain array of active option records, not an object nested under `data.options`:

```json
{
  "success": true,
  "data": [
    {
      "optionId": "UPI_10",
      "method": "UPI",
      "name": "₹10 UPI",
      "type": "UPI",
      "currency": "VE",
      "requiredAmount": 2400,
      "payoutAmount": 10,
      "payoutCurrency": "INR",
      "active": true
    }
  ]
}
```

The current payout seed contains:

| Method value | Seeded INR 10 option name | Type | Payout detail field |
|---|---|---|---|
| `UPI` | `₹10 UPI` | `UPI` | `upiId` |
| `PAYPAL` | `₹10 PayPal` | `PAYPAL` | `email` |
| `AMAZON` | `₹10 Amazon Pay` | `GIFT_CARD` | `email` |
| `GOOGLE_PLAY` | `₹10 Google Play` | `GIFT_CARD` | `email` |

Amazon and Google Play are gift-card types. The current seed marks all four methods active; at runtime the API returns only database records with `active: true`. Regional availability and method-specific eligibility are not evaluated by this endpoint.

The current seed applies these same tiers to each method:

| Payout | Required VE |
|---:|---:|
| INR 10 | 2,400 |
| INR 25 | 5,800 |
| INR 50 | 10,000 |
| INR 100 | 19,500 |
| INR 150 | 28,500 |
| INR 300 | 52,500 |
| INR 500 | 80,500 |
| INR 1,000 | 150,000 |

These are demo seed values. Confirm current platform availability and pricing before deployment.

### Create a withdrawal

`POST /withdrawals`

Requires authentication and an `Idempotency-Key` header. The request identifies a database option; do not submit an amount or balance as authoritative.

UPI request:

```json
{
  "optionId": "UPI_10",
  "payoutDetails": { "upiId": "user@upi" }
}
```

PayPal, Amazon, and Google Play request:

```json
{
  "optionId": "PAYPAL_10",
  "payoutDetails": { "email": "user@example.test" }
}
```

The backend loads the active option, validates payout details and balance, then atomically debits the wallet and creates the ledger transaction, pending withdrawal, and audit record. Repeating a request for the same user with the same idempotency key returns the existing withdrawal rather than applying another debit. Success returns the withdrawal, transaction, wallet, and idempotency result in `data` with HTTP `201`.

### List withdrawal history

`GET /withdrawals?page=1&limit=20&status=PENDING`

`page` defaults to 1; `limit` defaults to 20 and is capped at 100. Optional `status` values are `PENDING`, `PROCESSING`, `APPROVED`, `REJECTED`, and `CANCELLED`. Results are scoped to the authenticated user and sorted newest first. The response contains `data.withdrawals` and `data.pagination`.

### Get one withdrawal

`GET /withdrawals/:withdrawalId`

Returns a withdrawal only if it belongs to the authenticated user.

## Admin APIs

All `/admin/*` routes require an authenticated `ADMIN` user.

### List withdrawals

`GET /admin/withdrawals?page=1&limit=20&status=PENDING`

Returns paginated withdrawals; `status` is optional.

### Review a withdrawal

- `POST /admin/withdrawals/:withdrawalId/process` with optional `{ "reviewNote": "..." }`
- `POST /admin/withdrawals/:withdrawalId/approve` with optional `{ "reviewNote": "..." }`
- `POST /admin/withdrawals/:withdrawalId/reject` with `{ "rejectionReason": "...", "reviewNote": "..." }`
- `POST /admin/withdrawals/:withdrawalId/cancel` with optional `{ "reviewNote": "..." }`

Allowed transitions are `PENDING -> PROCESSING`, then `PROCESSING -> APPROVED | REJECTED | CANCELLED`. Rejection and cancellation create a compensating credit. Approval authorizes payout but does not execute an external transfer.

### Credit or debit a wallet

- `POST /admin/wallet/credit`
- `POST /admin/wallet/debit`

Both require an `Idempotency-Key` header and a body such as:

```json
{
  "userId": "<USER_ID>",
  "currency": "VE",
  "amount": 500,
  "description": "Development adjustment"
}
```

Currency must be `VE`, `SVE`, `GEM`, `TOKEN`, or `SPIN`; amount must be a positive safe integer. Each operation creates a ledger transaction and audit record.

### Reconcile a wallet

`GET /admin/reconciliation/:userId`

Compares stored balances with ledger credits minus debits for each currency.

## Statuses and Errors

Withdrawal statuses are `PENDING`, `PROCESSING`, `APPROVED`, `REJECTED`, and `CANCELLED`.

Common HTTP statuses: `200` success, `201` created, `400` invalid input or insufficient balance, `401` missing/invalid authentication, `403` authorization/account status failure, `404` missing or unavailable resource, `409` conflict, `429` rate limit, and `500` unexpected server error.

Errors use:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description"
  }
}
```

## Postman

Use the included [Postman collection](docs/VELoop_Rewards_API_FINAL.postman_collection.json) with `baseUrl` set to `http://localhost:5000/api`. Supply the JWT returned by login for protected requests.

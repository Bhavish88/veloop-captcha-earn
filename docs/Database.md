# VELoop Rewards — Database & Model Documentation

## 1. Database Overview

VELoop Rewards uses MongoDB with Mongoose as the ODM.

The current database model is separated into seven primary collections:

```text
User
  |
  | 1 : 1
  v
Wallet
  |
  | 1 : N
  v
WalletTransaction

User
  |
  | 1 : N
  +------> Withdrawal
  |
  +------> AuditLog
  |
  +------> AdminWalletOperation

Wallet
  |
  +------> Withdrawal
  |
  +------> WalletTransaction

PayoutOption
  |
  +------> Withdrawal (logical reference through optionId)
```

The wallet stores the current balances, while `WalletTransaction` provides the ledger history. `Withdrawal` stores payout requests, `PayoutOption` stores backend-controlled payout configuration, and `AuditLog` records sensitive actions.

---

# 2. Collections

The application uses these Mongoose models:

| Model | Collection Purpose |
|---|---|
| `User` | User identity, authentication, role and account state |
| `Wallet` | Current wallet balances |
| `WalletTransaction` | Immutable wallet ledger |
| `Withdrawal` | Withdrawal/payout requests |
| `PayoutOption` | Backend-controlled payout configuration |
| `AuditLog` | Auditable record of sensitive actions |
| `AdminWalletOperation` | Idempotency record and replay snapshot for admin wallet mutations |

---

# 3. User Model

Model:

```text
User
```

The User model stores account and authentication information.

### Fields

| Field | Type | Required | Constraints / Purpose |
|---|---|---:|---|
| `email` | String | Yes | Unique, lowercase, trimmed, immutable, indexed |
| `name` | String | Yes | Trimmed, 2–100 characters |
| `passwordHash` | String | Yes | Stored hashed; excluded from normal queries with `select: false` |
| `role` | String | Yes | Enum from `USER_ROLES`; default `USER` |
| `accountStatus` | String | Yes | Enum from `ACCOUNT_STATUS`; default `ACTIVE`; indexed |
| `walletId` | ObjectId | No | References `Wallet`; unique and sparse |
| `lastLoginAt` | Date | No | Last successful login |
| `createdAt` | Date | Automatic | Mongoose timestamps |
| `updatedAt` | Date | Automatic | Mongoose timestamps |

The schema uses a unique, immutable email and a role/account-status system. The password hash is excluded from normal query results. fileciteturn61file5L9-L16 fileciteturn61file5L27-L45

### Relationships

```text
User.walletId → Wallet._id
```

The `walletId` field references the user's wallet. fileciteturn61file5L48-L52

---

# 4. Wallet Model

Model:

```text
Wallet
```

The Wallet model stores the current balance for each supported reward currency.

### Fields

| Field | Type | Required | Constraints / Purpose |
|---|---|---:|---|
| `userId` | ObjectId | Yes | References `User`; unique, immutable, indexed |
| `ves` | Number | Yes | VEs balance; safe integer, 0–9007199254740991 |
| `sves` | Number | Yes | SVEs balance; safe integer, 0–9007199254740991 |
| `gems` | Number | Yes | Gems balance; safe integer, 0–9007199254740991 |
| `tokens` | Number | Yes | Tokens balance; safe integer, 0–9007199254740991 |
| `spins` | Number | Yes | Spins balance; safe integer, 0–9007199254740991 |
| `createdAt` | Date | Automatic | Mongoose timestamps |
| `updatedAt` | Date | Automatic | Mongoose timestamps |

The schema enforces non-negative integer balances for all five currencies. `userId` is unique, creating a one-wallet-per-user constraint. fileciteturn61file4L5-L12 fileciteturn61file4L14-L22

### Wallet currencies

```text
VE     → ves
SVE    → sves
GEM    → gems
TOKEN  → tokens
SPIN   → spins
```

### Relationship

```text
User 1 ───── 1 Wallet
```

The wallet references its owning user through `userId`. fileciteturn61file4L5-L12

---

# 5. WalletTransaction Model

Model:

```text
WalletTransaction
```

This collection is the wallet ledger. Each wallet mutation creates a transaction record.

### Fields

| Field | Type | Required | Constraints / Purpose |
|---|---|---:|---|
| `transactionId` | String | Yes | Unique, immutable, indexed |
| `userId` | ObjectId | Yes | References `User`; immutable, indexed |
| `walletId` | ObjectId | Yes | References `Wallet`; immutable, indexed |
| `currency` | String | Yes | Enum from `CURRENCIES`; immutable |
| `direction` | String | Yes | `CREDIT` or `DEBIT`; immutable |
| `type` | String | Yes | Enum from `TRANSACTION_TYPES`; immutable |
| `amount` | Number | Yes | Positive safe integer; immutable |
| `balanceBefore` | Number | Yes | Non-negative safe integer; immutable |
| `balanceAfter` | Number | Yes | Non-negative safe integer; immutable |
| `source` | String | Yes | Describes operation source; immutable |
| `referenceId` | String | No | Related operation reference; indexed |
| `status` | String | Yes | Enum from `TRANSACTION_STATUS`; default `COMPLETED` |
| `description` | String | No | Human-readable description; max 500 chars |
| `metadata` | Mixed | No | Additional immutable metadata |
| `createdAt` | Date | Automatic | Mongoose timestamps |
| `updatedAt` | Date | Automatic | Mongoose timestamps |

The transaction schema makes core accounting fields immutable, including transaction ID, user/wallet references, currency, direction, type, amount, balances, source and reference. fileciteturn61file3L11-L18 fileciteturn61file3L20-L54

Amounts and before/after balances are validated as integers, with balances constrained to non-negative values. fileciteturn61file3L57-L86

### Accounting relationship

```text
Wallet 1 ───── N WalletTransaction
User   1 ───── N WalletTransaction
```

### Example

```text
Transaction:
    currency       = VE
    direction      = DEBIT
    type           = WITHDRAWAL
    amount         = 2400
    balanceBefore  = 5400
    balanceAfter   = 3000
```

The historical transaction remains available rather than being overwritten when the wallet changes again.

---

# 6. Withdrawal Model

Model:

```text
Withdrawal
```

This collection stores user payout requests and their lifecycle.

### Fields

| Field | Type | Required | Constraints / Purpose |
|---|---|---:|---|
| `withdrawalId` | String | Yes | Unique, immutable, indexed |
| `userId` | ObjectId | Yes | References `User`; immutable, indexed |
| `walletId` | ObjectId | Yes | References `Wallet`; immutable |
| `method` | String | Yes | Enum from `PAYOUT_METHODS`; immutable |
| `optionId` | String | Yes | Payout option identifier; immutable, indexed |
| `currency` | String | Yes | Enum from `CURRENCIES`; immutable |
| `currencyAmount` | Number | Yes | Positive safe integer; immutable |
| `payoutAmount` | Number | Yes | Positive safe integer; immutable |
| `payoutCurrency` | String | Yes | Defaults to `INR`; immutable |
| `payoutDetails` | Mixed | Yes | Method-specific payout information |
| `status` | String | Yes | Enum from `WITHDRAWAL_STATUS`; default `PENDING`; indexed |
| `rejectionReason` | String | No | Rejection explanation; max 500 chars |
| `reviewNote` | String | No | Admin review note; max 1000 chars |
| `transactionId` | String | Yes | Related wallet transaction; immutable, indexed |
| `idempotencyKey` | String | Yes | Duplicate-request protection |
| `requestedAt` | Date | Yes | Request creation time; immutable |
| `processingAt` | Date | No | Time an admin moved the request into `PROCESSING` |
| `processedAt` | Date | No | Time the final admin decision was recorded; not payout settlement time |
| `createdAt` | Date | Automatic | Mongoose timestamps |
| `updatedAt` | Date | Automatic | Mongoose timestamps |

The withdrawal schema keeps key financial/request fields immutable and validates currency, payout method, status, and positive integer amounts. fileciteturn61file1L10-L18 fileciteturn61file1L34-L60

### Relationships

```text
User   1 ───── N Withdrawal
Wallet 1 ───── N Withdrawal
```

The withdrawal stores both `userId` and `walletId` references. fileciteturn61file1L19-L32

### Status

The model supports:

```text
PENDING
PROCESSING
APPROVED
REJECTED
CANCELLED
```

### Idempotency constraint

The schema defines a unique compound index on:

```text
userId + idempotencyKey
```

This ensures that the same idempotency key cannot be reused for multiple withdrawals by the same user. fileciteturn61file1L121-L126 fileciteturn61file1L155-L162

---

# 7. PayoutOption Model

Model:

```text
PayoutOption
```

This collection stores payout configuration controlled by the backend.

### Fields

| Field | Type | Required | Constraints / Purpose |
|---|---|---:|---|
| `optionId` | String | Yes | Unique, immutable, indexed |
| `method` | String | Yes | Enum from `PAYOUT_METHODS`; indexed |
| `name` | String | Yes | Trimmed, 2–100 characters |
| `type` | String | Yes | Enum from `PAYOUT_TYPES` |
| `currency` | String | Yes | Enum from `CURRENCIES` |
| `requiredAmount` | Number | Yes | Positive safe integer required for redemption |
| `payoutAmount` | Number | Yes | Positive safe integer payout value |
| `payoutCurrency` | String | Yes | Defaults to `INR` |
| `active` | Boolean | Yes | Controls availability; default `true`; indexed |
| `eligibility` | Mixed | No | Eligibility configuration |
| `metadata` | Mixed | No | Additional configuration |
| `createdAt` | Date | Automatic | Mongoose timestamps |
| `updatedAt` | Date | Automatic | Mongoose timestamps |

The schema makes `optionId` unique and immutable and validates the method, type, currency, and integer amounts. fileciteturn61file2L10-L22 fileciteturn61file2L34-L64

### Backend-controlled configuration

The payout option contains both:

```text
requiredAmount
payoutAmount
```

This allows the backend to determine the actual redemption requirement instead of trusting an amount supplied by the frontend.

### Index

A compound index exists on:

```text
method + active
```

This supports queries for payout options by method and availability. fileciteturn61file2L95-L98

---

# 8. AuditLog Model

Model:

```text
AuditLog
```

AuditLog records sensitive administrative and wallet-related actions.

### Fields

| Field | Type | Required | Constraints / Purpose |
|---|---|---:|---|
| `actorId` | ObjectId | Yes | References the user performing the action; indexed |
| `action` | String | Yes | Enum from `AUDIT_ACTIONS`; indexed |
| `targetUserId` | ObjectId | No | References affected user; indexed |
| `targetType` | String | Yes | Type of affected resource; max 50 chars |
| `referenceId` | String | No | Related resource/operation; indexed |
| `metadata` | Mixed | No | Additional immutable audit data |
| `ipAddress` | String | No | Request IP where captured |
| `userAgent` | String | No | Request user-agent where captured |
| `createdAt` | Date | Automatic | Mongoose timestamps |
| `updatedAt` | Date | Automatic | Mongoose timestamps |

Sensitive audit fields are immutable after creation. fileciteturn61file0L6-L18 fileciteturn61file0L22-L42

### Important audit actions

The action is restricted to the configured `AUDIT_ACTIONS` enum.

Examples used by the wallet system include:

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

### Indexes

The model contains indexes for common audit queries, including:

```text
targetUserId + createdAt
action + createdAt
referenceId + createdAt
```

fileciteturn61file0L72-L85

---

# 9. AdminWalletOperation Model

Model:

```text
AdminWalletOperation
```

Each successful admin credit or debit stores the administrator, idempotency key, request hash, operation type, resulting transaction ID, and original wallet response snapshot. The operation record is written in the same MongoDB transaction as the balance change, ledger entry, and audit log.

The unique compound index on `adminId + idempotencyKey` prevents the same administrator from applying a logical operation twice. Matching retries replay the stored result; a key reused with different request data is rejected.

### Indexes

```text
transactionId (unique)
adminId + idempotencyKey (unique)
```

---

# 10. Relationships

The logical relationships are:

```text
                 +-------------+
                 |    User     |
                 +-------------+
                   |    |    |
             1 : 1 |    |    | 1 : N
                   |    |    +--------------+
                   v    v                   |
              +--------+       +------------v---------+
              | Wallet |       |     Withdrawal       |
              +--------+       +----------------------+
                   |
                   | 1 : N
                   v
          +--------------------+
          | WalletTransaction  |
          +--------------------+

                 +----------------+
                 | PayoutOption   |
                 +----------------+
                        |
                        | logical optionId
                        v
                  Withdrawal

                 +----------------+
                 |   AuditLog     |
                 +----------------+
                   ^          |
                   |          |
                actorId   targetUserId
                   |          |
                   +----------+
                        User
```

MongoDB does not enforce relational foreign keys in the same way as a traditional SQL database. The application uses Mongoose references and backend validation to maintain these relationships.

---

# 11. Indexing Strategy

Important indexes in the current models include:

### User

```text
email
accountStatus
walletId
```

### Wallet

```text
userId
```

### WalletTransaction

```text
transactionId
userId
walletId
referenceId
userId + createdAt
walletId + createdAt
```

The transaction model specifically includes compound indexes for recent transactions by user and wallet. fileciteturn61file3L133-L140

### Withdrawal

```text
withdrawalId
userId
optionId
status
transactionId
userId + createdAt
status + createdAt
userId + idempotencyKey (unique)
```

The withdrawal model includes indexes for user history, status-based processing, and unique idempotency enforcement. fileciteturn61file1L145-L162

### PayoutOption

```text
optionId
method
active
method + active
```

### AuditLog

```text
actorId
action
targetUserId
referenceId
targetUserId + createdAt
action + createdAt
referenceId + createdAt
```

These indexes support common wallet, withdrawal, payout, and audit queries.

---

# 12. Immutability Strategy

Financial-history fields are intentionally marked immutable in the schemas.

Examples include:

```text
transactionId
userId
walletId
currency
direction
transaction type
amount
balanceBefore
balanceAfter
withdrawalId
withdrawal user/wallet references
currencyAmount
payoutAmount
transactionId
idempotencyKey
```

This prevents normal document updates from rewriting historical accounting facts.

For a reversal, the original transaction remains part of the history and a separate compensating transaction is created.

---

# 13. Wallet Accounting Model

The current wallet represents the latest balance.

The ledger represents how the balance was reached.

Conceptually:

```text
Current Wallet Balance
=
Initial Balance
+ Credits
- Debits
± Adjustments
```

For example:

```text
Initial VE       5,000

Reward Credit   +1,000
                 -----
                 6,000

Withdrawal      -2,400
                 -----
                 3,600
```

A rejected withdrawal can create a separate reversal:

```text
Withdrawal Reversal
+2,400
```

resulting in:

```text
6,000 VE
```

after the reversal.

---

# 13. Withdrawal Data Model Flow

A withdrawal connects several pieces of data:

```text
User
  |
  +---- userId
        |
        v
Withdrawal
  |
  +---- walletId ----------> Wallet
  |
  +---- optionId ----------> PayoutOption
  |
  +---- transactionId -----> WalletTransaction
  |
  +---- audit/reference ---> AuditLog
```

This allows a withdrawal to be traced through the wallet accounting and audit history.

---

# 14. Transaction Consistency

Critical wallet operations are handled by the backend service layer.

The logical operation is:

```text
Validate request
      ↓
Validate payout option
      ↓
Check available balance
      ↓
Update wallet
      ↓
Create ledger transaction
      ↓
Create withdrawal
      ↓
Create audit record
```

These operations are designed to remain consistent using MongoDB transaction handling and atomic wallet updates.

If a critical operation fails, the wallet should not be left partially modified.

---

# 15. Reconciliation

The reconciliation process compares:

```text
Stored Wallet Balance
        vs
Ledger-Derived Balance
```

For each wallet currency, the expected balance can be derived from its transaction history.

A mismatch indicates that the stored wallet and ledger are inconsistent and requires investigation.

The ledger's `balanceBefore` and `balanceAfter` fields additionally provide transaction-level evidence of how each balance changed.

---

# 16. Data Validation

The models enforce validation at the schema level.

Examples:

### Wallet

```text
Balances >= 0
Balances must be integers
```

### Transactions

```text
Amount >= 1
Amount must be an integer
Balance >= 0
Balance values must be integers
```

### Withdrawal

```text
Currency must be supported
Method must be supported
Status must be supported
Currency amount >= 1
Payout amount >= 1
Amounts must be integers
```

### PayoutOption

```text
Currency must be supported
Method must be supported
Type must be supported
Required amount >= 1
Payout amount >= 1
Amounts must be integers
```

Schema validation is one layer of protection; business validation is also performed by backend services.

---

# 17. Security and Data Ownership

User-facing wallet and withdrawal operations must operate within the authenticated user's scope.

Administrative operations require an authorized admin context.

Sensitive actions are recorded through the audit system.

Authentication information is separated from wallet accounting data:

```text
User
  └── authentication/account information

Wallet
  └── current balances

WalletTransaction
  └── accounting history

Withdrawal
  └── payout workflow

PayoutOption
  └── payout configuration

AuditLog
  └── sensitive action history
```

---

# 18. Design Rationale

The schema separates current state from historical state:

```text
Wallet
→ fast access to current balance

WalletTransaction
→ historical accounting record

Withdrawal
→ payout workflow state

PayoutOption
→ configurable payout rules

AuditLog
→ operational/audit history
```

This avoids putting the entire wallet system into one large document and makes individual responsibilities clearer.

The separation also allows wallet transactions, withdrawals, payout configuration, and audit events to be queried and indexed independently.

---

# 19. Summary

The current VELoop Rewards database consists of six primary models:

```text
User
Wallet
WalletTransaction
Withdrawal
PayoutOption
AuditLog
```

The most important design characteristics are:

- One wallet per user
- Five wallet currencies
- Backend-controlled wallet balances
- Immutable ledger records
- Backend-controlled payout configuration
- Dedicated withdrawal records
- Unique user/idempotency-key protection
- Indexed wallet and withdrawal queries
- Audit records for sensitive operations
- Schema-level validation
- Transaction-oriented wallet operations
- Reconciliation between wallet state and ledger history

The database design is intended to support correctness, traceability, security, and future scaling of wallet and withdrawal operations.

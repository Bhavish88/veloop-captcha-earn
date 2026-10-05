# VELoop CAPTCHA Earn — Project Implementation Report

---

## 1. Project Overview
VELoop CAPTCHA Earn is a secure micro-task reward platform migrated to a modern target stack of **React/Vite (Frontend)**, **Python/Django REST Framework (Backend)**, and **PostgreSQL (Database)**. The platform enables authenticated users to complete visual alphanumeric challenges, earning server-verified Gem rewards that deposit atomically into an append-only transaction ledger.

---

## 2. Problem Statement
Legacy implementations often suffer from client-side trust vulnerabilities:
- Frontend code dictating reward amounts, correctness evaluations, or user balances.
- Floating-point arithmetic errors accumulating in reward currencies.
- Race conditions during concurrent submissions resulting in double credits.
- Secret answer leakage via public API inspection or frontend bundle reverse-engineering.

---

## 3. Objectives
1. **Server Authority**: Move 100% of answer validation, reward calculation, and challenge state machines to the backend.
2. **Atomic Integrity**: Prevent race conditions and double-crediting via PostgreSQL row-level locks and database transactions.
3. **Auditability**: Maintain an append-only ledger recording `balance_before` and `balance_after` for all balance mutations.
4. **Information Hiding**: Never expose the server's correct answer or reward calculation prior to verification.
5. **Modern User Experience**: Deliver a responsive, fintech-styled dark mode UI with interactive feedback and a simulated rewarded-ad flow.

---

## 4. Key Features
- **JWT Authentication**: User registration, login, token refresh, and profile inspection via SimpleJWT.
- **Server-Authoritative CAPTCHA**: Dynamic generation of 6-character uppercase alphanumeric strings without ambiguous glyphs (`O`, `0`, `I`, `1`).
- **4 Distinct Options**: 1 correct answer, 2 subtly altered similar distractors, and 1 distinct random option, shuffled per challenge.
- **Server Expiry**: 120-second lifespan enforced on the backend via PostgreSQL timestamps.
- **Decimal Gem Balance**: `DecimalField(14, 2)` eliminating floating-point rounding errors.
- **Micro-Task Rewards**: Exact `+1.00 GEM` for correct answers and `+0.50 GEM` for wrong answers.
- **Simulated Rewarded Ad**: 3-second mock ad experience for the Claim action; Claim and No Thanks never modify wallet balances.
- **Anti-Cheat Engine**: Client-injected rewards, correctness flags, or user ID tampering are completely neutralized.

---

## 5. Technology Stack
- **Frontend**: React 19, Vite 8, Tailwind CSS 4, Axios, React Router DOM 7.
- **Backend**: Python 3.13, Django 6.1, Django REST Framework 3.18, SimpleJWT 5.5, django-cors-headers.
- **Database**: PostgreSQL 18.0, psycopg 3.3.
- **Testing**: Django Test Suite (`TestCase`, `TransactionTestCase` for multi-threading), ESLint 10.

---

## 6. System Architecture
```text
[ React / Vite Frontend ]
       │  (HTTPS JSON + JWT Bearer)
       ▼
[ Django REST Framework API Layer ]
       ├── Authentication (SimpleJWT)
       ├── Rate Limiting (ScopedRateThrottle)
       └── Standardized JSON Envelopes
       ▼
[ Core Application Services ]
       ├── Captcha Service (Generation, Expiry, Verification, Claim/Dismiss)
       └── Wallet Service (select_for_update, balance_before/after calculation)
       ▼
[ PostgreSQL 18 Relational Database ]
       ├── core_user
       ├── wallets_wallet (OneToOne with User)
       ├── wallets_transaction (Append-only Ledger)
       ├── captcha_challenge (Lifecycle State)
       └── captcha_attempt (Immutable Audit Log)
```

---

## 7. Database Design
- **`core_user`**: UUID primary key, unique email, hashed password, role (`USER`, `ADMIN`), account status (`ACTIVE`, `BLOCKED`, `PENDING`).
- **`wallets_wallet`**: UUID primary key, 1-to-1 foreign key to `core_user`. Stores server-authoritative balances: `gems` (Decimal 14, 2), `ves`, `sves`, `tokens`, `spins` (BigInt).
- **`wallets_transaction`**: UUID primary key, unique `transaction_id` (`TXN_...`), foreign keys to user and wallet. Stores `currency`, `direction` (CREDIT/DEBIT), `type`, `amount`, `balance_before`, `balance_after`, `reference_id`, and `created_at`.
- **`captcha_challenge`**: UUID primary key, unique `challenge_id`, user foreign key, `captcha_text`, `options` (JSONField array of 4 strings), `correct_option` (server-only), `status` (`PENDING`, `VERIFIED`, `CLAIMED`, `DISMISSED`, `EXPIRED`), `expires_at`, `selected_option`, `result`, `reward_amount`, `reward_status`, `completed_at`.
- **`captcha_attempt`**: UUID primary key, foreign keys to challenge and user, `selected_option`, `result`, `reward`, `status`, `ip_address`, `created_at`.

---

## 8. CAPTCHA Generation
- **Charset**: 30 non-ambiguous uppercase characters (`ABCDEFGHJKLMNPQRSTUVWXYZ23456789`).
- **Length**: Exactly 6 characters.
- **Distractor Generation**:
  - `similar_1`: Substitutes visually similar characters (e.g. `S` <-> `5`, `B` <-> `8`, `Z` <-> `2`) or swaps adjacent letters.
  - `similar_2`: Secondary subtle mutation guaranteeing distinctness.
  - `different`: Entirely fresh random alphanumeric string.
- **Randomization**: The 4 options are shuffled using `random.shuffle()` before persistence.

---

## 9. CAPTCHA Verification
- **Endpoint**: `POST /api/captcha/verify/`
- **Execution**:
  1. Authenticates JWT (`request.user`).
  2. Acquires row-level lock on `CaptchaChallenge` via `select_for_update()`.
  3. Rejects expired or already processed challenges (`400` / `409`).
  4. Compares `selectedOption` against server `correct_option`.
  5. Computes reward: `+1.00 GEM` for correct, `+0.50 GEM` for wrong.
  6. Updates challenge status to `VERIFIED`.
  7. Inserts `CaptchaAttempt` audit row.
  8. Atomically invokes `credit_wallet()` to record the credit and ledger row.
  9. Commits transaction and returns public verification response.

---

## 10. Wallet & Reward System
- Balance updates are never performed in memory or based on client parameters.
- Server reads current balance with lock, adds reward amount, saves new balance, and writes a ledger entry with `balance_before` and `balance_after`.
- Currency amounts use Python `Decimal` objects throughout, ensuring precision down to the exact cent without IEEE-754 floating point artifacts.

---

## 11. Claim / No Thanks Flow
- Represents the mock rewarded-ad monetization experience.
- The user is credited during verification. The Claim (`POST /api/captcha/claim/`) and No Thanks (`POST /api/captcha/dismiss/`) actions only update challenge state (`CLAIMED` / `DISMISSED`).
- Neither endpoint modifies wallet balances or creates ledger transactions.
- Once finalized, calling `GET /api/captcha/current/` automatically generates a fresh challenge.

---

## 12. Security Architecture
- **No Client Trust**: Client-submitted `reward`, `isCorrect`, `walletBalance`, or `userId` are ignored.
- **Secret Isolation**: `correct_option` is omitted from all serializers and responses.
- **User Isolation**: Challenges are strictly queried with `user=request.user`.
- **Single-Use Replay Protection**: Verified challenges return `409 ALREADY_VERIFIED` on subsequent attempts.

---

## 13. Concurrency Handling
- Handled via PostgreSQL row locks (`select_for_update()`) inside `transaction.atomic()`.
- Verified with 10 concurrent threads simultaneously submitting verification for the same challenge. Exactly 1 thread completes the credit and 9 fail with `409 Conflict`. Total credited amount equals exactly 1.00 GEM (or 0.50 GEM), preventing double-credits.

---

## 14. Frontend User Interface
- **Theme**: Dark navy/slate fintech aesthetic (`#070A12`) with glassmorphism and gold accents.
- **States**: `LOADING`, `CHALLENGE`, `OPTION_SELECTED`, `VERIFYING` (~0.5s animation), `SUCCESS`, `INCORRECT`, `EXPIRED`, `ERROR`.
- **Interactivity**: Instant option locking upon click, live 120s countdown timer, server-authoritative wallet chip, and full mobile responsiveness.

---

## 15. Testing
- **Backend**: 60 unit, anti-cheat, isolation, and multi-threaded concurrency tests passing.
- **Frontend**: ESLint passed with 0 errors / 0 warnings; Vite production build compiles in ~450ms.
- **End-to-End**: 16-step end-to-end test confirmed full lifecycle from registration to multiple sequential rewards.

---

## 16. Limitations
- Single-instance in-memory rate limiting (sufficient for single node; requires Redis for multi-node deployments).
- Simulated rewarded ads only (mock modal, no third-party SDK).

---

## 17. Future Improvements
- Multi-node Redis cache for distributed rate limiting.
- Celery scheduled task for automated cleanup of expired challenges.
- Audio accessibility mode for visually impaired users.

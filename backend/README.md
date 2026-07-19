# Payout System — Backend

Node.js + Express + MongoDB (Mongoose) implementation of the User Payout
Management System described in the assignment.

## Setup

```bash
cd backend
npm install
cp .env.example .env      # edit MONGO_URI and set a real JWT_SECRET
npm run seed                # optional: creates demo accounts + the PDF's example scenario
npm run dev                  # nodemon, or `npm start`
```

Requires a running MongoDB instance (local `mongod` or Atlas) reachable at
`MONGO_URI`. Server listens on `PORT` (default `5000`).

`npm run seed` creates two ready-to-use accounts:

| userId | password | role |
|---|---|---|
| `admin` | `admin1234` | admin |
| `john_doe` | `password123` | user — pre-loaded with the PDF's 3×₹40 example |

## Authentication & authorization

Auth is JWT-based (`jsonwebtoken` + `bcryptjs` for password hashing).

- `POST /api/auth/register { userId, name, password, role? }` → hashes the
  password, creates (or, if a bare user row already exists from a Sale
  reference, *completes*) the account, returns `{ token, user }`.
- `POST /api/auth/login { userId, password }` → returns `{ token, user }`.
- `GET /api/auth/me` (requires `Authorization: Bearer <token>`) → returns
  the current account.

Every other route requires that same `Authorization: Bearer <token>`
header via the `protect` middleware, which decodes the JWT into
`req.user = { userId, role }`. Two roles exist:

- **admin** — can create sales, run the advance payout job, reconcile
  sales, mark withdrawals failed/cancelled/rejected, and view any user's
  data.
- **user** (affiliate) — can view and act on *their own* data only. The
  withdrawal-creation endpoint ignores any `userId` in the body and always
  uses the caller's own identity from the token, so one affiliate can
  never withdraw on behalf of another. List/detail endpoints for sales,
  transactions, withdrawals and user records are narrowed to the caller's
  own `userId` unless the caller is an admin (`middleware/auth.js` ⇒
  `isSelfOrAdmin`).

This means the previously-open `POST /api/sales`, `/reconcile`,
`/advance/run` and `PATCH /withdrawals/:id/status` endpoints are now
`adminOnly` — they represent internal/admin operations (recording a sale,
reconciling it, running payroll, or a payout-processor webhook), not
actions an affiliate would call directly.

## Low-Level Design

### Entities

| Entity | Purpose |
|---|---|
| **User** | One row per affiliate. Holds a denormalized, always-current `withdrawableBalance` plus running totals, and `lastWithdrawalAt` for the 24h rule. |
| **Sale** | One row per affiliate sale. Tracks its lifecycle: `pending → approved/rejected`, whether an advance was paid (`advancePaid`, `advanceAmount`), and whether it has been reconciled (`reconciled`, `finalAmount`). |
| **Withdrawal** | One row per withdrawal *attempt*. Created as `completed` optimistically; can later transition to `cancelled` / `rejected` / `failed` when the payout processor reports an outcome. |
| **Transaction** | Append-only ledger. Every balance mutation (advance, reconciliation credit/debit, withdrawal, withdrawal reversal) writes exactly one row, so the user's balance can be explained/audited from history. |

### Entity-relationship

```
User (1) ──< (N) Sale            [User.userId == Sale.userId]
User (1) ──< (N) Withdrawal      [User.userId == Withdrawal.userId]
User (1) ──< (N) Transaction     [User.userId == Transaction.userId]
Sale (1) ──< (N) Transaction     [advance_payout / reconciliation rows reference saleId]
Withdrawal (1) ──< (N) Transaction  [withdrawal / withdrawal_reversal rows reference withdrawalId]
```

`userId` (a business key, e.g. `"john_doe"`) is used as the join key
everywhere instead of a Mongo `ObjectId` reference, matching the reference
data format given in the assignment and keeping the API friendly to call.

### Class / module design

```
routes/            → HTTP wiring only (method + path → controller)
controllers/        → parse request, call service, shape response
services/payoutService.js → ALL business rules live here (the "domain layer")
models/             → Mongoose schemas (persistence layer)
```

Keeping every business rule inside `payoutService.js` (rather than spread
across controllers) means the rules in the assignment map 1:1 to functions:

- `runAdvancePayoutJob()` → Rule 1 (Advance Payout)
- `reconcileSale()` → Rule 2 (Final Payout Calculation)
- `requestWithdrawal()` → Rule 3 (Withdrawal Restrictions)
- `updateWithdrawalStatus()` → Question 2 (Failed Payout Recovery)

### Business rules → implementation

**1. Advance Payout (10%).**
`runAdvancePayoutJob` selects every `Sale` with `status: "pending"` and
`advancePaid: false`. For each, it *atomically claims* the sale with
`findOneAndUpdate({_id, advancePaid: false}, {advancePaid: true, ...})`.
Because the claim's filter re-checks `advancePaid: false`, running the job
twice — or concurrently from two workers — can never pay the same sale
twice: the second attempt's `findOneAndUpdate` matches zero documents and
is skipped. This directly satisfies *"the same sale must never receive
another advance payout, even if the advance payout job runs multiple
times."*

**2. Final Payout Calculation.**
`reconcileSale(saleId, status)` looks up the sale, verifies it is still
`pending` and not yet `reconciled`, then computes:

- **Approved:** `finalAmount = earning − advanceAlreadyPaid`
- **Rejected:** `finalAmount = −advanceAlreadyPaid` (claws back the advance)

exactly matching the two worked examples in the PDF (₹30 earning / ₹3
advance / approved → ₹27; ₹50 earning / ₹5 advance / rejected → −₹5). The
state transition itself is also claimed atomically
(`findOneAndUpdate({reconciled: false}, {...})`) so a sale can only be
reconciled once.

**3. Withdrawal Restrictions (1 / 24h).**
`requestWithdrawal` performs the "is 24h elapsed AND is balance
sufficient" check *and* the debit in a single atomic
`findOneAndUpdate({userId, withdrawableBalance: {$gte: amount}, $or: [{lastWithdrawalAt: null}, {lastWithdrawalAt: {$lte: cutoff}}]}, {$inc: ..., $set: {lastWithdrawalAt: now}})`.
Doing the check and the write as one atomic operation (instead of
"read balance → check in JS → write") closes the race window where two
concurrent requests could both pass the check before either writes.

**4. Failed Payout Recovery (Question 2).**
`updateWithdrawalStatus(withdrawalId, "failed"|"cancelled"|"rejected")`
atomically claims the withdrawal (`status: "completed", reversed: false`
→ `status: newStatus, reversed: true`), then credits the amount back to
`withdrawableBalance` **and clears `lastWithdrawalAt`**. Clearing the lock
is what satisfies *"allow the user to initiate another withdrawal for
that amount"* — otherwise the failed withdrawal's timestamp would keep
blocking the user for the rest of the 24h window even though they never
actually received the money. This is safe because the business rule
already guarantees at most one `completed` (i.e. lock-holding) withdrawal
exists per user at any time.

### Edge cases & failure handling

| Case | Handling |
|---|---|
| Advance job run twice / concurrently | Idempotent via atomic claim on `advancePaid: false`; second run processes 0 sales. |
| Reconcile a sale twice, or two admins reconcile the same sale at once | Idempotent via atomic claim on `reconciled: false`; second call returns `409 Sale has already been reconciled`. |
| Reconcile a sale that was never advanced | `advancePaid` defaults to `false`/`0`, so approved → full earning, rejected → ₹0 adjustment. |
| Withdraw more than the balance | `400 Insufficient withdrawable balance`. |
| Withdraw before 24h has passed | `429` with a computed `nextAllowedAt` timestamp the client can display. |
| Two withdrawal requests fired simultaneously | Only one can win the atomic `findOneAndUpdate`; the loser gets a precise `429`/`409`. |
| Withdrawal marked failed twice (duplicate webhook) | Guarded by `reversed: false`; second call returns `409 Withdrawal already processed` — no double credit. |
| Unknown `userId` referenced by a sale | `getOrCreateUser` auto-provisions a bare `User` row so ledger writes never fail on a missing FK. |
| Negative / zero amounts | Rejected with `400` at the service boundary before touching the DB. |

### Trade-offs

- **Atomic `findOneAndUpdate` guards instead of DB transactions** — this
  runs correctly against a single standalone `mongod` (no replica set
  required), which keeps local setup trivial for an assignment. In a
  production deployment on a replica set / Atlas, the multi-step flows
  (claim sale → credit user → write ledger row) would be wrapped in a
  proper Mongo session transaction for stronger guarantees.
- **Denormalized `User.withdrawableBalance`** — kept in sync
  transactionally with the `Transaction` ledger on every write. Trades a
  small amount of duplication for O(1) balance reads (no need to sum the
  ledger on every dashboard load); the ledger remains the source of truth
  for audits.
- **`userId` as a plain string business key** rather than a Mongo
  `ObjectId` — matches the reference schema in the assignment and keeps
  the API human-readable (`/api/sales?userId=john_doe`).
- **Withdrawals default to `completed` immediately** (not `pending`) to
  keep the demo self-contained without a real payment processor; the
  status-update endpoint stands in for that processor's webhook.

## API Reference

Base URL: `/api`

### Auth (public)
| Method | Path | Body | Notes |
|---|---|---|---|
| `POST` | `/auth/register` | `{ userId, name, password, role? }` | `role` defaults to `"user"`. |
| `POST` | `/auth/login` | `{ userId, password }` | Returns `{ token, user }`. |
| `GET` | `/auth/me` | — | Requires token. |

### Users (require `Authorization: Bearer <token>`)
| Method | Path | Body | Notes |
|---|---|---|---|
| `POST` | `/users` | `{ userId, name }` | Creates a user explicitly. |
| `GET` | `/users` | — | List all users. |
| `GET` | `/users/:userId` | — | Fetches (or auto-creates) a user. |

### Sales
| Method | Path | Body | Access |
|---|---|---|---|
| `POST` | `/sales` | `{ userId, brand, earning, status? }` | **admin only.** Creates a sale (defaults to `pending`). |
| `GET` | `/sales?userId=&status=` | — | self (forced to own `userId`) or admin (any). |
| `GET` | `/sales/:id` | — | self or admin. |
| `POST` | `/sales/:id/reconcile` | `{ status: "approved" \| "rejected" }` | **admin only.** Rule 2. |

### Payouts
| Method | Path | Body | Access |
|---|---|---|---|
| `POST` | `/payouts/advance/run` | `{ userId? }` | **admin only.** Rule 1. Omit `userId` to run for all users. |
| `GET` | `/payouts/transactions/:userId` | — | self or admin. Full audit ledger for a user. |

### Withdrawals
| Method | Path | Body | Access |
|---|---|---|---|
| `POST` | `/withdrawals` | `{ amount }` | self only — always withdraws from the caller's own account (Rule 3). |
| `GET` | `/withdrawals/:userId` | — | self or admin. |
| `PATCH` | `/withdrawals/:id/status` | `{ status: "failed" \| "cancelled" \| "rejected" }` | **admin only.** Question 2 — stands in for a payout-processor webhook. |

## Worked example (matches the PDF)

```bash
npm run seed

# Log in as admin and grab the token
TOKEN=$(curl -s -X POST localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"userId":"admin","password":"admin1234"}' | node -pe "JSON.parse(require('fs').readFileSync(0)).token")

curl -X POST localhost:5000/api/payouts/advance/run -H "Authorization: Bearer $TOKEN"   # advances ₹4 x 3 = ₹12

# reconcile: 1 rejected, 2 approved
curl -X POST localhost:5000/api/sales/<id1>/reconcile -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"status":"rejected"}'
curl -X POST localhost:5000/api/sales/<id2>/reconcile -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"status":"approved"}'
curl -X POST localhost:5000/api/sales/<id3>/reconcile -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"status":"approved"}'

curl localhost:5000/api/users/john_doe -H "Authorization: Bearer $TOKEN"    # withdrawableBalance -> 68
```

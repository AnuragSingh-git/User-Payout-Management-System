# Payout System — Frontend

React (Vite) + Tailwind CSS + Axios client for the Payout Ledger.

## Setup

```bash
cd frontend
npm install
cp .env.example .env    # set VITE_API_URL if backend isn't on localhost:5000
npm run dev              # http://localhost:5173
```

## Auth

`POST /api/auth/register` and `POST /api/auth/login` return a JWT, stored
in `localStorage` and attached to every request by an Axios request
interceptor (`src/api/axios.js`). `AuthContext` (`src/context/AuthContext.jsx`)
holds the current `{ token, user }` and exposes `login` / `register` /
`logout`. A 401 response from the API (expired/invalid token) fires a
`window` event that clears the session automatically.

`ProtectedRoute` redirects to `/login` when there's no session, and to `/`
when a route requires a role the current user doesn't have.

## Pages

- **Login (`/login`) / Register (`/register`)** — friendly centered forms;
  registering lets you pick account type (Affiliate vs Admin) for demo
  purposes. On success you're routed straight into the matching dashboard.
- **Dashboard (`/`)** — the logged-in affiliate's withdrawable balance /
  total advance paid / total final payout, their sales, a withdrawal
  request form (enforces the 24h rule server-side), their withdrawal
  history, and the full transaction ledger for audit visibility. Admins
  additionally get an "Inspect account" lookup to view any user's ledger,
  plus buttons to *simulate* a processor reporting a withdrawal as
  `failed` / `cancelled` / `rejected` (Question 2 recovery flow).
- **Admin Console (`/admin`, admin role only)** — record a new sale, run
  the advance payout job on demand, and reconcile pending sales
  (approve/reject) with the final settlement amount shown once resolved.
  The nav tab itself only appears for admins.

## Design notes

The UI leans into a ledger/paper aesthetic (serif display type, monospace
figures, a subtle ruled-paper background) rather than a generic dashboard
template, since the domain is literally an accounting ledger. Tailwind
utility classes only — no component library — configured via
`tailwind.config.js`.

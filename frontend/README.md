# ChurnIQ — Frontend

A React + Vite single-page app for the customer-churn model. Red & white theme,
role-based (analyst / admin), with individual + batch prediction, a trends
dashboard, and history.

> **Auth is mock (frontend-only).** Accounts and the prediction log live in the
> browser's `localStorage`. This is a demo login, **not real security** —
> passwords are stored in plain text and role separation is enforced client-side.

## Prerequisites

- **Node 18+** (built with Node 24).
- The **backend must be running** for predictions to work — see [`../backend`](../backend).
  Start it first:
  ```bash
  conda activate Customer-churn
  cd ../backend && python run.py     # http://127.0.0.1:8000
  ```

## Run

```bash
cd frontend
npm install        # first time only
npm run dev        # http://localhost:5173
```

The backend URL is read from [`.env`](.env) (`VITE_API_BASE`, default
`http://127.0.0.1:8000`). Change it there if your backend runs elsewhere.

## Accounts

- **Admin** — seeded automatically: **`admin`** / **`admin123`**
  (use the *Admin* toggle on the login screen).
- **Analyst** — click *Create an account* to self-sign-up.

## What each role sees

**Analyst**
- **Dashboard** — churn vs. non-churn over time (day / week / month), totals and
  churn rate, computed from *their own* predictions.
- **Individual Prediction** — a form (with a "Fill example" button) that scores one
  customer via the backend.
- **Batch Prediction** — drag-and-drop a CSV; every row is scored and shown in a
  table. A ready-made `sample_customers.csv` lives in `../backend`.
- **History** — every customer they've scored, filterable by outcome.

**Admin**
- **Manage Analysts** — all self-registered analysts, their prediction counts, and
  a Remove action.
- **Customer Analysis** — the same charts but across *all* analysts, a per-analyst
  breakdown, plus live server-side totals pulled from the backend database.

## How predictions are handled

The frontend sends plain customer data; the backend does the feature work
(dropping `customer_id`/`country`, gender label-encoding, `balance_salary_ratio`).
Each result is also logged locally (tagged with the signed-in user) so analysts
see only their own data and the admin sees everyone's.

## Project structure

```
frontend/
├── src/
│   ├── api.js                  # backend calls
│   ├── auth/                   # mock auth context + route guard
│   ├── store/predictions.js    # localStorage prediction log + aggregation
│   ├── components/             # Layout (sidebar) + AnalyticsView (charts)
│   └── pages/                  # Login, Signup, Dashboard, Single, Batch,
│                               #   History, AdminAnalysts, AdminAnalytics
├── .env                        # VITE_API_BASE
└── index.html
```

## Reset the demo

To wipe all mock accounts and prediction history, clear the site's
`localStorage` (browser dev tools → Application → Local Storage) or run in the
console: `localStorage.clear()`.

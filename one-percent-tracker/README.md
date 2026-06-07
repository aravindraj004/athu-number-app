# 1% Better Tracker

A personal performance operating system built around the philosophy of improving
**1% every day**. A premium, dark-mode habit dashboard — not a basic to-do app.

## Stack

- **Frontend:** React (Vite)
- **Styling:** Tailwind CSS
- **Charts:** Recharts
- **Backend:** Node.js + Express
- **Database:** SQLite via `@libsql/client` — a local file for development,
  [Turso](https://turso.tech) (cloud SQLite) in production.

## Run locally

```bash
npm install
npm run dev
```

- Client (Vite): http://localhost:5173
- API (Express): http://localhost:3001 (the client proxies `/api` to it)

`npm run dev` starts the Express API and the Vite dev server together. With no
environment variables set, data is stored in a local SQLite file
(`server/local.db`), created and seeded with the default habits on first run.

### Production

```bash
npm run build   # builds the client into dist/
npm start       # Express serves the API and the built client on $PORT (default 3001)
```

## Environment variables

| Variable | Purpose |
|---|---|
| `APP_PASSWORD` | If set, the whole app requires this password (browser login). If unset, the app is open. |
| `TURSO_DATABASE_URL` | Turso database URL. If unset, a local SQLite file is used. |
| `TURSO_AUTH_TOKEN` | Turso auth token (used with the URL above). |
| `PORT` | Port to listen on (hosts set this automatically). |

Copy `.env.example` to `.env` for local overrides (loaded automatically).

## Deploy (Render + Turso, free)

**1. Create a Turso database** (free) at <https://turso.tech>:
- Create a database, then copy its **URL** and create an **auth token**
  (CLI: `turso db show <name> --url` and `turso db tokens create <name>`).

**2. Push this repo to GitHub** (already a subfolder of your repo).

**3. Create a Web Service on Render** (<https://render.com>) from your repo:
- **Root Directory:** `one-percent-tracker`
- **Build Command:** `npm install && npm run build`
- **Start Command:** `npm start`
- **Environment variables:**
  - `APP_PASSWORD` = your chosen password
  - `TURSO_DATABASE_URL` = from step 1
  - `TURSO_AUTH_TOKEN` = from step 1
  - `NODE_VERSION` = `22.11.0`

Render builds and gives you a public `https://…onrender.com` URL. Open it,
enter your password, and your data lives in Turso — so it persists across
restarts and is reachable from any device.

> Free Render services sleep after inactivity; the first visit after a nap
> takes ~30s to wake. Your data is safe in Turso regardless.

## App structure

- **Dashboard** — daily / weekly / monthly scores, streak, % Better (compounded
  growth), category breakdown bars, a monthly trend line chart, and weekly +
  monthly goal progress per habit.
- **Track** — the weekly grid (Mon–Sun). Tap a cell to complete; completed cells
  glow in the category color (gold = Non-Negotiables, blue = Growth &
  Development). **Family Time** logs minutes instead of a checkbox. Daily
  completion % sits above each day; category summary cards sit below.
- **To-Do** — a task list with **Today** and **Upcoming** sections. Each task has
  a title and due date; a task appears in Today when its due date arrives, and any
  unfinished task automatically rolls forward to the next day so it's never lost.
- **Coach** — placeholder for future features.

## Data model (SQLite)

- `habits` — name, category, type (`checkbox` | `time` | `number`), sort
- `habit_logs` — habit_id, date, completed, minutes/value (unique per habit+date)
- `todos` — id, title, due_date, completed

## Notes

- Habit types: **checkbox** (done/not), **time** (whole minutes), **number**
  (any value incl. decimals, e.g. steps or weight).
- Targets, category colors, and the streak threshold live in
  [`src/lib/habits.js`](src/lib/habits.js).

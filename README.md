# Expense Tracker (MERN)

A personal finance / expense tracker built with **MongoDB, Express, React (Vite) and Node.js**.
Log income and expenses, see a monthly summary (income, expenses, savings) and spending by category. Amounts are in ₹.

## Features
- Add and delete transactions (date, income/expense, category, description, amount)
- Monthly summary with savings and a per-category spending chart
- REST API with MongoDB persistence

## Project structure
```
server/   Express + Mongoose API
client/   React app (Vite)
```

## API
| Method | Route | Purpose |
|---|---|---|
| GET | `/api/transactions` | List latest transactions |
| POST | `/api/transactions` | Create a transaction |
| DELETE | `/api/transactions/:id` | Delete a transaction |
| GET | `/api/summary?month=YYYY-MM` | Totals and per-category spend |
| GET | `/api/health` | Health check |

## Run locally
Requirements: Node 18+ and a MongoDB instance (local, or a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster).

```bash
git clone <your-repo-url>
cd expense-tracker
npm run install:all

# configure the database
cp server/.env.example server/.env     # edit MONGODB_URI if needed

# terminal 1 - API on http://localhost:5000
npm run dev:server

# terminal 2 - React app on http://localhost:5173 (proxies /api to the API)
npm run dev:client
```

## Production build (single service)
The Express server serves the built React app, so one deployment runs everything:

```bash
npm run build     # installs deps and builds client/dist
npm start         # serves API + frontend on $PORT
```

## Deploy for free (Render + MongoDB Atlas)
1. Create a free MongoDB Atlas cluster, add a database user, and allow access from anywhere (`0.0.0.0/0`). Copy the connection string.
2. Push this repo to GitHub (public).
3. On [render.com](https://render.com) choose **New > Web Service**, connect the repo, and set:
   - **Build command:** `npm run build`
   - **Start command:** `npm start`
   - **Environment variable:** `MONGODB_URI` = your Atlas connection string
4. Deploy. Open the `https://<your-service>.onrender.com` URL and check `/api/health` returns `{"ok":true}`.

The free Render tier sleeps when idle, so the first load can take about a minute.

**Live demo:** _add your Render URL here after deploying_

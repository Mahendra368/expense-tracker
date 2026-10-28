require("dotenv").config();
const path = require("path");
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();
app.use(cors());
app.use(express.json());

const Transaction = mongoose.model(
  "Transaction",
  new mongoose.Schema(
    {
      date: { type: Date, required: true },
      type: { type: String, enum: ["Income", "Expense"], required: true },
      category: { type: String, required: true, trim: true },
      description: { type: String, default: "", trim: true },
      amount: { type: Number, required: true, min: 0.01 },
    },
    { timestamps: true }
  )
);

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.get("/api/transactions", async (_req, res) => {
  const items = await Transaction.find().sort({ date: -1, createdAt: -1 }).limit(500);
  res.json(items);
});

app.post("/api/transactions", async (req, res) => {
  try {
    const item = await Transaction.create(req.body);
    res.status(201).json(item);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.delete("/api/transactions/:id", async (req, res) => {
  try {
    await Transaction.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// GET /api/summary?month=2026-10  -> totals and per-category spend
app.get("/api/summary", async (req, res) => {
  const m = /^\d{4}-\d{2}$/.test(req.query.month || "")
    ? req.query.month
    : new Date().toISOString().slice(0, 7);
  const start = new Date(`${m}-01T00:00:00.000Z`);
  const end = new Date(start);
  end.setUTCMonth(end.getUTCMonth() + 1);
  const rows = await Transaction.aggregate([
    { $match: { date: { $gte: start, $lt: end } } },
    { $group: { _id: { type: "$type", category: "$category" }, total: { $sum: "$amount" } } },
  ]);
  let income = 0, expenses = 0;
  const byCategory = {};
  for (const r of rows) {
    if (r._id.type === "Income") income += r.total;
    else {
      expenses += r.total;
      byCategory[r._id.category] = r.total;
    }
  }
  res.json({ month: m, income, expenses, savings: income - expenses, byCategory });
});

// Serve the built React app in production (single-service deploy)
const dist = path.join(__dirname, "..", "client", "dist");
app.use(express.static(dist));
app.get(/^\/(?!api).*/, (_req, res, next) =>
  res.sendFile(path.join(dist, "index.html"), (err) => err && next())
);

const PORT = process.env.PORT || 5000;
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/expense-tracker")
  .then(() => app.listen(PORT, () => console.log(`Server running on port ${PORT}`)))
  .catch((e) => {
    console.error("MongoDB connection failed:", e.message);
    process.exit(1);
  });

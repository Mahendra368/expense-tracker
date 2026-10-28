import { useEffect, useState, useCallback } from "react";

const CATEGORIES = [
  "Rent / Housing", "Groceries", "Utilities & Bills", "Transport / Fuel",
  "Dining Out", "Health", "Shopping", "Entertainment",
  "Education", "EMI / Loans", "Travel", "Salary", "Other",
];
const inr = (n) => "₹" + Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 });
const today = () => new Date().toISOString().slice(0, 10);

async function api(path, options) {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

export default function App() {
  const [month, setMonth] = useState(today().slice(0, 7));
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState({ income: 0, expenses: 0, savings: 0, byCategory: {} });
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    date: today(), type: "Expense", category: "Groceries", description: "", amount: "",
  });

  const load = useCallback(async () => {
    try {
      const [t, s] = await Promise.all([
        api("/api/transactions"),
        api(`/api/summary?month=${month}`),
      ]);
      setItems(t);
      setSummary(s);
      setError("");
    } catch (e) {
      setError(e.message);
    }
  }, [month]);

  useEffect(() => { load(); }, [load]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const add = async (e) => {
    e.preventDefault();
    try {
      await api("/api/transactions", {
        method: "POST",
        body: JSON.stringify({ ...form, amount: Number(form.amount) }),
      });
      setForm({ ...form, description: "", amount: "" });
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const remove = async (id) => {
    await api(`/api/transactions/${id}`, { method: "DELETE" });
    load();
  };

  const shown = items.filter((i) => i.date.slice(0, 7) === month);
  const cats = Object.entries(summary.byCategory).sort((a, b) => b[1] - a[1]);
  const max = cats.length ? cats[0][1] : 1;

  return (
    <main>
      <h1>Expense Tracker</h1>
      {error && <p className="error">{error}</p>}

      <label className="month">
        Month <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
      </label>

      <section className="cards">
        <div className="card"><span>Income</span><b className="pos">{inr(summary.income)}</b></div>
        <div className="card"><span>Expenses</span><b className="neg">{inr(summary.expenses)}</b></div>
        <div className="card"><span>Savings</span><b>{inr(summary.savings)}</b></div>
      </section>

      <form onSubmit={add} className="form">
        <input type="date" value={form.date} onChange={set("date")} required />
        <select value={form.type} onChange={set("type")}>
          <option>Expense</option><option>Income</option>
        </select>
        <select value={form.category} onChange={set("category")}>
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
        <input placeholder="Description" value={form.description} onChange={set("description")} />
        <input type="number" min="0.01" step="0.01" placeholder="Amount (₹)"
          value={form.amount} onChange={set("amount")} required />
        <button type="submit">Add</button>
      </form>

      {cats.length > 0 && (
        <section>
          <h2>Spending by category</h2>
          {cats.map(([c, v]) => (
            <div className="bar-row" key={c}>
              <span>{c}</span>
              <div className="bar"><div style={{ width: `${(v / max) * 100}%` }} /></div>
              <span>{inr(v)}</span>
            </div>
          ))}
        </section>
      )}

      <section>
        <h2>Transactions</h2>
        {shown.length === 0 && <p className="muted">No transactions this month.</p>}
        <ul className="list">
          {shown.map((i) => (
            <li key={i._id}>
              <div>
                <b>{i.category}</b>
                <small>{i.date.slice(0, 10)} {i.description && `· ${i.description}`}</small>
              </div>
              <span className={i.type === "Income" ? "pos" : "neg"}>
                {i.type === "Income" ? "+" : "-"}{inr(i.amount)}
              </span>
              <button className="del" onClick={() => remove(i._id)} aria-label="Delete">×</button>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

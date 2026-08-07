import React, { useEffect, useState } from "react";
import { Pie } from "react-chartjs-2";
import { Plus, Trash2 } from "lucide-react";
import "../utils/chartSetup";
import api from "../services/api";
import { Field, Input, Select, Modal, IconBtn } from "../components/UI";
import { EXPENSE_CATEGORIES, inr, todayISO } from "../utils/format";

const PIE_COLORS = ["#E8A33D", "#4C7A5E", "#B4483A", "#5B6472", "#8C6BB1", "#3E7CB1"];

function ExpenseForm({ onSaved, onClose }) {
  const [form, setForm] = useState({ title: "", amount: "", date: todayISO(), category: "Rent" });
  const [busy, setBusy] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.amount) return;
    setBusy(true);
    try {
      await api.post("/expenses", form);
      onSaved();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title="Add Expense" onClose={onClose}>
      <form onSubmit={submit} className="tms-form-grid">
        <Field label="Title" required><Input value={form.title} onChange={(e) => set("title", e.target.value)} /></Field>
        <Field label="Amount (₹)" required><Input type="number" min="0" value={form.amount} onChange={(e) => set("amount", e.target.value)} /></Field>
        <Field label="Date" required><Input type="date" value={form.date} onChange={(e) => set("date", e.target.value)} /></Field>
        <Field label="Category"><Select value={form.category} onChange={(e) => set("category", e.target.value)}>{EXPENSE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}</Select></Field>
        <div className="tms-form-actions">
          <button type="button" className="tms-btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="tms-btn-primary" disabled={busy}>{busy ? "Saving..." : "Save Expense"}</button>
        </div>
      </form>
    </Modal>
  );
}

export default function Expenses({ notify }) {
  const [expenses, setExpenses] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const load = () => api.get("/expenses").then((res) => setExpenses(res.data));
  useEffect(() => { load(); }, []);

  const now = new Date();
  const thisMonth = expenses.filter((e) => e.date.slice(0, 7) === now.toISOString().slice(0, 7));
  const total = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const byCategory = EXPENSE_CATEGORIES.map((c) => ({ name: c, value: expenses.filter((e) => e.category === c).reduce((s, e) => s + Number(e.amount), 0) })).filter((d) => d.value > 0);

  const remove = async (id) => {
    if (!window.confirm("Delete this expense?")) return;
    await api.delete(`/expenses/${id}`);
    notify("Expense deleted.");
    load();
  };

  const pieData = {
    labels: byCategory.map((d) => d.name),
    datasets: [{ data: byCategory.map((d) => d.value), backgroundColor: PIE_COLORS }],
  };

  return (
    <div>
      <div className="tms-page-head">
        <div><h2>Expenses</h2><p className="tms-page-sub">This month: {inr(thisMonth.reduce((s, e) => s + Number(e.amount), 0))} · All time: {inr(total)}</p></div>
        <button className="tms-btn-primary" onClick={() => setShowForm(true)}><Plus size={16} /> Add Expense</button>
      </div>

      <div className="tms-grid-2">
        <div className="tms-card tms-table-wrap">
          <table className="tms-table">
            <thead><tr><th>Title</th><th>Category</th><th>Amount</th><th>Date</th><th></th></tr></thead>
            <tbody>
              {expenses.length === 0 && <tr><td colSpan={5} className="tms-empty">No expenses recorded.</td></tr>}
              {expenses.map((e) => (
                <tr key={e.id}>
                  <td>{e.title}</td><td>{e.category}</td><td className="tms-mono">{inr(e.amount)}</td><td>{e.date}</td>
                  <td><IconBtn title="Delete" danger onClick={() => remove(e.id)}><Trash2 size={15} /></IconBtn></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="tms-card" style={{ padding: 20 }}>
          <h4 className="tms-section-title" style={{ marginTop: 0 }}>By Category</h4>
          {byCategory.length === 0 ? <p className="tms-empty">No data yet.</p> : <Pie data={pieData} />}
        </div>
      </div>

      {showForm && <ExpenseForm onSaved={() => { setShowForm(false); load(); notify("Expense added."); }} onClose={() => setShowForm(false)} />}
    </div>
  );
}

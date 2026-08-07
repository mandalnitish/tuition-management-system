import React, { useEffect, useState } from "react";
import { Plus, Trash2, Receipt as ReceiptIcon } from "lucide-react";
import api from "../services/api";
import { Field, Input, Select, TextArea, Modal, IconBtn } from "../components/UI";
import ReceiptModal from "../components/Receipt";
import { MONTHS, PAYMENT_MODES, inr, todayISO } from "../utils/format";

function PaymentForm({ students, prefill, onSaved, onClose }) {
  const now = new Date();
  const [form, setForm] = useState({
    studentId: prefill?.studentId || "",
    month: prefill?.month || MONTHS[now.getMonth()],
    year: prefill?.year || now.getFullYear(),
    amount: prefill?.amount || "",
    paymentDate: todayISO(),
    paymentMode: "Cash",
    remarks: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    if (form.studentId && !form.amount) {
      const st = students.find((s) => s.id === Number(form.studentId));
      if (st) set("amount", st.monthly_fee);
    }
    // eslint-disable-next-line
  }, [form.studentId]);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.studentId || !form.amount) return;
    setBusy(true);
    setError("");
    try {
      await api.post("/payments", form);
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || "Could not save payment.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title="Record Fee Payment" onClose={onClose}>
      <form onSubmit={submit} className="tms-form-grid">
        <Field label="Student" required>
          <Select value={form.studentId} onChange={(e) => set("studentId", e.target.value)}>
            <option value="">Select student</option>
            {students.map((s) => <option key={s.id} value={s.id}>{s.name} · {s.class}</option>)}
          </Select>
        </Field>
        <Field label="Month" required>
          <Select value={form.month} onChange={(e) => set("month", e.target.value)}>{MONTHS.map((m) => <option key={m}>{m}</option>)}</Select>
        </Field>
        <Field label="Year" required><Input type="number" value={form.year} onChange={(e) => set("year", e.target.value)} /></Field>
        <Field label="Amount (₹)" required><Input type="number" min="0" value={form.amount} onChange={(e) => set("amount", e.target.value)} /></Field>
        <Field label="Payment Date" required><Input type="date" value={form.paymentDate} onChange={(e) => set("paymentDate", e.target.value)} /></Field>
        <Field label="Payment Mode">
          <Select value={form.paymentMode} onChange={(e) => set("paymentMode", e.target.value)}>{PAYMENT_MODES.map((m) => <option key={m}>{m}</option>)}</Select>
        </Field>
        <Field label="Remarks"><TextArea rows={2} value={form.remarks} onChange={(e) => set("remarks", e.target.value)} /></Field>
        {error && <div className="tms-error" style={{ gridColumn: "1 / -1" }}>{error}</div>}
        <div className="tms-form-actions">
          <button type="button" className="tms-btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="tms-btn-primary" disabled={busy}>{busy ? "Saving..." : "Save Payment"}</button>
        </div>
      </form>
    </Modal>
  );
}

export default function Fees({ notify }) {
  const now = new Date();
  const [students, setStudents] = useState([]);
  const [payments, setPayments] = useState([]);
  const [settings, setSettings] = useState({});
  const [year, setYear] = useState(now.getFullYear());
  const [showForm, setShowForm] = useState(false);
  const [prefill, setPrefill] = useState(null);
  const [receiptFor, setReceiptFor] = useState(null);

  const load = () => {
    api.get("/students").then((res) => setStudents(res.data));
    api.get("/payments", { params: { year } }).then((res) => setPayments(res.data));
    api.get("/settings").then((res) => setSettings(res.data));
  };
  useEffect(() => { load(); }, [year]);

  const statusFor = (studentId, month) => payments.find((p) => p.student_id === studentId && p.month === month);

  const removePayment = async (id) => {
    if (!window.confirm("Delete this payment record?")) return;
    await api.delete(`/payments/${id}`);
    notify("Payment deleted.");
    load();
  };

  const recentPayments = [...payments].sort((a, b) => b.payment_date.localeCompare(a.payment_date)).slice(0, 8);

  return (
    <div>
      <div className="tms-page-head">
        <div><h2>Fees</h2><p className="tms-page-sub">Track monthly collections against every student.</p></div>
        <div className="tms-row-actions">
          <Select value={year} onChange={(e) => setYear(Number(e.target.value))} style={{ width: 110 }}>
            {[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map((y) => <option key={y} value={y}>{y}</option>)}
          </Select>
          <button className="tms-btn-primary" onClick={() => { setPrefill(null); setShowForm(true); }}><Plus size={16} /> Record Payment</button>
        </div>
      </div>

      <div className="tms-card tms-table-wrap">
        <table className="tms-table tms-matrix">
          <thead><tr><th className="tms-sticky-col">Student</th>{MONTHS.map((m) => <th key={m}>{m.slice(0, 3)}</th>)}</tr></thead>
          <tbody>
            {students.length === 0 && <tr><td colSpan={13} className="tms-empty">Add students first.</td></tr>}
            {students.map((s) => (
              <tr key={s.id}>
                <td className="tms-sticky-col tms-strong">{s.name}</td>
                {MONTHS.map((m) => {
                  const p = statusFor(s.id, m);
                  return (
                    <td key={m}>
                      <button
                        className={"tms-cell-badge " + (p ? "tms-cell-paid" : "tms-cell-pending")}
                        onClick={() => p ? setReceiptFor(p) : (setPrefill({ studentId: s.id, month: m, year, amount: s.monthly_fee }), setShowForm(true))}
                        title={p ? `Paid ${inr(p.amount)} on ${p.payment_date}` : "Click to record payment"}
                      >
                        {p ? inr(p.amount) : "—"}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h4 className="tms-section-title">Recent Payments</h4>
      <div className="tms-card tms-table-wrap">
        <table className="tms-table">
          <thead><tr><th>Student</th><th>Month</th><th>Amount</th><th>Date</th><th>Mode</th><th>Receipt</th><th>Actions</th></tr></thead>
          <tbody>
            {recentPayments.length === 0 && <tr><td colSpan={7} className="tms-empty">No payments yet.</td></tr>}
            {recentPayments.map((p) => (
              <tr key={p.id}>
                <td>{p.student_name}</td><td>{p.month} {p.year}</td><td className="tms-mono">{inr(p.amount)}</td>
                <td>{p.payment_date}</td><td>{p.payment_mode}</td><td className="tms-mono">{p.receipt_no}</td>
                <td>
                  <div className="tms-row-actions">
                    <IconBtn title="Receipt" onClick={() => setReceiptFor(p)}><ReceiptIcon size={15} /></IconBtn>
                    <IconBtn title="Delete" danger onClick={() => removePayment(p.id)}><Trash2 size={15} /></IconBtn>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <PaymentForm
          students={students}
          prefill={prefill}
          onSaved={() => { setShowForm(false); setPrefill(null); load(); notify("Payment recorded."); }}
          onClose={() => { setShowForm(false); setPrefill(null); }}
        />
      )}
      {receiptFor && <ReceiptModal payment={receiptFor} settings={settings} onClose={() => setReceiptFor(null)} />}
    </div>
  );
}

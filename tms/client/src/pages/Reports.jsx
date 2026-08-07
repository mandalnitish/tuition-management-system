import React, { useEffect, useState } from "react";
import { Search, Download, Printer, TrendingUp, IndianRupee, Wallet } from "lucide-react";
import * as XLSX from "xlsx";
import api from "../services/api";
import { Input, Select, StatCard } from "../components/UI";
import { MONTHS, inr } from "../utils/format";

const TABS = [
  { key: "daily", label: "Daily" },
  { key: "monthly", label: "Monthly" },
  { key: "yearly", label: "Yearly" },
  { key: "student", label: "Student" },
  { key: "pending", label: "Pending" },
  { key: "search", label: "Search" },
];

function exportExcel(rows, filename) {
  if (!rows.length) return;
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Report");
  XLSX.writeFile(wb, filename);
}

export default function Reports() {
  const now = new Date();
  const [tab, setTab] = useState("daily");
  const [date, setDate] = useState(now.toISOString().slice(0, 10));
  const [month, setMonth] = useState(MONTHS[now.getMonth()]);
  const [year, setYear] = useState(now.getFullYear());
  const [students, setStudents] = useState([]);
  const [studentId, setStudentId] = useState("");
  const [query, setQuery] = useState("");
  const [result, setResult] = useState(null);

  useEffect(() => { api.get("/students").then((res) => { setStudents(res.data); if (res.data[0]) setStudentId(res.data[0].id); }); }, []);

  useEffect(() => {
    setResult(null);
    if (tab === "daily") api.get("/reports/daily", { params: { date } }).then((res) => setResult(res.data));
    else if (tab === "monthly") api.get("/reports/monthly", { params: { month, year } }).then((res) => setResult(res.data));
    else if (tab === "yearly") api.get("/reports/yearly", { params: { year } }).then((res) => setResult(res.data));
    else if (tab === "student" && studentId) api.get(`/reports/student/${studentId}`).then((res) => setResult(res.data));
    else if (tab === "pending") api.get("/reports/pending").then((res) => setResult(res.data));
    else if (tab === "search") api.get("/reports/search", { params: { q: query } }).then((res) => setResult(res.data));
    // eslint-disable-next-line
  }, [tab, date, month, year, studentId, query]);

  let rows = [];
  let title = "";
  if (result) {
    if (tab === "daily") { title = `Daily Report — ${date}`; rows = result.payments.map((p) => ({ Student: p.student_name, Month: p.month, Year: p.year, Amount: p.amount, Mode: p.payment_mode, Receipt: p.receipt_no })); }
    else if (tab === "monthly") { title = `Monthly Report — ${month} ${year}`; rows = result.payments.map((p) => ({ Student: p.student_name, Amount: p.amount, Date: p.payment_date, Mode: p.payment_mode, Receipt: p.receipt_no })); }
    else if (tab === "yearly") { title = `Yearly Report — ${year}`; rows = result.data.map((d) => ({ Month: d.month, Collection: d.amount })); }
    else if (tab === "student") { title = `Student Report — ${result.student?.name || ""}`; rows = result.payments.map((p) => ({ Month: p.month, Year: p.year, Amount: p.amount, Date: p.payment_date, Mode: p.payment_mode, Receipt: p.receipt_no })); }
    else if (tab === "pending") { title = `Pending Fees — ${result.month} ${result.year}`; rows = result.students.map((s) => ({ Student: s.name, Class: s.class, Mobile: s.mobile, "Amount Due": s.monthly_fee })); }
    else if (tab === "search") { title = "Search Results"; rows = result.map((p) => ({ Student: p.student_name, Class: p.student_class, Month: p.month, Year: p.year, Amount: p.amount, Receipt: p.receipt_no })); }
  }

  return (
    <div>
      <div className="tms-page-head"><div><h2>Reports</h2><p className="tms-page-sub">Filter, review and export.</p></div></div>

      <div className="tms-tabs">
        {TABS.map((t) => <button key={t.key} className={"tms-tab" + (tab === t.key ? " tms-tab-active" : "")} onClick={() => setTab(t.key)}>{t.label}</button>)}
      </div>

      <div className="tms-toolbar">
        {tab === "daily" && <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ width: 170 }} />}
        {tab === "monthly" && (<>
          <Select value={month} onChange={(e) => setMonth(e.target.value)} style={{ width: 150 }}>{MONTHS.map((m) => <option key={m}>{m}</option>)}</Select>
          <Input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} style={{ width: 100 }} />
        </>)}
        {tab === "yearly" && <Input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} style={{ width: 100 }} />}
        {tab === "student" && (
          <Select value={studentId} onChange={(e) => setStudentId(e.target.value)} style={{ width: 220 }}>
            {students.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </Select>
        )}
        {tab === "search" && (
          <div className="tms-search" style={{ maxWidth: 320 }}>
            <Search size={16} />
            <input placeholder="Name, class, mobile, receipt no, month..." value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
        )}
        <div style={{ marginLeft: "auto" }} className="tms-row-actions">
          <button className="tms-btn-ghost" onClick={() => exportExcel(rows, title.replace(/\s+/g, "_") + ".xlsx")}><Download size={15} /> Excel</button>
          <button className="tms-btn-ghost" onClick={() => window.print()}><Printer size={15} /> Print</button>
        </div>
      </div>

      {tab === "monthly" && result && (
        <div className="tms-stats-grid" style={{ marginBottom: 16 }}>
          <StatCard icon={<TrendingUp size={18} />} label="Collection" value={inr(result.collection)} accent="rgba(76,122,94,0.15)" />
          <StatCard icon={<IndianRupee size={18} />} label="Expenses" value={inr(result.expenseTotal)} accent="rgba(180,72,58,0.15)" />
          <StatCard icon={<Wallet size={18} />} label="Net" value={inr(result.net)} accent="rgba(232,163,61,0.18)" />
        </div>
      )}

      <div className="tms-card tms-table-wrap">
        <h4 className="tms-section-title" style={{ marginTop: 4 }}>{title}</h4>
        <table className="tms-table">
          <thead><tr>{rows[0] ? Object.keys(rows[0]).map((k) => <th key={k}>{k}</th>) : <th>No data</th>}</tr></thead>
          <tbody>
            {rows.length === 0 && <tr><td className="tms-empty">Nothing to show for this filter.</td></tr>}
            {rows.map((r, i) => (
              <tr key={i}>
                {Object.entries(r).map(([k, v], j) => (
                  <td key={j} className={typeof v === "number" ? "tms-mono" : ""}>
                    {typeof v === "number" && (k.toLowerCase().includes("amount") || k === "Collection") ? inr(v) : v}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

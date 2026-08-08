import React, { useEffect, useState } from "react";
import { Bar, Line } from "react-chartjs-2";
import { Link } from "react-router-dom";
import { Users, IndianRupee, TrendingUp, Clock3, UserPlus } from "lucide-react";
import "../utils/chartSetup";
import api from "../services/api";
import { StatCard } from "../components/UI";
import { inr } from "../utils/format";

export default function Dashboard() {
  const [data, setData] = useState(null);
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const yearOptions = [currentYear - 1, currentYear];

  useEffect(() => {
    let cancelled = false;
    const fetchData = () => {
      api.get(`/dashboard?year=${year}`).then((res) => { if (!cancelled) setData(res.data); }).catch(() => {});
    };

    fetchData(); // initial load

    // Keep the dashboard fresh without requiring a manual page reload:
    // refetch whenever the tab regains focus/visibility, and poll periodically as a backup.
    const onFocus = () => fetchData();
    const onVisible = () => { if (document.visibilityState === "visible") fetchData(); };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisible);
    const interval = setInterval(fetchData, 30000);

    return () => {
      cancelled = true;
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisible);
      clearInterval(interval);
    };
  }, [year]);

  if (!data) return <div className="tms-page-head"><div><h2>Dashboard</h2><p className="tms-page-sub">Loading…</p></div></div>;

  const barData = {
    labels: data.monthlyCollection.map((m) => m.month),
    datasets: [{ label: "Collection", data: data.monthlyCollection.map((m) => m.amount), backgroundColor: "#E8A33D", borderRadius: 4 }],
  };
  const lineData = {
    labels: data.studentGrowth.map((g) => g.month),
    datasets: [{ label: "Students", data: data.studentGrowth.map((g) => g.students), borderColor: "#1F2A44", backgroundColor: "#1F2A44", tension: 0.3, pointRadius: 0 }],
  };
  const chartOpts = { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } };

  return (
    <div>
      <div className="tms-page-head"><div><h2>Dashboard</h2><p className="tms-page-sub">{data.monthName} {data.year} overview</p></div></div>

      <div className="tms-stats-grid">
        <StatCard icon={<Users size={18} />} label="Total Students" value={data.activeStudents} sub={`${data.totalStudents} overall`} accent="rgba(60,90,150,0.15)" />
        <StatCard icon={<IndianRupee size={18} />} label="Total Collection" value={inr(data.totalCollection)} accent="rgba(76,122,94,0.15)" />
        <StatCard icon={<TrendingUp size={18} />} label="Today's Collection" value={inr(data.todayCollection)} accent="rgba(232,163,61,0.18)" />
        <StatCard icon={<Clock3 size={18} />} label="Pending Fees" value={inr(data.pendingAmount)} sub={`${data.pendingCount} students`} accent="rgba(180,72,58,0.15)" />
        <StatCard icon={<UserPlus size={18} />} label="New Admissions" value={data.newAdmissions} sub="this month" accent="rgba(140,107,177,0.15)" />
      </div>

      <div className="tms-grid-2" style={{ marginTop: 20 }}>
        <div className="tms-card" style={{ padding: 20 }}>
          <div className="tms-chart-head">
            <h4 className="tms-section-title" style={{ marginTop: 0, marginBottom: 0 }}>Monthly Collection — {data.year}</h4>
            <div className="tms-seg">
              {yearOptions.map((y) => (
                <button
                  key={y}
                  className={"tms-seg-btn" + (year === y ? " tms-seg-btn-active" : "")}
                  onClick={() => setYear(y)}
                >
                  {y}
                </button>
              ))}
            </div>
          </div>
          <Bar data={barData} options={chartOpts} height={110} />
        </div>
        <div className="tms-card" style={{ padding: 20 }}>
          <h4 className="tms-section-title" style={{ marginTop: 0 }}>Student Growth (12 mo)</h4>
          <Line data={lineData} options={chartOpts} height={110} />
        </div>
      </div>

      <div className="tms-grid-2" style={{ marginTop: 20 }}>
        <div className="tms-card tms-table-wrap tms-scroll-panel">
          <h4 className="tms-section-title">Recent Payments</h4>
          <table className="tms-table">
            <thead><tr><th>Student</th><th>Month</th><th>Amount</th><th>Date</th></tr></thead>
            <tbody>
              {data.recentPayments.length === 0 && <tr><td colSpan={4} className="tms-empty">No payments yet.</td></tr>}
              {data.recentPayments.map((p) => (
                <tr key={p.id}>
                  <td data-label="Student">{p.student_name}</td>
                  <td data-label="Month">{p.month} {p.year}</td>
                  <td data-label="Amount" className="tms-mono">{inr(p.amount)}</td>
                  <td data-label="Date">{p.payment_date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="tms-card tms-table-wrap tms-scroll-panel">
          <h4 className="tms-section-title">Pending Students — {data.monthName}</h4>
          <table className="tms-table">
            <thead><tr><th>Student</th><th>Amount Due</th><th></th></tr></thead>
            <tbody>
              {data.pendingStudents.length === 0 && <tr><td colSpan={3} className="tms-empty">Everyone is up to date 🎉</td></tr>}
              {data.pendingStudents.map((s) => (
                <tr key={s.id}>
                  <td data-label="Student">{s.name}</td>
                  <td data-label="Amount Due" className="tms-mono">{inr(s.monthly_fee)}</td>
                  <td data-label=""><Link className="tms-link" to="/fees">Collect</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
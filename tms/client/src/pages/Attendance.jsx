import React, { useEffect, useState } from "react";
import { CheckCircle2, XCircle, MinusCircle } from "lucide-react";
import api from "../services/api";
import { Input, StatCard } from "../components/UI";
import { todayISO } from "../utils/format";

const STATUSES = ["Present", "Absent", "Leave"];

export default function Attendance({ notify }) {
  const [date, setDate] = useState(todayISO());
  const [students, setStudents] = useState([]);
  const [marks, setMarks] = useState([]);

  const load = () => {
    api.get("/students", { params: { status: "Active" } }).then((res) => setStudents(res.data));
    api.get("/attendance", { params: { date } }).then((res) => setMarks(res.data));
  };
  useEffect(() => { load(); }, [date]);

  const markOf = (studentId) => marks.find((m) => m.student_id === studentId)?.status;

  const mark = async (studentId, status) => {
    await api.post("/attendance", { studentId, date, status });
    load();
  };

  const counts = {
    Present: marks.filter((m) => m.status === "Present").length,
    Absent: marks.filter((m) => m.status === "Absent").length,
    Leave: marks.filter((m) => m.status === "Leave").length,
  };

  return (
    <div>
      <div className="tms-page-head">
        <div><h2>Attendance</h2><p className="tms-page-sub">Mark daily attendance for active students.</p></div>
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ width: 170 }} />
      </div>

      <div className="tms-stats-grid" style={{ marginBottom: 20 }}>
        <StatCard icon={<CheckCircle2 size={18} />} label="Present" value={counts.Present} accent="rgba(76,122,94,0.15)" />
        <StatCard icon={<XCircle size={18} />} label="Absent" value={counts.Absent} accent="rgba(180,72,58,0.15)" />
        <StatCard icon={<MinusCircle size={18} />} label="On Leave" value={counts.Leave} accent="rgba(232,163,61,0.18)" />
      </div>

      <div className="tms-card tms-table-wrap">
        <table className="tms-table">
          <thead><tr><th>Student</th><th>Class</th><th>Mark</th></tr></thead>
          <tbody>
            {students.length === 0 && <tr><td colSpan={3} className="tms-empty">No active students.</td></tr>}
            {students.map((s) => (
              <tr key={s.id}>
                <td>{s.name}</td>
                <td>{s.class}</td>
                <td>
                  <div className="tms-seg">
                    {STATUSES.map((st) => (
                      <button key={st} className={"tms-seg-btn " + (markOf(s.id) === st ? "tms-seg-btn-active-" + st.toLowerCase() : "")} onClick={() => mark(s.id, st)}>
                        {st}
                      </button>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

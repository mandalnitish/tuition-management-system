import React, { useEffect, useState } from "react";
import { Search, Plus, Pencil, Trash2, Eye } from "lucide-react";
import api, { photoUrl } from "../services/api";
import { Field, Input, Select, TextArea, Badge, Modal, IconBtn, Avatar } from "../components/UI";
import { inr, todayISO } from "../utils/format";

function StudentForm({ initial, onSaved, onClose }) {
  const [form, setForm] = useState(initial ? {
    ...initial, admissionDate: initial.admission_date, monthlyFee: initial.monthly_fee,
    fatherName: initial.father_name, motherName: initial.mother_name,
  } : {
    name: "", fatherName: "", motherName: "", mobile: "", address: "",
    class: "", school: "", admissionDate: todayISO(), monthlyFee: "", status: "Active",
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.mobile || !form.monthlyFee || !form.class) return;
    setBusy(true);
    setError("");
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (v !== undefined && v !== null) fd.append(k, v); });
      if (photoFile) fd.append("photo", photoFile);
      if (initial) await api.put(`/students/${initial.id}`, fd);
      else await api.post("/students", fd);
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || "Could not save student.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title={initial ? "Edit Student" : "Add Student"} onClose={onClose} wide>
      <form onSubmit={submit} className="tms-form-grid">
        <label className="tms-avatar-preview" style={{ cursor: "pointer" }}>
          {photoFile ? <img src={URL.createObjectURL(photoFile)} alt="" /> : <Avatar name={form.name} photo={photoUrl(initial?.photo)} size="preview" />}
          <input type="file" accept="image/*" hidden onChange={(e) => setPhotoFile(e.target.files[0])} />
        </label>
        <Field label="Full Name" required><Input value={form.name} onChange={(e) => set("name", e.target.value)} /></Field>
        <Field label="Mobile" required><Input value={form.mobile} onChange={(e) => set("mobile", e.target.value.replace(/\D/g, ""))} maxLength={10} /></Field>
        <Field label="Father's Name"><Input value={form.fatherName || ""} onChange={(e) => set("fatherName", e.target.value)} /></Field>
        <Field label="Mother's Name"><Input value={form.motherName || ""} onChange={(e) => set("motherName", e.target.value)} /></Field>
        <Field label="Class" required><Input value={form.class} onChange={(e) => set("class", e.target.value)} placeholder="e.g. 10th" /></Field>
        <Field label="School"><Input value={form.school || ""} onChange={(e) => set("school", e.target.value)} /></Field>
        <Field label="Admission Date" required><Input type="date" value={form.admissionDate} onChange={(e) => set("admissionDate", e.target.value)} /></Field>
        <Field label="Monthly Fee (₹)" required><Input type="number" min="0" value={form.monthlyFee} onChange={(e) => set("monthlyFee", e.target.value)} /></Field>
        <Field label="Status"><Select value={form.status} onChange={(e) => set("status", e.target.value)}><option>Active</option><option>Inactive</option></Select></Field>
        <Field label="Address"><TextArea rows={2} value={form.address || ""} onChange={(e) => set("address", e.target.value)} /></Field>
        {error && <div className="tms-error" style={{ gridColumn: "1 / -1" }}>{error}</div>}
        <div className="tms-form-actions">
          <button type="button" className="tms-btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="tms-btn-primary" disabled={busy}>{busy ? "Saving..." : "Save Student"}</button>
        </div>
      </form>
    </Modal>
  );
}

function StudentProfile({ student, onClose }) {
  const [report, setReport] = useState(null);
  useEffect(() => { api.get(`/reports/student/${student.id}`).then((res) => setReport(res.data)); }, [student.id]);

  const att = report?.attendance || { Present: 0, Absent: 0, Leave: 0 };
  const attTotal = att.Present + att.Absent + att.Leave;
  const pct = attTotal ? Math.round((att.Present / attTotal) * 100) : null;

  return (
    <Modal title="Student Profile" onClose={onClose} wide>
      <div className="tms-profile-head">
        <Avatar name={student.name} photo={photoUrl(student.photo)} size="lg" />
        <div>
          <div className="tms-profile-name">{student.name}</div>
          <div className="tms-profile-meta">Class {student.class} · {student.school || "—"}</div>
          <div className="tms-profile-meta">{student.mobile} · Joined {student.admission_date}</div>
        </div>
        <div style={{ marginLeft: "auto" }}><Badge status={student.status} /></div>
      </div>
      <div className="tms-profile-stats">
        <div className="tms-mini-stat"><div className="tms-mini-val">{inr(student.monthly_fee)}</div><div className="tms-mini-label">Monthly Fee</div></div>
        <div className="tms-mini-stat"><div className="tms-mini-val">{inr(report?.totalPaid || 0)}</div><div className="tms-mini-label">Total Paid</div></div>
        <div className="tms-mini-stat"><div className="tms-mini-val">{pct !== null ? pct + "%" : "—"}</div><div className="tms-mini-label">Attendance ({att.Present}P / {att.Absent}A / {att.Leave}L)</div></div>
      </div>
      <h4 className="tms-section-title">Payment History</h4>
      <div className="tms-table-wrap">
        <table className="tms-table">
          <thead><tr><th>Month</th><th>Year</th><th>Amount</th><th>Date</th><th>Mode</th><th>Receipt</th></tr></thead>
          <tbody>
            {(!report?.payments || report.payments.length === 0) && <tr><td colSpan={6} className="tms-empty">No payments recorded yet.</td></tr>}
            {report?.payments.map((p) => (
              <tr key={p.id}><td>{p.month}</td><td>{p.year}</td><td className="tms-mono">{inr(p.amount)}</td><td>{p.payment_date}</td><td>{p.payment_mode}</td><td className="tms-mono">{p.receipt_no}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </Modal>
  );
}

export default function Students({ notify }) {
  const [students, setStudents] = useState([]);
  const [query, setQuery] = useState("");
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(null);
  const [profileOf, setProfileOf] = useState(null);

  const load = () => {
    api.get("/students", { params: query ? { search: query } : {} }).then((res) => setStudents(res.data)).catch(() => {});
  };

  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [query]);

  const remove = async (id) => {
    if (!window.confirm("Delete this student? This cannot be undone.")) return;
    await api.delete(`/students/${id}`);
    notify("Student deleted.");
    load();
  };

  return (
    <div>
      <div className="tms-page-head">
        <div><h2>Students</h2><p className="tms-page-sub">{students.length} shown · {students.filter((s) => s.status === "Active").length} active</p></div>
        <button className="tms-btn-primary" onClick={() => setAdding(true)}><Plus size={16} /> Add Student</button>
      </div>

      <div className="tms-toolbar">
        <div className="tms-search">
          <Search size={16} />
          <input placeholder="Search by name, class, mobile, or school..." value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
      </div>

      <div className="tms-card tms-table-wrap">
        <table className="tms-table">
          <thead><tr><th></th><th>Name</th><th>Class</th><th>Mobile</th><th>Monthly Fee</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {students.length === 0 && <tr><td colSpan={7} className="tms-empty">No students found.</td></tr>}
            {students.map((s) => (
              <tr key={s.id}>
                <td data-label=""><Avatar name={s.name} photo={photoUrl(s.photo)} /></td>
                <td data-label="Name"><button className="tms-link" onClick={() => setProfileOf(s)}>{s.name}</button></td>
                <td data-label="Class">{s.class}</td>
                <td data-label="Mobile">{s.mobile}</td>
                <td data-label="Monthly Fee" className="tms-mono">{inr(s.monthly_fee)}</td>
                <td data-label="Status"><Badge status={s.status} /></td>
                <td data-label="Actions">
                  <div className="tms-row-actions">
                    <IconBtn title="View" onClick={() => setProfileOf(s)}><Eye size={15} /></IconBtn>
                    <IconBtn title="Edit" onClick={() => setEditing(s)}><Pencil size={15} /></IconBtn>
                    <IconBtn title="Delete" danger onClick={() => remove(s.id)}><Trash2 size={15} /></IconBtn>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {adding && <StudentForm onSaved={() => { setAdding(false); load(); notify("Student added."); }} onClose={() => setAdding(false)} />}
      {editing && <StudentForm initial={editing} onSaved={() => { setEditing(null); load(); notify("Student updated."); }} onClose={() => setEditing(null)} />}
      {profileOf && <StudentProfile student={profileOf} onClose={() => setProfileOf(null)} />}
    </div>
  );
}
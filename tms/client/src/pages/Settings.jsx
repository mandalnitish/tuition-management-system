import React, { useEffect, useState } from "react";
import api from "../services/api";
import { Field, Input, TextArea } from "../components/UI";

export default function SettingsPage({ notify }) {
  const [form, setForm] = useState({ instituteName: "", phone: "", address: "", upiId: "" });
  const [logoFile, setLogoFile] = useState(null);
  const [pw, setPw] = useState({ current: "", next: "" });
  const [busy, setBusy] = useState(false);
  const [pwBusy, setPwBusy] = useState(false);
  const [pwError, setPwError] = useState("");

  useEffect(() => {
    api.get("/settings").then((res) => {
      const s = res.data || {};
      setForm({ instituteName: s.institute_name || "", phone: s.phone || "", address: s.address || "", upiId: s.upi_id || "" });
    });
  }, []);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const saveInfo = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v || ""));
      if (logoFile) fd.append("logo", logoFile);
      await api.put("/settings", fd);
      notify("Settings saved.");
    } finally {
      setBusy(false);
    }
  };

  const changePw = async (e) => {
    e.preventDefault();
    setPwError("");
    if (!pw.next || pw.next.length < 4) { setPwError("New password must be at least 4 characters."); return; }
    setPwBusy(true);
    try {
      await api.post("/auth/change-password", { currentPassword: pw.current, newPassword: pw.next });
      setPw({ current: "", next: "" });
      notify("Password updated.");
    } catch (err) {
      setPwError(err.response?.data?.message || "Could not update password.");
    } finally {
      setPwBusy(false);
    }
  };

  return (
    <div>
      <div className="tms-page-head"><div><h2>Settings</h2><p className="tms-page-sub">Institute details used on receipts and login.</p></div></div>
      <div className="tms-grid-2">
        <form className="tms-card" style={{ padding: 20 }} onSubmit={saveInfo}>
          <h4 className="tms-section-title" style={{ marginTop: 0 }}>Institute Info</h4>
          <div className="tms-form-grid">
            <Field label="Institute Name"><Input value={form.instituteName} onChange={(e) => set("instituteName", e.target.value)} /></Field>
            <Field label="Phone"><Input value={form.phone} onChange={(e) => set("phone", e.target.value)} /></Field>
            <Field label="UPI ID"><Input value={form.upiId} onChange={(e) => set("upiId", e.target.value)} /></Field>
            <Field label="Address"><TextArea rows={2} value={form.address} onChange={(e) => set("address", e.target.value)} /></Field>
            <Field label="Logo"><Input type="file" accept="image/*" onChange={(e) => setLogoFile(e.target.files[0])} /></Field>
          </div>
          <button className="tms-btn-primary" style={{ marginTop: 14 }} type="submit" disabled={busy}>{busy ? "Saving..." : "Save Info"}</button>
        </form>
        <form className="tms-card" style={{ padding: 20 }} onSubmit={changePw}>
          <h4 className="tms-section-title" style={{ marginTop: 0 }}>Change Password</h4>
          <div className="tms-form-grid">
            <Field label="Current Password"><Input type="password" value={pw.current} onChange={(e) => setPw((p) => ({ ...p, current: e.target.value }))} /></Field>
            <Field label="New Password"><Input type="password" value={pw.next} onChange={(e) => setPw((p) => ({ ...p, next: e.target.value }))} /></Field>
          </div>
          {pwError && <div className="tms-error" style={{ marginTop: 10 }}>{pwError}</div>}
          <button className="tms-btn-primary" style={{ marginTop: 14 }} type="submit" disabled={pwBusy}>{pwBusy ? "Updating..." : "Update Password"}</button>
        </form>
      </div>
    </div>
  );
}

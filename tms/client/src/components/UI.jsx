import React from "react";
import { X, CheckCircle2, XCircle, MinusCircle } from "lucide-react";

export function Field({ label, required, children, hint }) {
  return (
    <label className="tms-field">
      <span className="tms-field-label">{label}{required && <span style={{ color: "var(--rust)" }}> *</span>}</span>
      {children}
      {hint && <span className="tms-field-hint">{hint}</span>}
    </label>
  );
}

export function Input(props) {
  return <input {...props} className={"tms-input " + (props.className || "")} />;
}
export function Select({ children, ...props }) {
  return <select {...props} className={"tms-input " + (props.className || "")}>{children}</select>;
}
export function TextArea(props) {
  return <textarea {...props} className={"tms-input " + (props.className || "")} />;
}

export function Badge({ status }) {
  const map = {
    Paid: { bg: "rgba(76,122,94,0.12)", fg: "var(--sage)", icon: <CheckCircle2 size={13} /> },
    Pending: { bg: "rgba(180,72,58,0.12)", fg: "var(--rust)", icon: null },
    Present: { bg: "rgba(76,122,94,0.12)", fg: "var(--sage)", icon: <CheckCircle2 size={13} /> },
    Absent: { bg: "rgba(180,72,58,0.12)", fg: "var(--rust)", icon: <XCircle size={13} /> },
    Leave: { bg: "rgba(232,163,61,0.15)", fg: "var(--marigold-dark)", icon: <MinusCircle size={13} /> },
    Active: { bg: "rgba(76,122,94,0.12)", fg: "var(--sage)", icon: null },
    Inactive: { bg: "rgba(91,100,114,0.14)", fg: "var(--slate)", icon: null },
  };
  const s = map[status] || map.Pending;
  return (
    <span className="tms-badge" style={{ background: s.bg, color: s.fg }}>
      {s.icon}{status}
    </span>
  );
}

export function StatCard({ icon, label, value, sub, accent }) {
  return (
    <div className="tms-card tms-stat">
      <div className="tms-stat-icon" style={{ background: accent }}>{icon}</div>
      <div>
        <div className="tms-stat-value">{value}</div>
        <div className="tms-stat-label">{label}</div>
        {sub && <div className="tms-stat-sub">{sub}</div>}
      </div>
    </div>
  );
}

export function Modal({ title, onClose, children, wide }) {
  return (
    <div className="tms-modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={"tms-modal " + (wide ? "tms-modal-wide" : "")}>
        <div className="tms-modal-head">
          <h3>{title}</h3>
          <button className="tms-icon-btn" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="tms-modal-body">{children}</div>
      </div>
    </div>
  );
}

export function IconBtn({ title, onClick, children, danger }) {
  return (
    <button title={title} type="button" onClick={onClick} className={"tms-icon-btn" + (danger ? " tms-icon-btn-danger" : "")}>
      {children}
    </button>
  );
}

export function Toast({ message }) {
  if (!message) return null;
  return <div className="tms-toast">{message}</div>;
}

export function Avatar({ name = "", photo, size = "sm" }) {
  const cls = size === "lg" ? "tms-avatar-lg" : size === "preview" ? "tms-avatar-preview" : "tms-avatar-sm";
  const initials = name.trim().split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() || "").join("");
  return <div className={cls}>{photo ? <img src={photo} alt={name} /> : initials}</div>;
}

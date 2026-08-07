import React, { useMemo, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Copy, Check, Share2, ExternalLink } from "lucide-react";
import { Modal, Field, Input, Select } from "./UI";
import { MONTHS, inr, todayISO } from "../utils/format";

// Builds a standard UPI deep link. Any UPI app (GPay, PhonePe, Paytm, BHIM...)
// understands this format when scanned as a QR code or opened as a link.
function buildUpiLink({ upiId, payeeName, amount, note }) {
  const params = new URLSearchParams({
    pa: upiId,
    pn: payeeName || "Tuition Classes",
    am: Number(amount || 0).toFixed(2),
    cu: "INR",
    tn: note || "Tuition Fee",
  });
  return `upi://pay?${params.toString()}`;
}

export default function UpiPayModal({ settings, student, defaultAmount, defaultNote, onClose }) {
  const now = new Date();
  const [amount, setAmount] = useState(defaultAmount || student?.monthly_fee || "");
  const [month, setMonth] = useState(MONTHS[now.getMonth()]);
  const [year, setYear] = useState(now.getFullYear());
  const [copied, setCopied] = useState(false);

  const note = defaultNote || `Fee - ${student?.name || "Student"} - ${month} ${year}`;
  const upiId = settings?.upi_id;

  const link = useMemo(
    () => buildUpiLink({ upiId, payeeName: settings?.institute_name, amount, note }),
    [upiId, settings?.institute_name, amount, note]
  );

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      // clipboard may be unavailable (non-https, older browser) — ignore silently
    }
  };

  const shareWhatsApp = () => {
    const phone = (student?.mobile || "").replace(/\D/g, "");
    const text = `Hi ${student?.name || ""}, please pay ${inr(amount)} for ${month} ${year} tuition fee via this UPI link:\n${link}\n- ${settings?.institute_name || "Tuition Classes"}`;
    const base = phone ? `https://wa.me/91${phone}` : "https://wa.me/";
    window.open(`${base}?text=${encodeURIComponent(text)}`, "_blank");
  };

  if (!upiId) {
    return (
      <Modal title="UPI Payment" onClose={onClose}>
        <p style={{ color: "var(--text-soft)", fontSize: 13.5 }}>
          No UPI ID is set up yet. Go to <strong>Settings</strong> and add your UPI ID
          (e.g. <code>yourname@okhdfcbank</code>) before generating payment links.
        </p>
      </Modal>
    );
  }

  return (
    <Modal title="UPI Payment Link" onClose={onClose}>
      <div className="tms-form-grid" style={{ marginBottom: 14 }}>
        <Field label="Month">
          <Select value={month} onChange={(e) => setMonth(e.target.value)}>{MONTHS.map((m) => <option key={m}>{m}</option>)}</Select>
        </Field>
        <Field label="Year"><Input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} /></Field>
        <Field label="Amount (₹)" hint="Edit if collecting a different amount." >
          <Input type="number" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </Field>
      </div>

      <div style={{ display: "flex", justifyContent: "center", padding: 16, background: "#fff", borderRadius: 12, border: "1px solid var(--border)" }}>
        <QRCodeSVG value={link} size={200} bgColor="#ffffff" fgColor="#1F2A44" level="M" includeMargin />
      </div>
      <p style={{ textAlign: "center", fontSize: 12.5, color: "var(--text-soft)", marginTop: 10 }}>
        Ask the parent to scan this with any UPI app. It pre-fills the amount and a note —
        they just confirm and pay. Mark the fee as Paid from the Fees page once you've
        checked it landed in your account.
      </p>

      <div className="tms-receipt-actions" style={{ marginTop: 14 }}>
        <button className="tms-btn-ghost" onClick={copyLink}>
          {copied ? <Check size={15} /> : <Copy size={15} />} {copied ? "Copied" : "Copy Link"}
        </button>
        <a className="tms-btn-ghost" href={link} style={{ textDecoration: "none" }}>
          <ExternalLink size={15} /> Open in UPI App
        </a>
        <button className="tms-btn-ghost" onClick={shareWhatsApp}><Share2 size={15} /> WhatsApp</button>
      </div>
    </Modal>
  );
}
import React, { useMemo, useRef, useState } from "react";
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

// Renders the (invisible) QR <svg> node to a crisp PNG blob so it can be
// shared/attached as a real image instead of just a link.
function svgElementToPngBlob(svgEl, sizePx = 480) {
  return new Promise((resolve, reject) => {
    try {
      const svgStr = new XMLSerializer().serializeToString(svgEl);
      const svgBlob = new Blob([svgStr], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(svgBlob);
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = sizePx;
        canvas.height = sizePx;
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, sizePx, sizePx);
        ctx.drawImage(img, 0, 0, sizePx, sizePx);
        URL.revokeObjectURL(url);
        canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("toBlob failed"))), "image/png");
      };
      img.onerror = reject;
      img.src = url;
    } catch (e) {
      reject(e);
    }
  });
}

export default function UpiPayModal({ settings, student, defaultAmount, defaultNote, onClose }) {
  const now = new Date();
  const [amount, setAmount] = useState(defaultAmount || student?.monthly_fee || "");
  const [month, setMonth] = useState(MONTHS[now.getMonth()]);
  const [year, setYear] = useState(now.getFullYear());
  const [copied, setCopied] = useState(false);
  const [sharing, setSharing] = useState(false);
  const qrRef = useRef(null);

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

  const shareWhatsApp = async () => {
    const caption = `Hi ${student?.name || ""}, please pay ${inr(amount)} for ${month} ${year} tuition fee. Scan the attached QR with any UPI app (GPay, PhonePe, Paytm...), or use this link:\n${link}\n- ${settings?.institute_name || "Tuition Classes"}`;
    const phone = (student?.mobile || "").replace(/\D/g, "");
    const openWhatsAppText = () => {
      const base = phone ? `https://wa.me/91${phone}` : "https://wa.me/";
      window.open(`${base}?text=${encodeURIComponent(caption)}`, "_blank");
    };

    const svgEl = qrRef.current?.querySelector("svg");
    let file = null;
    if (svgEl) {
      try {
        const blob = await svgElementToPngBlob(svgEl, 480);
        file = new File([blob], `UPI_QR_${student?.name || "payment"}.png`, { type: "image/png" });
      } catch (e) {
        file = null;
      }
    }

    // Web Share API (Level 2): opens the native share sheet where the person
    // can pick WhatsApp and the actual QR image gets attached with this caption.
    if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
      setSharing(true);
      try {
        await navigator.share({ files: [file], title: "UPI Payment QR", text: caption });
      } catch (err) {
        // AbortError = person cancelled the share sheet — nothing more to do
        if (err?.name !== "AbortError") openWhatsAppText();
      } finally {
        setSharing(false);
      }
      return;
    }

    // Fallback for browsers without file-sharing support (mostly desktop):
    // open WhatsApp with the text + link, since the QR image can't be attached here.
    openWhatsAppText();
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

      <div ref={qrRef} style={{ display: "flex", justifyContent: "center", padding: 16, background: "#fff", borderRadius: 12, border: "1px solid var(--border)" }}>
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
        <button className="tms-btn-ghost" onClick={shareWhatsApp} disabled={sharing}>
          <Share2 size={15} /> {sharing ? "Sharing..." : "WhatsApp"}
        </button>
      </div>
    </Modal>
  );
}
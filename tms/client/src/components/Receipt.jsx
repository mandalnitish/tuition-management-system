import React from "react";
import { jsPDF } from "jspdf";
import { Download, Share2, CheckCircle2 } from "lucide-react";
import { Modal } from "./UI";
import { inr } from "../utils/format";

// jsPDF's built-in fonts can't render the ₹ glyph (it prints as a broken box),
// so we draw ₹ as a tiny image (via canvas, using the browser's real font support)
// and place it right before the numeral instead of using "Rs.".
const rupeeIconCache = {};
function rupeeIcon(colorHex) {
  if (rupeeIconCache[colorHex]) return rupeeIconCache[colorHex];
  const size = 64, scale = 4;
  const canvas = document.createElement("canvas");
  canvas.width = size * scale;
  canvas.height = size * scale;
  const ctx = canvas.getContext("2d");
  ctx.scale(scale, scale);
  ctx.fillStyle = colorHex;
  ctx.font = `700 ${size * 0.72}px Arial, Helvetica, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("₹", size / 2, size / 2 + size * 0.03);
  const url = canvas.toDataURL("image/png");
  rupeeIconCache[colorHex] = url;
  return url;
}

// draws a right-aligned "₹ 1,234" group: rupee icon image + numeral text
function drawAmountRs(doc, amount, rightX, baselineY, fontSize, colorHex, colorRgb) {
  const numStr = Number(amount || 0).toLocaleString("en-IN");
  doc.setFontSize(fontSize);
  doc.setTextColor(...colorRgb);
  const textW = doc.getTextWidth(numStr);
  const iconSize = fontSize * 0.85;
  const gap = fontSize * 0.18;
  const iconX = rightX - textW - gap - iconSize;
  const iconY = baselineY - iconSize * 0.78;
  doc.addImage(rupeeIcon(colorHex), "PNG", iconX, iconY, iconSize, iconSize);
  doc.text(numStr, rightX, baselineY, { align: "right" });
}

// hides auto-generated spreadsheet-import notes from customer-facing receipts
const isMigrationNote = (str) => /^migrated from spreadsheet/i.test((str || "").trim());

export default function ReceiptModal({ payment, settings, onClose }) {
  const buildPdfDoc = () => {
    const W = 360, H = 580, M = 28;
    const doc = new jsPDF({ unit: "pt", format: [W, H] });
    const cx = W / 2;
    const contentW = W - M * 2;

    const ink = [31, 42, 68];
    const marigold = [232, 163, 61];
    const marigoldDark = [201, 127, 30];
    const sage = [76, 122, 94];
    const paper = [251, 249, 244];
    const border = [228, 223, 211];
    const soft = [91, 100, 114];
    const text = [35, 42, 56];

    // ---- header banner ----
    doc.setFillColor(...ink);
    doc.rect(0, 0, W, 78, "F");
    doc.setFillColor(...marigold);
    doc.rect(0, 78, W, 3, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(17);
    doc.setTextColor(255, 255, 255);
    doc.text(settings.institute_name || "Tuition Classes", cx, 28, { align: "center" });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...marigold);
    doc.text("FEE PAYMENT RECEIPT", cx, 42, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(200, 206, 218);
    const contactLine = [settings.address, settings.phone ? "Ph: " + settings.phone : ""].filter(Boolean).join("   |   ");
    if (contactLine) {
      const cLines = doc.splitTextToSize(contactLine, contentW);
      doc.text(cLines.slice(0, 2), cx, 56, { align: "center" });
    }

    // ---- receipt no / date strip ----
    let y = 96;
    doc.setFillColor(...paper);
    doc.setDrawColor(...border);
    doc.roundedRect(M, y, contentW, 32, 5, 5, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(...soft);
    doc.text("RECEIPT NO", M + 12, y + 13);
    doc.text("DATE", W - M - 12, y + 13, { align: "right" });
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...text);
    doc.text(String(payment.receipt_no), M + 12, y + 26);
    doc.text(String(payment.payment_date), W - M - 12, y + 26, { align: "right" });

    // ---- billed to / payment for ----
    y += 50;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(...soft);
    doc.text("BILLED TO", M, y);
    doc.text("PAYMENT FOR", cx + 6, y);

    y += 14;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...text);
    doc.text(String(payment.student_name || "-"), M, y);
    doc.text(`${payment.month} ${payment.year}`, cx + 6, y);

    y += 13;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...soft);
    if (payment.student_class) doc.text("Class " + payment.student_class, M, y);
    doc.text(payment.payment_mode || "-", cx + 6, y);

    if (payment.remarks && !isMigrationNote(payment.remarks)) {
      y += 16;
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8.5);
      doc.setTextColor(...soft);
      const remarkLines = doc.splitTextToSize("Remarks: " + payment.remarks, contentW);
      doc.text(remarkLines, M, y);
      y += (remarkLines.length - 1) * 10;
    }

    // ---- amount table (invoice style) ----
    y += 26;
    doc.setFillColor(...ink);
    doc.rect(M, y, contentW, 22, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(255, 255, 255);
    doc.text("DESCRIPTION", M + 10, y + 14);
    doc.text("AMOUNT", W - M - 10, y + 14, { align: "right" });

    y += 22;
    doc.setDrawColor(...border);
    doc.rect(M, y, contentW, 30);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(...text);
    doc.text(`Tuition Fee \u2014 ${payment.month} ${payment.year}`, M + 10, y + 19);
    doc.setFont("helvetica", "bold");
    drawAmountRs(doc, payment.amount, W - M - 10, y + 19, 10.5, "#232A38", text);

    y += 30;
    doc.setFillColor(230, 238, 233);
    doc.rect(M, y, contentW, 36, "F");
    doc.setDrawColor(...border);
    doc.rect(M, y, contentW, 36);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...sage);
    doc.text("TOTAL PAID", M + 10, y + 22);
    drawAmountRs(doc, payment.amount, W - M - 10, y + 24, 17, "#4C7A5E", sage);

    // ---- seal + signature ----
    y += 58;
    doc.setDrawColor(...border);
    doc.setLineDash([2, 2], 0);
    doc.circle(M + 34, y + 6, 22);
    doc.setLineDash([]);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.setTextColor(...border);
    doc.text("OFFICIAL", M + 34, y + 3, { align: "center" });
    doc.text("RECEIPT", M + 34, y + 11, { align: "center" });

    doc.setDrawColor(...text);
    doc.line(W - M - 110, y + 18, W - M, y + 18);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...soft);
    doc.text("Authorized Signatory", W - M - 55, y + 30, { align: "center" });

    // ---- footer ----
    y += 56;
    doc.setDrawColor(...border);
    doc.line(M, y, W - M, y);
    y += 14;
    doc.setFont("helvetica", "italic");
    doc.setFontSize(7.5);
    doc.setTextColor(...soft);
    doc.text("This is a system-generated receipt and does not require a physical signature.", cx, y, { align: "center" });

    y += 16;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...marigoldDark);
    doc.text(`Thank you for choosing ${settings.institute_name || "us"}!`, cx, y, { align: "center" });

    doc.setFillColor(...marigold);
    doc.rect(0, H - 4, W, 4, "F");

    return doc;
  };

  const downloadPdf = () => {
    buildPdfDoc().save(`Receipt_${payment.receipt_no}.pdf`);
  };

  const [sharing, setSharing] = React.useState(false);

  const shareWhatsApp = async () => {
    const fileName = `Receipt_${payment.receipt_no}.pdf`;
    const caption = `Hi ${payment.student_name}, your fee receipt for ${payment.month} ${payment.year} is confirmed.\nAmount: ${inr(payment.amount)}\nReceipt No: ${payment.receipt_no}\nDate: ${payment.payment_date}\n- ${settings.institute_name || "Tuition Classes"}`;
    const phone = (payment.student_mobile || "").replace(/\D/g, "");

    const openWhatsAppText = (note) =>
      window.open(`https://wa.me/91${phone}?text=${encodeURIComponent(caption + note)}`, "_blank");

    let doc = null, file = null;
    try {
      doc = buildPdfDoc();
      file = new File([doc.output("blob")], fileName, { type: "application/pdf" });
    } catch (e) {
      // PDF build failed — fall through to text-only share below
    }

    // Web Share API (Level 2): opens the native share sheet where the person
    // can pick WhatsApp and the actual PDF gets attached with this caption.
    if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
      setSharing(true);
      try {
        await navigator.share({ files: [file], title: "Fee Receipt", text: caption });
      } catch (err) {
        // AbortError = person cancelled the share sheet — nothing more to do
        if (err?.name !== "AbortError") {
          doc.save(fileName);
          openWhatsAppText("\n(PDF downloaded — please attach it here)");
        }
      } finally {
        setSharing(false);
      }
      return;
    }

    // Fallback for browsers without file-sharing support (mostly desktop):
    // download the PDF and open WhatsApp with the text, so it can be attached manually.
    if (doc) doc.save(fileName);
    openWhatsAppText("\n(PDF downloaded — please attach it here)");
  };

  return (
    <Modal title="Fee Receipt" onClose={onClose}>
      <div id="tms-receipt-print" className="tms-receipt">
        <div className="tms-receipt-ribbon" />
        <div className="tms-receipt-badge"><CheckCircle2 size={13} /> Paid</div>

        <div className="tms-receipt-brand">
          <div className="tms-receipt-inst">{settings.institute_name || "Tuition Classes"}</div>
          {settings.address && <div className="tms-receipt-sub">{settings.address}</div>}
          {settings.phone && <div className="tms-receipt-sub">Ph: {settings.phone}</div>}
        </div>

        <div className="tms-receipt-meta">
          <div className="tms-receipt-meta-item">
            <span>Receipt No</span>
            <strong className="tms-mono">{payment.receipt_no}</strong>
          </div>
          <div className="tms-receipt-meta-item tms-receipt-meta-right">
            <span>Date</span>
            <strong className="tms-mono">{payment.payment_date}</strong>
          </div>
        </div>

        <div className="tms-receipt-divider" />

        <div className="tms-receipt-details">
          <div className="tms-receipt-row"><span>Student</span><strong>{payment.student_name}</strong></div>
          {payment.student_class && <div className="tms-receipt-row"><span>Class</span><strong>{payment.student_class}</strong></div>}
          <div className="tms-receipt-row"><span>Month / Year</span><strong>{payment.month} {payment.year}</strong></div>
          <div className="tms-receipt-row"><span>Mode</span><strong>{payment.payment_mode}</strong></div>
          {payment.remarks && !isMigrationNote(payment.remarks) && <div className="tms-receipt-row"><span>Remarks</span><strong>{payment.remarks}</strong></div>}
        </div>

        <div className="tms-receipt-amount-card">
          <span>Amount Paid</span>
          <strong className="tms-mono">{inr(payment.amount)}</strong>
        </div>

        <div className="tms-receipt-foot">Thank you for your payment!<br />Signature: ______________</div>
      </div>

      <div className="tms-receipt-actions no-print">
        <button className="tms-btn-ghost" onClick={downloadPdf}><Download size={15} /> Download PDF</button>
        <button className="tms-btn-ghost" onClick={shareWhatsApp} disabled={sharing}><Share2 size={15} /> {sharing ? "Sharing..." : "WhatsApp"}</button>
      </div>
    </Modal>
  );
}
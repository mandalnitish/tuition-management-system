import React from "react";
import { jsPDF } from "jspdf";
import { Printer, Download, Share2 } from "lucide-react";
import { Modal } from "./UI";
import { inr } from "../utils/format";

export default function ReceiptModal({ payment, settings, onClose }) {
  const doPrint = () => window.print();

  const downloadPdf = () => {
    const doc = new jsPDF({ unit: "pt", format: [320, 480] });
    let y = 40;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text(settings.institute_name || "Tuition Classes", 160, y, { align: "center" });
    y += 18;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    if (settings.address) { doc.text(settings.address, 160, y, { align: "center" }); y += 12; }
    if (settings.phone) { doc.text("Ph: " + settings.phone, 160, y, { align: "center" }); y += 12; }
    y += 8;
    doc.setLineDash([2, 2], 0);
    doc.line(24, y, 296, y);
    y += 20;
    doc.setFontSize(10);
    const row = (label, value) => { doc.text(label, 24, y); doc.text(String(value), 296, y, { align: "right" }); y += 18; };
    row("Receipt No", payment.receipt_no);
    row("Date", payment.payment_date);
    doc.line(24, y, 296, y); y += 20;
    row("Student", payment.student_name);
    row("Month / Year", `${payment.month} ${payment.year}`);
    row("Mode", payment.payment_mode);
    doc.line(24, y, 296, y); y += 20;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    row("Amount Paid", inr(payment.amount));
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    y += 20;
    doc.text("Thank you! Signature: ______________", 160, y, { align: "center" });
    doc.save(`Receipt_${payment.receipt_no}.pdf`);
  };

  const shareWhatsApp = () => {
    const phone = (payment.student_mobile || "").replace(/\D/g, "");
    const text = `Hi ${payment.student_name}, your fee receipt for ${payment.month} ${payment.year} is confirmed.\nAmount: ${inr(payment.amount)}\nReceipt No: ${payment.receipt_no}\nDate: ${payment.payment_date}\n- ${settings.institute_name || "Tuition Classes"}`;
    window.open(`https://wa.me/91${phone}?text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <Modal title="Fee Receipt" onClose={onClose}>
      <div id="tms-receipt-print" className="tms-receipt">
        <div className="tms-receipt-perforation" />
        <div className="tms-receipt-head">
          <div className="tms-receipt-inst">{settings.institute_name || "Tuition Classes"}</div>
          <div className="tms-receipt-sub">{settings.address || ""}</div>
          <div className="tms-receipt-sub">{settings.phone ? "Ph: " + settings.phone : ""}</div>
        </div>
        <div className="tms-receipt-divider" />
        <div className="tms-receipt-row"><span>Receipt No</span><span className="tms-mono">{payment.receipt_no}</span></div>
        <div className="tms-receipt-row"><span>Date</span><span className="tms-mono">{payment.payment_date}</span></div>
        <div className="tms-receipt-divider" />
        <div className="tms-receipt-row"><span>Student</span><span>{payment.student_name}</span></div>
        <div className="tms-receipt-row"><span>Class</span><span>{payment.student_class}</span></div>
        <div className="tms-receipt-row"><span>Month / Year</span><span>{payment.month} {payment.year}</span></div>
        <div className="tms-receipt-row"><span>Mode</span><span>{payment.payment_mode}</span></div>
        {payment.remarks && <div className="tms-receipt-row"><span>Remarks</span><span>{payment.remarks}</span></div>}
        <div className="tms-receipt-divider" />
        <div className="tms-receipt-amount"><span>Amount Paid</span><span className="tms-mono">{inr(payment.amount)}</span></div>
        <div className="tms-receipt-stamp">PAID</div>
        <div className="tms-receipt-foot">Thank you! Signature: ______________</div>
      </div>
      <div className="tms-receipt-actions no-print">
        <button className="tms-btn-ghost" onClick={doPrint}><Printer size={15} /> Print</button>
        <button className="tms-btn-ghost" onClick={downloadPdf}><Download size={15} /> Download PDF</button>
        <button className="tms-btn-ghost" onClick={shareWhatsApp}><Share2 size={15} /> WhatsApp</button>
      </div>
    </Modal>
  );
}

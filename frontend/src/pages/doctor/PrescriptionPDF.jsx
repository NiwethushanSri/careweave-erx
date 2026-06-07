import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { format } from 'date-fns';
import { ArrowLeft, Download, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';

/* ─── Pure jsPDF drawing (no html2canvas) ────────────────────────────────── */
function generatePDF(rx) {
  const wi            = rx.walk_in_patient;
  const patientName   = (wi ? wi.name   : rx.patient_name)   || '—';
  const patientNic    = (wi ? wi.nic    : rx.patient_nic)    || '';
  const patientMobile = (wi ? wi.mobile : rx.patient_mobile) || '';

  const W  = 100;   // page width  (mm) — narrow for mobile readability
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [W, 297] });

  const pad  = 8;
  const gray = '#6b7280';
  const green = '#059669';
  const dark  = '#111827';

  let y = pad;

  // ── helpers ──────────────────────────────────────────────────────
  const txt = (text, x, yy, { size = 9, color = dark, bold = false, align = 'left', maxW } = {}) => {
    pdf.setFontSize(size);
    pdf.setTextColor(color);
    pdf.setFont('helvetica', bold ? 'bold' : 'normal');
    if (maxW) {
      const lines = pdf.splitTextToSize(String(text), maxW);
      pdf.text(lines, x, yy, { align });
      return lines.length * (size * 0.35 + 1);   // return height used
    }
    pdf.text(String(text), x, yy, { align });
    return size * 0.35 + 1;
  };

  const card = (yStart, height, filled = false) => {
    pdf.setFillColor(filled ? '#f9fafb' : '#ffffff');
    pdf.setDrawColor('#e5e7eb');
    pdf.setLineWidth(0.3);
    pdf.roundedRect(pad, yStart, W - pad * 2, height, 2, 2, filled ? 'FD' : 'D');
  };

  const section = (label, yy) => {
    txt(label, pad, yy, { size: 7, color: '#9ca3af', bold: true });
    return 5;
  };

  // ── Header ───────────────────────────────────────────────────────
  txt('CareWeave eRx', pad, y, { size: 13, color: green, bold: true });
  txt('Ministry of Health Sri Lanka', pad, y + 5, { size: 7, color: gray });
  txt(rx.prescription_code, W - pad, y, { size: 7, color: green, bold: true, align: 'right' });

  const statusBg = rx.status === 'dispensed' ? '#d1fae5' : rx.status === 'sent' ? '#dbeafe' : '#fef3c7';
  const statusFg = rx.status === 'dispensed' ? '#065f46' : rx.status === 'sent' ? '#1e40af' : '#92400e';
  pdf.setFillColor(statusBg);
  pdf.roundedRect(W - pad - 20, y + 6, 20, 5, 1, 1, 'F');
  txt(rx.status.toUpperCase(), W - pad - 10, y + 9.5, { size: 6, color: statusFg, bold: true, align: 'center' });

  y += 14;
  pdf.setDrawColor(green);
  pdf.setLineWidth(0.6);
  pdf.line(pad, y, W - pad, y);
  y += 5;

  // ── Doctor ───────────────────────────────────────────────────────
  y += section('PRESCRIBING DOCTOR', y);
  const doctorCardY = y; y += 2;
  txt(`Dr. ${rx.doctor_name}`, pad + 2, y, { size: 9, bold: true });  y += 4.5;
  txt(`SLMC: ${rx.slmc_number}`, pad + 2, y, { size: 7.5, color: gray }); y += 4;
  if (rx.specialisation) { txt(rx.specialisation, pad + 2, y, { size: 7.5, color: gray }); y += 4; }
  if (rx.clinic_name)    { txt(rx.clinic_name,    pad + 2, y, { size: 7.5, color: gray }); y += 4; }
  card(doctorCardY - 1, y - doctorCardY + 2, true);
  y += 3;

  // ── Patient ──────────────────────────────────────────────────────
  y += section(`PATIENT${wi ? ' (WALK-IN)' : ''}`, y);
  const patientCardY = y; y += 2;
  txt(patientName, pad + 2, y, { size: 9, bold: true }); y += 4.5;
  if (patientNic)    { txt(`NIC: ${patientNic}`,       pad + 2, y, { size: 7.5, color: gray }); y += 4; }
  if (patientMobile) { txt(`Mobile: ${patientMobile}`, pad + 2, y, { size: 7.5, color: gray }); y += 4; }
  card(patientCardY - 1, y - patientCardY + 2, true);
  y += 3;

  // ── Clinical Details ─────────────────────────────────────────────
  y += section('CLINICAL DETAILS', y);
  const clinCardY = y; y += 2;
  if (rx.diagnosis) {
    txt('Diagnosis: ', pad + 2, y, { size: 7.5, color: gray });
    txt(rx.diagnosis, pad + 22, y, { size: 7.5, bold: true }); y += 4;
  }
  txt(`Date: ${format(new Date(rx.created_at), 'dd MMM yyyy')}`,   pad + 2, y, { size: 7.5, color: gray }); y += 4;
  txt(`Valid until: ${format(new Date(rx.valid_until), 'dd MMM yyyy')}`, pad + 2, y, { size: 7.5, color: gray }); y += 4;
  if (rx.notes) {
    const noteLines = pdf.splitTextToSize(`"${rx.notes}"`, W - pad * 2 - 4);
    pdf.setFontSize(7); pdf.setTextColor(gray); pdf.setFont('helvetica', 'italic');
    pdf.text(noteLines, pad + 2, y);
    y += noteLines.length * 3.5 + 1;
  }
  card(clinCardY - 1, y - clinCardY + 2, true);
  y += 3;

  // ── Medicines ─────────────────────────────────────────────────────
  y += section('PRESCRIBED MEDICINES', y);
  (rx.medicines || []).forEach((med, i) => {
    const medCardY = y; y += 2;
    txt(`${i + 1}. ${med.medicine_name}`, pad + 2, y, { size: 8.5, bold: true });
    txt(med.dosage, W - pad - 2, y, { size: 8, color: green, bold: true, align: 'right' });
    y += 4.5;
    txt(`Qty: ${med.quantity}  |  Freq: ${med.frequency || '—'}`, pad + 2, y, { size: 7, color: gray }); y += 3.5;
    if (med.instructions) {
      const iLines = pdf.splitTextToSize(`Note: ${med.instructions}`, W - pad * 2 - 4);
      pdf.setFontSize(7); pdf.setTextColor(gray); pdf.setFont('helvetica', 'normal');
      pdf.text(iLines, pad + 2, y);
      y += iLines.length * 3.2 + 0.5;
    }
    card(medCardY - 1, y - medCardY + 2, i % 2 === 0);
    y += 3;
  });

  // ── QR code ──────────────────────────────────────────────────────
  if (rx.qr_code) {
    try {
      y += section('VERIFICATION QR', y);
      pdf.addImage(rx.qr_code, 'PNG', W / 2 - 15, y, 30, 30);
      y += 33;
    } catch (_) {}
  }

  // ── Pharmacy ─────────────────────────────────────────────────────
  if (rx.pharmacy_name) {
    y += section('DISPENSING PHARMACY', y);
    const phCardY = y; y += 2;
    txt(rx.pharmacy_name, pad + 2, y, { size: 8.5, bold: true }); y += 4.5;
    if (rx.pharmacy_address) { txt(rx.pharmacy_address, pad + 2, y, { size: 7.5, color: gray }); y += 4; }
    if (rx.dispensed_at) { txt(`Dispensed: ${format(new Date(rx.dispensed_at), 'dd MMM yyyy HH:mm')}`, pad + 2, y, { size: 7.5, color: green, bold: true }); y += 4; }
    card(phCardY - 1, y - phCardY + 2, true);
    y += 3;
  }

  // ── Footer ───────────────────────────────────────────────────────
  y += 2;
  pdf.setDrawColor('#e5e7eb'); pdf.setLineWidth(0.2);
  pdf.line(pad, y, W - pad, y); y += 4;
  txt('Digitally verified prescription · CareWeave eRx', W / 2, y, { size: 6.5, color: '#9ca3af', align: 'center' }); y += 3.5;
  txt(`careweave-erx.vercel.app · ${rx.prescription_code}`, W / 2, y, { size: 6, color: '#9ca3af', align: 'center' });

  // ── Trim page height ─────────────────────────────────────────────
  const finalHeight = y + 8;
  const trimmed = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [W, finalHeight] });
  // Re-generate into correctly-sized PDF
  return generatePDFToDoc(rx, W, finalHeight);
}

/* Re-generates into a correctly-sized doc */
function generatePDFToDoc(rx, W, H) {
  const wi            = rx.walk_in_patient;
  const patientName   = (wi ? wi.name   : rx.patient_name)   || '—';
  const patientNic    = (wi ? wi.nic    : rx.patient_nic)    || '';
  const patientMobile = (wi ? wi.mobile : rx.patient_mobile) || '';
  const green = '#059669'; const gray = '#6b7280'; const dark = '#111827';
  const pad = 8;

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [W, H] });
  let y = pad;

  const txt = (text, x, yy, { size = 9, color = dark, bold = false, align = 'left', maxW } = {}) => {
    pdf.setFontSize(size); pdf.setTextColor(color); pdf.setFont('helvetica', bold ? 'bold' : 'normal');
    if (maxW) { const lines = pdf.splitTextToSize(String(text), maxW); pdf.text(lines, x, yy, { align }); return lines.length * (size * 0.35 + 1); }
    pdf.text(String(text), x, yy, { align }); return size * 0.35 + 1;
  };
  const card = (yStart, height, filled = false) => {
    pdf.setFillColor(filled ? '#f9fafb' : '#ffffff'); pdf.setDrawColor('#e5e7eb'); pdf.setLineWidth(0.3);
    pdf.roundedRect(pad, yStart, W - pad * 2, height, 2, 2, filled ? 'FD' : 'D');
  };
  const section = (label, yy) => { txt(label, pad, yy, { size: 7, color: '#9ca3af', bold: true }); return 5; };

  txt('CareWeave eRx', pad, y, { size: 13, color: green, bold: true });
  txt('Ministry of Health Sri Lanka', pad, y + 5, { size: 7, color: gray });
  txt(rx.prescription_code, W - pad, y, { size: 7, color: green, bold: true, align: 'right' });
  const statusBg = rx.status === 'dispensed' ? '#d1fae5' : rx.status === 'sent' ? '#dbeafe' : '#fef3c7';
  const statusFg = rx.status === 'dispensed' ? '#065f46' : rx.status === 'sent' ? '#1e40af' : '#92400e';
  pdf.setFillColor(statusBg); pdf.roundedRect(W - pad - 20, y + 6, 20, 5, 1, 1, 'F');
  txt(rx.status.toUpperCase(), W - pad - 10, y + 9.5, { size: 6, color: statusFg, bold: true, align: 'center' });
  y += 14; pdf.setDrawColor(green); pdf.setLineWidth(0.6); pdf.line(pad, y, W - pad, y); y += 5;

  y += section('PRESCRIBING DOCTOR', y);
  const d1 = y; y += 2;
  txt(`Dr. ${rx.doctor_name}`, pad + 2, y, { size: 9, bold: true }); y += 4.5;
  txt(`SLMC: ${rx.slmc_number}`, pad + 2, y, { size: 7.5, color: gray }); y += 4;
  if (rx.specialisation) { txt(rx.specialisation, pad + 2, y, { size: 7.5, color: gray }); y += 4; }
  if (rx.clinic_name)    { txt(rx.clinic_name,    pad + 2, y, { size: 7.5, color: gray }); y += 4; }
  card(d1 - 1, y - d1 + 2, true); y += 3;

  y += section(`PATIENT${wi ? ' (WALK-IN)' : ''}`, y);
  const d2 = y; y += 2;
  txt(patientName, pad + 2, y, { size: 9, bold: true }); y += 4.5;
  if (patientNic)    { txt(`NIC: ${patientNic}`,       pad + 2, y, { size: 7.5, color: gray }); y += 4; }
  if (patientMobile) { txt(`Mobile: ${patientMobile}`, pad + 2, y, { size: 7.5, color: gray }); y += 4; }
  card(d2 - 1, y - d2 + 2, true); y += 3;

  y += section('CLINICAL DETAILS', y);
  const d3 = y; y += 2;
  if (rx.diagnosis) { txt('Diagnosis: ', pad + 2, y, { size: 7.5, color: gray }); txt(rx.diagnosis, pad + 22, y, { size: 7.5, bold: true }); y += 4; }
  txt(`Date: ${format(new Date(rx.created_at), 'dd MMM yyyy')}`,        pad + 2, y, { size: 7.5, color: gray }); y += 4;
  txt(`Valid until: ${format(new Date(rx.valid_until), 'dd MMM yyyy')}`, pad + 2, y, { size: 7.5, color: gray }); y += 4;
  if (rx.notes) {
    const nl = pdf.splitTextToSize(`"${rx.notes}"`, W - pad * 2 - 4);
    pdf.setFontSize(7); pdf.setTextColor(gray); pdf.setFont('helvetica', 'italic');
    pdf.text(nl, pad + 2, y); y += nl.length * 3.5 + 1;
  }
  card(d3 - 1, y - d3 + 2, true); y += 3;

  y += section('PRESCRIBED MEDICINES', y);
  (rx.medicines || []).forEach((med, i) => {
    const dm = y; y += 2;
    txt(`${i + 1}. ${med.medicine_name}`, pad + 2, y, { size: 8.5, bold: true });
    txt(med.dosage, W - pad - 2, y, { size: 8, color: green, bold: true, align: 'right' }); y += 4.5;
    txt(`Qty: ${med.quantity}  |  Freq: ${med.frequency || '—'}`, pad + 2, y, { size: 7, color: gray }); y += 3.5;
    if (med.instructions) {
      const il = pdf.splitTextToSize(`Note: ${med.instructions}`, W - pad * 2 - 4);
      pdf.setFontSize(7); pdf.setTextColor(gray); pdf.setFont('helvetica', 'normal');
      pdf.text(il, pad + 2, y); y += il.length * 3.2 + 0.5;
    }
    card(dm - 1, y - dm + 2, i % 2 === 0); y += 3;
  });

  if (rx.qr_code) {
    try {
      y += section('VERIFICATION QR', y);
      pdf.addImage(rx.qr_code, 'PNG', W / 2 - 15, y, 30, 30); y += 33;
    } catch (_) {}
  }

  if (rx.pharmacy_name) {
    y += section('DISPENSING PHARMACY', y);
    const dp = y; y += 2;
    txt(rx.pharmacy_name, pad + 2, y, { size: 8.5, bold: true }); y += 4.5;
    if (rx.pharmacy_address) { txt(rx.pharmacy_address, pad + 2, y, { size: 7.5, color: gray }); y += 4; }
    if (rx.dispensed_at) { txt(`Dispensed: ${format(new Date(rx.dispensed_at), 'dd MMM yyyy HH:mm')}`, pad + 2, y, { size: 7.5, color: green, bold: true }); y += 4; }
    card(dp - 1, y - dp + 2, true); y += 3;
  }

  y += 2; pdf.setDrawColor('#e5e7eb'); pdf.setLineWidth(0.2); pdf.line(pad, y, W - pad, y); y += 4;
  txt('Digitally verified prescription · CareWeave eRx', W / 2, y, { size: 6.5, color: '#9ca3af', align: 'center' }); y += 3.5;
  txt(`careweave-erx.vercel.app · ${rx.prescription_code}`, W / 2, y, { size: 6, color: '#9ca3af', align: 'center' });

  return pdf;
}

/* ─── Main page ─────────────────────────────────────────────────────────── */
export default function PrescriptionPDF() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [prescription, setPrescription] = useState(null);
  const [loading, setLoading]       = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    api.get(`/prescriptions/${id}`)
      .then(r => setPrescription(r.data.data))
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDownload = async () => {
    setGenerating(true);
    try {
      // First pass: measure content height
      const draft = generatePDF(prescription);
      draft.save(`CareWeave_Rx_${prescription.prescription_code}.pdf`);
      toast.success('PDF downloaded!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate PDF');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <Loader2 className="w-8 h-8 text-brand-600 animate-spin mx-auto mb-2" />
        <p className="text-gray-400 text-sm">Loading prescription…</p>
      </div>
    </div>
  );
  if (!prescription) return <div className="p-8 text-center text-gray-400">Prescription not found</div>;

  const wi            = prescription.walk_in_patient;
  const patientName   = wi ? wi.name   : prescription.patient_name;
  const patientNic    = wi ? wi.nic    : prescription.patient_nic;
  const patientMobile = wi ? wi.mobile : prescription.patient_mobile;
  const statusColor   =
    prescription.status === 'dispensed' ? 'bg-green-100 text-green-800' :
    prescription.status === 'sent'      ? 'bg-blue-100 text-blue-800'   : 'bg-yellow-100 text-yellow-800';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 shadow-sm">
        <button onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-gray-500 hover:text-gray-800 text-sm font-medium">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <p className="flex-1 text-center text-xs text-gray-400 font-mono truncate">
          {prescription.prescription_code}
        </p>
        <button onClick={handleDownload} disabled={generating}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-60
                     text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors shadow-sm shrink-0">
          {generating
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</>
            : <><Download className="w-4 h-4" /> Download PDF</>}
        </button>
      </div>

      {/* Mobile preview */}
      <div className="max-w-lg mx-auto py-5 px-4 space-y-3">
        <div className="flex items-start justify-between border-b-2 border-green-600 pb-3">
          <div><h1 className="text-base font-bold text-green-700">CareWeave eRx</h1><p className="text-xs text-gray-400">Ministry of Health Sri Lanka</p></div>
          <div className="text-right shrink-0 ml-2">
            <p className="text-xs text-gray-400">Prescription</p>
            <p className="text-xs font-bold text-green-700 font-mono">{prescription.prescription_code}</p>
            <span className={`inline-block mt-1 text-xs font-semibold px-2 py-0.5 rounded-full ${statusColor}`}>{prescription.status.toUpperCase()}</span>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-3 shadow-sm">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1.5">Prescribing Doctor</p>
          <p className="font-bold text-sm">Dr. {prescription.doctor_name}</p>
          <p className="text-xs text-gray-500">SLMC: {prescription.slmc_number}</p>
          {prescription.specialisation && <p className="text-xs text-gray-500">{prescription.specialisation}</p>}
          {prescription.clinic_name    && <p className="text-xs text-gray-500">{prescription.clinic_name}</p>}
        </div>
        <div className="bg-white rounded-2xl p-3 shadow-sm">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1.5">Patient {wi && <span className="text-yellow-600">(Walk-in)</span>}</p>
          <p className="font-bold text-sm">{patientName || '—'}</p>
          {patientNic    && <p className="text-xs text-gray-500">NIC: {patientNic}</p>}
          {patientMobile && <p className="text-xs text-gray-500">Mobile: {patientMobile}</p>}
        </div>
        <div className="bg-white rounded-2xl p-3 shadow-sm">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1.5">Clinical Details</p>
          {prescription.diagnosis && <p className="text-sm mb-1"><span className="text-gray-400 text-xs">Diagnosis: </span><strong>{prescription.diagnosis}</strong></p>}
          <p className="text-xs text-gray-500">Date: {format(new Date(prescription.created_at), 'dd MMM yyyy')}</p>
          <p className="text-xs text-gray-500">Valid until: {format(new Date(prescription.valid_until), 'dd MMM yyyy')}</p>
          {prescription.notes && <p className="text-xs text-gray-500 italic mt-2 pt-2 border-t border-gray-100">"{prescription.notes}"</p>}
        </div>
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Prescribed Medicines</p>
          <div className="space-y-2">
            {prescription.medicines?.map((med, i) => (
              <div key={i} className="bg-white rounded-2xl p-3 shadow-sm">
                <div className="flex justify-between"><div><p className="font-semibold text-sm">{med.medicine_name}</p><p className="text-xs font-semibold text-green-700">{med.dosage}</p></div><span className="text-xs text-gray-300">#{i+1}</span></div>
                <div className="flex gap-4 mt-2 text-xs flex-wrap"><div><span className="text-gray-400">Qty </span>{med.quantity}</div><div><span className="text-gray-400">Freq </span>{med.frequency||'—'}</div><div className="flex-1"><span className="text-gray-400">Note </span>{med.instructions||'—'}</div></div>
              </div>
            ))}
          </div>
        </div>
        {prescription.qr_code && (
          <div className="bg-white rounded-2xl p-3 shadow-sm text-center">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Verification QR</p>
            <img src={prescription.qr_code} alt="QR" className="w-28 h-28 mx-auto" />
          </div>
        )}
        {prescription.pharmacy_name && (
          <div className="bg-white rounded-2xl p-3 shadow-sm">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1.5">Dispensing Pharmacy</p>
            <p className="font-bold text-sm">{prescription.pharmacy_name}</p>
            {prescription.pharmacy_address && <p className="text-xs text-gray-500">{prescription.pharmacy_address}</p>}
            {prescription.dispensed_at && <p className="text-xs text-green-700 font-semibold mt-1">Dispensed: {format(new Date(prescription.dispensed_at),'dd MMM yyyy HH:mm')}</p>}
          </div>
        )}
        <p className="text-center text-xs text-gray-400 pb-4">CareWeave eRx · Ministry of Health Sri Lanka</p>
      </div>
    </div>
  );
}

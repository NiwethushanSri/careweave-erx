import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { format } from 'date-fns';
import { ArrowLeft, Download, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';

/* ─── Generate PDF using native jsPDF drawing ───────────────────────────── */
function generatePDF(rx) {
  const wi            = rx.walk_in_patient;
  const patientName   = (wi ? wi.name   : rx.patient_name)   || '—';
  const patientNic    = wi ? wi.nic    : rx.patient_nic;
  const patientMobile = wi ? wi.mobile : rx.patient_mobile;

  const W   = 100;   // page width mm
  const pad = 7;
  const iW  = W - pad * 2;  // inner width
  const green = '#059669'; const gray = '#6b7280'; const dark = '#111827'; const light = '#9ca3af';

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [W, 400] });

  /* helpers */
  const font  = (size, color, bold = false) => {
    pdf.setFontSize(size);
    pdf.setTextColor(color);
    pdf.setFont('helvetica', bold ? 'bold' : 'normal');
  };
  const write = (text, x, y, opts = {}) => {
    font(opts.size || 8, opts.color || dark, opts.bold || false);
    const lines = pdf.splitTextToSize(String(text || ''), opts.maxW || iW);
    pdf.text(lines, x, y, { align: opts.align || 'left' });
    return lines.length * ((opts.size || 8) * 0.38);
  };
  const hline = (y, color = '#e5e7eb') => {
    pdf.setDrawColor(color); pdf.setLineWidth(0.25); pdf.line(pad, y, W - pad, y);
  };
  const sectionLabel = (text, y) => {
    font(6.5, light, true);
    pdf.text(text, pad, y);
    return 4.5;
  };

  let y = pad;

  /* ── Header ── */
  write('CareWeave eRx', pad, y, { size: 13, color: green, bold: true });
  write(rx.prescription_code, W - pad, y, { size: 7, color: green, bold: true, align: 'right' });
  y += 5;
  write('Ministry of Health Sri Lanka', pad, y, { size: 7, color: gray });

  /* Status badge */
  const sBg = rx.status === 'dispensed' ? '#d1fae5' : rx.status === 'sent' ? '#dbeafe' : '#fef3c7';
  const sFg = rx.status === 'dispensed' ? '#065f46' : rx.status === 'sent' ? '#1e40af' : '#92400e';
  pdf.setFillColor(sBg);
  pdf.roundedRect(W - pad - 22, y - 3.5, 22, 5.5, 1.2, 1.2, 'F');
  font(6, sFg, true);
  pdf.text(rx.status.toUpperCase(), W - pad - 11, y + 0.5, { align: 'center' });

  y += 5;
  pdf.setDrawColor(green); pdf.setLineWidth(0.7); pdf.line(pad, y, W - pad, y);
  y += 5;

  /* ── Doctor ── */
  y += sectionLabel('PRESCRIBING DOCTOR', y);
  write(`Dr. ${rx.doctor_name}`, pad, y, { size: 9, bold: true }); y += 4.5;
  write(`SLMC: ${rx.slmc_number}`, pad, y, { size: 7.5, color: gray }); y += 4;
  if (rx.specialisation) { write(rx.specialisation, pad, y, { size: 7.5, color: gray }); y += 4; }
  if (rx.clinic_name)    { write(rx.clinic_name,    pad, y, { size: 7.5, color: gray }); y += 4; }
  hline(y); y += 4;

  /* ── Patient ── */
  y += sectionLabel(`PATIENT${wi ? ' (WALK-IN)' : ''}`, y);
  write(patientName, pad, y, { size: 9, bold: true }); y += 4.5;
  if (patientNic)    { write(`NIC: ${patientNic}`,       pad, y, { size: 7.5, color: gray }); y += 4; }
  if (patientMobile) { write(`Mobile: ${patientMobile}`, pad, y, { size: 7.5, color: gray }); y += 4; }
  hline(y); y += 4;

  /* ── Clinical Details ── */
  y += sectionLabel('CLINICAL DETAILS', y);
  if (rx.diagnosis) {
    write('Diagnosis:', pad, y, { size: 7.5, color: gray });
    write(rx.diagnosis, pad + 20, y, { size: 7.5, bold: true, maxW: iW - 20 }); y += 4;
  }
  write(`Date: ${format(new Date(rx.created_at), 'dd MMM yyyy')}`, pad, y, { size: 7.5, color: gray }); y += 4;
  write(`Valid until: ${format(new Date(rx.valid_until), 'dd MMM yyyy')}`, pad, y, { size: 7.5, color: gray }); y += 4;
  if (rx.notes) {
    const noteLines = pdf.splitTextToSize(`"${rx.notes}"`, iW);
    font(7, gray, false);
    pdf.setFont('helvetica', 'italic');
    pdf.text(noteLines, pad, y);
    y += noteLines.length * 3.5 + 1;
  }
  hline(y); y += 4;

  /* ── Medicines ── */
  y += sectionLabel('PRESCRIBED MEDICINES', y);
  (rx.medicines || []).forEach((med, i) => {
    /* alternating light bg */
    if (i % 2 === 0) {
      pdf.setFillColor('#f9fafb');
      pdf.rect(pad - 1, y - 1, iW + 2, 16, 'F');
    }
    write(`${i + 1}. ${med.medicine_name}`, pad, y, { size: 8.5, bold: true });
    write(med.dosage, W - pad, y, { size: 8, color: green, bold: true, align: 'right' });
    y += 4.5;
    write(`Qty: ${med.quantity}   Freq: ${med.frequency || '—'}`, pad, y, { size: 7, color: gray }); y += 3.5;
    if (med.instructions) {
      const il = pdf.splitTextToSize(`Note: ${med.instructions}`, iW);
      font(6.5, gray, false);
      pdf.text(il, pad, y);
      y += il.length * 3 + 0.5;
    }
    hline(y, '#f3f4f6'); y += 3;
  });
  y += 1;

  /* ── QR code ── */
  if (rx.qr_code) {
    try {
      hline(y); y += 4;
      y += sectionLabel('VERIFICATION QR', y);
      pdf.addImage(rx.qr_code, 'PNG', W / 2 - 15, y, 30, 30);
      y += 33;
    } catch (_) {}
  }

  /* ── Pharmacy ── */
  if (rx.pharmacy_name) {
    hline(y); y += 4;
    y += sectionLabel('DISPENSING PHARMACY', y);
    write(rx.pharmacy_name, pad, y, { size: 8.5, bold: true }); y += 4.5;
    if (rx.pharmacy_address) { write(rx.pharmacy_address, pad, y, { size: 7.5, color: gray }); y += 4; }
    if (rx.dispensed_at) {
      write(`Dispensed: ${format(new Date(rx.dispensed_at), 'dd MMM yyyy HH:mm')}`, pad, y, { size: 7.5, color: green, bold: true });
      y += 4;
    }
  }

  /* ── Footer ── */
  y += 3;
  hline(y); y += 4;
  font(6.5, light, false);
  pdf.text('Digitally verified prescription · CareWeave eRx', W / 2, y, { align: 'center' }); y += 3.5;
  pdf.text(`careweave-erx.vercel.app · ${rx.prescription_code}`, W / 2, y, { align: 'center' });

  /* ── Re-render to exact page size ── */
  const finalH = y + pad;
  const pdf2   = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [W, finalH] });
  // copy page data by re-running (jsPDF doesn't support resize after creation)
  return buildFinalPDF(rx, W, finalH);
}

function buildFinalPDF(rx, W, H) {
  const wi            = rx.walk_in_patient;
  const patientName   = (wi ? wi.name   : rx.patient_name)   || '—';
  const patientNic    = wi ? wi.nic    : rx.patient_nic;
  const patientMobile = wi ? wi.mobile : rx.patient_mobile;

  const pad = 7; const iW = W - pad * 2;
  const green = '#059669'; const gray = '#6b7280'; const dark = '#111827'; const light = '#9ca3af';
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [W, H] });

  const font = (size, color, bold = false) => {
    pdf.setFontSize(size); pdf.setTextColor(color); pdf.setFont('helvetica', bold ? 'bold' : 'normal');
  };
  const write = (text, x, y, opts = {}) => {
    font(opts.size || 8, opts.color || dark, opts.bold || false);
    const lines = pdf.splitTextToSize(String(text || ''), opts.maxW || iW);
    pdf.text(lines, x, y, { align: opts.align || 'left' });
    return lines.length * ((opts.size || 8) * 0.38);
  };
  const hline = (y, color = '#e5e7eb') => {
    pdf.setDrawColor(color); pdf.setLineWidth(0.25); pdf.line(pad, y, W - pad, y);
  };
  const slabel = (text, y) => { font(6.5, light, true); pdf.text(text, pad, y); return 4.5; };

  let y = pad;

  write('CareWeave eRx', pad, y, { size: 13, color: green, bold: true });
  write(rx.prescription_code, W - pad, y, { size: 7, color: green, bold: true, align: 'right' });
  y += 5;
  write('Ministry of Health Sri Lanka', pad, y, { size: 7, color: gray });
  const sBg = rx.status === 'dispensed' ? '#d1fae5' : rx.status === 'sent' ? '#dbeafe' : '#fef3c7';
  const sFg = rx.status === 'dispensed' ? '#065f46' : rx.status === 'sent' ? '#1e40af' : '#92400e';
  pdf.setFillColor(sBg); pdf.roundedRect(W - pad - 22, y - 3.5, 22, 5.5, 1.2, 1.2, 'F');
  font(6, sFg, true); pdf.text(rx.status.toUpperCase(), W - pad - 11, y + 0.5, { align: 'center' });
  y += 5; pdf.setDrawColor(green); pdf.setLineWidth(0.7); pdf.line(pad, y, W - pad, y); y += 5;

  y += slabel('PRESCRIBING DOCTOR', y);
  write(`Dr. ${rx.doctor_name}`, pad, y, { size: 9, bold: true }); y += 4.5;
  write(`SLMC: ${rx.slmc_number}`, pad, y, { size: 7.5, color: gray }); y += 4;
  if (rx.specialisation) { write(rx.specialisation, pad, y, { size: 7.5, color: gray }); y += 4; }
  if (rx.clinic_name)    { write(rx.clinic_name,    pad, y, { size: 7.5, color: gray }); y += 4; }
  hline(y); y += 4;

  y += slabel(`PATIENT${wi ? ' (WALK-IN)' : ''}`, y);
  write(patientName, pad, y, { size: 9, bold: true }); y += 4.5;
  if (patientNic)    { write(`NIC: ${patientNic}`,       pad, y, { size: 7.5, color: gray }); y += 4; }
  if (patientMobile) { write(`Mobile: ${patientMobile}`, pad, y, { size: 7.5, color: gray }); y += 4; }
  hline(y); y += 4;

  y += slabel('CLINICAL DETAILS', y);
  if (rx.diagnosis) {
    write('Diagnosis:', pad, y, { size: 7.5, color: gray });
    write(rx.diagnosis, pad + 20, y, { size: 7.5, bold: true, maxW: iW - 20 }); y += 4;
  }
  write(`Date: ${format(new Date(rx.created_at), 'dd MMM yyyy')}`,        pad, y, { size: 7.5, color: gray }); y += 4;
  write(`Valid until: ${format(new Date(rx.valid_until), 'dd MMM yyyy')}`, pad, y, { size: 7.5, color: gray }); y += 4;
  if (rx.notes) {
    const nl = pdf.splitTextToSize(`"${rx.notes}"`, iW);
    font(7, gray, false); pdf.setFont('helvetica', 'italic'); pdf.text(nl, pad, y);
    y += nl.length * 3.5 + 1;
  }
  hline(y); y += 4;

  y += slabel('PRESCRIBED MEDICINES', y);
  (rx.medicines || []).forEach((med, i) => {
    if (i % 2 === 0) { pdf.setFillColor('#f9fafb'); pdf.rect(pad - 1, y - 1, iW + 2, 14, 'F'); }
    write(`${i + 1}. ${med.medicine_name}`, pad, y, { size: 8.5, bold: true });
    write(med.dosage, W - pad, y, { size: 8, color: green, bold: true, align: 'right' }); y += 4.5;
    write(`Qty: ${med.quantity}   Freq: ${med.frequency || '—'}`, pad, y, { size: 7, color: gray }); y += 3.5;
    if (med.instructions) {
      const il = pdf.splitTextToSize(`Note: ${med.instructions}`, iW);
      font(6.5, gray, false); pdf.text(il, pad, y); y += il.length * 3 + 0.5;
    }
    hline(y, '#f3f4f6'); y += 3;
  });
  y += 1;

  if (rx.qr_code) {
    try {
      hline(y); y += 4; y += slabel('VERIFICATION QR', y);
      pdf.addImage(rx.qr_code, 'PNG', W / 2 - 15, y, 30, 30); y += 33;
    } catch (_) {}
  }

  if (rx.pharmacy_name) {
    hline(y); y += 4; y += slabel('DISPENSING PHARMACY', y);
    write(rx.pharmacy_name, pad, y, { size: 8.5, bold: true }); y += 4.5;
    if (rx.pharmacy_address) { write(rx.pharmacy_address, pad, y, { size: 7.5, color: gray }); y += 4; }
    if (rx.dispensed_at) { write(`Dispensed: ${format(new Date(rx.dispensed_at), 'dd MMM yyyy HH:mm')}`, pad, y, { size: 7.5, color: green, bold: true }); y += 4; }
  }

  y += 3; hline(y); y += 4;
  font(6.5, light, false);
  pdf.text('Digitally verified prescription · CareWeave eRx', W / 2, y, { align: 'center' }); y += 3.5;
  pdf.text(`careweave-erx.vercel.app · ${rx.prescription_code}`, W / 2, y, { align: 'center' });

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

  const handleDownload = () => {
    setGenerating(true);
    try {
      const pdf = generatePDF(prescription);
      pdf.save(`CareWeave_Rx_${prescription.prescription_code}.pdf`);
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
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-gray-500 hover:text-gray-800 text-sm font-medium">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <p className="flex-1 text-center text-xs text-gray-400 font-mono truncate">{prescription.prescription_code}</p>
        <button onClick={handleDownload} disabled={generating}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors shadow-sm shrink-0">
          {generating ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</> : <><Download className="w-4 h-4" /> Download PDF</>}
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

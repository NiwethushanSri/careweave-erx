import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { format } from 'date-fns';
import { ArrowLeft, Download, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/* ── Build the PDF DOM entirely in JS with inline styles ── */
function buildPrescriptionDOM(rx) {
  const wi  = rx.walk_in_patient;
  const name   = wi ? wi.name   : rx.patient_name;
  const nic    = wi ? wi.nic    : rx.patient_nic;
  const mobile = wi ? wi.mobile : rx.patient_mobile;

  const statusBg = rx.status === 'dispensed' ? '#d1fae5' : rx.status === 'sent' ? '#dbeafe' : '#fef3c7';
  const statusFg = rx.status === 'dispensed' ? '#065f46' : rx.status === 'sent' ? '#1e40af' : '#92400e';

  const card = `background:#f9fafb;border-radius:12px;padding:14px;margin-bottom:12px;`;
  const lbl  = `font-size:10px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;`;

  const medicines = (rx.medicines || []).map((m, i) => `
    <div style="border:1px solid #e5e7eb;border-radius:10px;padding:12px;margin-bottom:8px;background:${i%2===0?'#fff':'#f9fafb'};">
      <div style="display:flex;justify-content:space-between;">
        <div>
          <div style="font-weight:700;font-size:14px;">${m.medicine_name}</div>
          <div style="font-size:12px;color:#059669;font-weight:600;margin-top:2px;">${m.dosage}</div>
        </div>
        <span style="font-size:11px;color:#d1d5db;">#${i+1}</span>
      </div>
      <div style="display:flex;gap:16px;margin-top:8px;flex-wrap:wrap;">
        <div><span style="font-size:10px;color:#9ca3af;">QTY </span><span style="font-size:12px;">${m.quantity}</span></div>
        <div><span style="font-size:10px;color:#9ca3af;">FREQ </span><span style="font-size:12px;">${m.frequency||'—'}</span></div>
        <div><span style="font-size:10px;color:#9ca3af;">NOTE </span><span style="font-size:12px;">${m.instructions||'—'}</span></div>
      </div>
    </div>`).join('');

  const qrSection = rx.qr_code ? `
    <div style="${card}text-align:center;">
      <div style="${lbl}">Verification QR</div>
      <img src="${rx.qr_code}" style="width:120px;height:120px;display:block;margin:0 auto;" crossorigin="anonymous"/>
    </div>` : '';

  const pharmacySection = rx.pharmacy_name ? `
    <div style="${card}">
      <div style="${lbl}">Dispensing Pharmacy</div>
      <div style="font-weight:700;font-size:14px;">${rx.pharmacy_name}</div>
      ${rx.pharmacy_address ? `<div style="font-size:12px;color:#6b7280;margin-top:3px;">${rx.pharmacy_address}</div>` : ''}
      ${rx.dispensed_at ? `<div style="font-size:12px;color:#059669;font-weight:600;margin-top:4px;">Dispensed: ${format(new Date(rx.dispensed_at),'dd MMM yyyy HH:mm')}</div>` : ''}
    </div>` : '';

  const html = `
    <div style="font-family:Arial,sans-serif;background:#fff;padding:24px;width:400px;box-sizing:border-box;">

      <!-- Header -->
      <div style="border-bottom:2px solid #059669;padding-bottom:14px;margin-bottom:16px;display:flex;justify-content:space-between;align-items:flex-start;">
        <div>
          <div style="font-size:18px;font-weight:700;color:#059669;">CareWeave eRx</div>
          <div style="font-size:10px;color:#6b7280;margin-top:2px;">Ministry of Health Sri Lanka</div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:10px;color:#9ca3af;">Prescription</div>
          <div style="font-size:11px;font-weight:700;color:#059669;font-family:monospace;">${rx.prescription_code}</div>
          <span style="display:inline-block;margin-top:4px;font-size:10px;font-weight:600;padding:2px 8px;border-radius:12px;background:${statusBg};color:${statusFg};">${rx.status.toUpperCase()}</span>
        </div>
      </div>

      <!-- Doctor -->
      <div style="${card}">
        <div style="${lbl}">Prescribing Doctor</div>
        <div style="font-weight:700;font-size:14px;">Dr. ${rx.doctor_name}</div>
        <div style="font-size:12px;color:#6b7280;margin-top:3px;">SLMC: ${rx.slmc_number}</div>
        ${rx.specialisation ? `<div style="font-size:12px;color:#6b7280;">${rx.specialisation}</div>` : ''}
        ${rx.clinic_name    ? `<div style="font-size:12px;color:#6b7280;">${rx.clinic_name}</div>` : ''}
      </div>

      <!-- Patient -->
      <div style="${card}">
        <div style="${lbl}">Patient${wi?' <span style="color:#f59e0b;">(Walk-in)</span>':''}</div>
        <div style="font-weight:700;font-size:14px;">${name||'—'}</div>
        ${nic    ? `<div style="font-size:12px;color:#6b7280;margin-top:3px;">NIC: ${nic}</div>`    : ''}
        ${mobile ? `<div style="font-size:12px;color:#6b7280;">Mobile: ${mobile}</div>` : ''}
      </div>

      <!-- Clinical -->
      <div style="${card}">
        <div style="${lbl}">Clinical Details</div>
        ${rx.diagnosis ? `<div style="font-size:13px;margin-bottom:4px;"><span style="color:#6b7280;">Diagnosis: </span><strong>${rx.diagnosis}</strong></div>` : ''}
        <div style="font-size:12px;color:#4b5563;margin-bottom:2px;">Date: ${format(new Date(rx.created_at),'dd MMM yyyy')}</div>
        <div style="font-size:12px;color:#4b5563;">Valid until: ${format(new Date(rx.valid_until),'dd MMM yyyy')}</div>
        ${rx.notes ? `<div style="font-size:11px;color:#4b5563;font-style:italic;border-top:1px solid #e5e7eb;padding-top:8px;margin-top:8px;">"${rx.notes}"</div>` : ''}
      </div>

      <!-- Medicines -->
      <div style="margin-bottom:12px;">
        <div style="${lbl}">Prescribed Medicines</div>
        ${medicines}
      </div>

      ${qrSection}
      ${pharmacySection}

      <!-- Footer -->
      <div style="border-top:1px solid #e5e7eb;padding-top:12px;text-align:center;margin-top:8px;">
        <div style="font-size:10px;color:#9ca3af;">Digitally verified prescription · CareWeave eRx</div>
        <div style="font-size:10px;color:#9ca3af;margin-top:2px;">${rx.prescription_code}</div>
      </div>
    </div>`;

  const wrapper = document.createElement('div');
  wrapper.style.cssText = 'position:fixed;top:0;left:0;z-index:-9999;pointer-events:none;';
  wrapper.innerHTML = html;
  return wrapper;
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
      // Build DOM node with pure inline styles (no Tailwind dependency)
      const node = buildPrescriptionDOM(prescription);
      document.body.appendChild(node);

      // Wait a tick for images to load
      await new Promise(r => setTimeout(r, 300));

      const el = node.firstElementChild;
      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
      });

      document.body.removeChild(node);

      const pxW = canvas.width  / 2;
      const pxH = canvas.height / 2;
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: [pxW, pxH] });
      pdf.addImage(canvas.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, pxW, pxH);
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

      {/* ── Mobile preview (just for display — PDF uses inline-styled DOM) ── */}
      <div className="max-w-lg mx-auto py-5 px-4 space-y-3 font-sans">

        <div className="flex items-start justify-between border-b-2 border-green-600 pb-3">
          <div>
            <h1 className="text-base font-bold text-green-700">CareWeave eRx</h1>
            <p className="text-xs text-gray-400">Ministry of Health Sri Lanka</p>
          </div>
          <div className="text-right shrink-0 ml-2">
            <p className="text-xs text-gray-400">Prescription</p>
            <p className="text-xs font-bold text-green-700 font-mono">{prescription.prescription_code}</p>
            <span className={`inline-block mt-1 text-xs font-semibold px-2 py-0.5 rounded-full ${statusColor}`}>
              {prescription.status.toUpperCase()}
            </span>
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
                <div className="flex justify-between">
                  <div>
                    <p className="font-semibold text-sm">{med.medicine_name}</p>
                    <p className="text-xs font-semibold text-green-700">{med.dosage}</p>
                  </div>
                  <span className="text-xs text-gray-300">#{i+1}</span>
                </div>
                <div className="flex gap-4 mt-2 text-xs flex-wrap">
                  <div><span className="text-gray-400">Qty </span>{med.quantity}</div>
                  <div><span className="text-gray-400">Freq </span>{med.frequency||'—'}</div>
                  <div className="flex-1"><span className="text-gray-400">Note </span>{med.instructions||'—'}</div>
                </div>
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

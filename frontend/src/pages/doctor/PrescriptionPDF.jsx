import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import api from '../../utils/api';
import { format } from 'date-fns';
import { ArrowLeft, Download, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/* ─── shared prescription data renderer ───────────────────────────────────
   Used for BOTH the visible preview AND the hidden PDF-capture div.
   `compact` = true  → mobile preview styles
   `compact` = false → fixed 700 px PDF styles
─────────────────────────────────────────────────────────────────────────── */
function PrescriptionContent({ prescription, compact = false }) {
  const wi = prescription.walk_in_patient;
  const patientName   = wi ? wi.name   : prescription.patient_name;
  const patientNic    = wi ? wi.nic    : prescription.patient_nic;
  const patientMobile = wi ? wi.mobile : prescription.patient_mobile;

  const cell = compact
    ? 'border border-gray-200 rounded-xl p-3'
    : 'border border-gray-200 rounded-xl p-4';

  return (
    <div style={compact ? {} : { width: '700px', fontFamily: 'Inter, sans-serif' }}
         className={compact ? 'font-sans' : ''}>

      {/* ── Header ── */}
      <div style={{ borderBottom: '2px solid #059669', paddingBottom: 16, marginBottom: 20,
                    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <div style={{ fontSize: compact ? 20 : 22, fontWeight: 700, color: '#059669' }}>CareWeave eRx</div>
          <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>
            Ministry of Health Sri Lanka · Digital Prescription Platform
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: 11, color: '#9ca3af' }}>Prescription</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#059669', fontFamily: 'monospace', wordBreak: 'break-all' }}>
            {prescription.prescription_code}
          </div>
          <span style={{
            display: 'inline-block', marginTop: 4, fontSize: 11, fontWeight: 600,
            padding: '2px 8px', borderRadius: 12,
            background: prescription.status === 'dispensed' ? '#d1fae5' : prescription.status === 'sent' ? '#dbeafe' : '#fef3c7',
            color:      prescription.status === 'dispensed' ? '#065f46' : prescription.status === 'sent' ? '#1e40af' : '#92400e',
          }}>{prescription.status.toUpperCase()}</span>
        </div>
      </div>

      {/* ── Doctor & Patient ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
        <div className={cell}>
          <div style={{ fontSize: 10, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
            Prescribing Doctor
          </div>
          <div style={{ fontWeight: 700, fontSize: 13 }}>Dr. {prescription.doctor_name}</div>
          <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>SLMC: {prescription.slmc_number}</div>
          {prescription.specialisation && <div style={{ fontSize: 11, color: '#6b7280' }}>{prescription.specialisation}</div>}
          {prescription.clinic_name    && <div style={{ fontSize: 11, color: '#6b7280' }}>{prescription.clinic_name}</div>}
        </div>
        <div className={cell}>
          <div style={{ fontSize: 10, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
            Patient {wi && <span style={{ color: '#f59e0b' }}>(Walk-in)</span>}
          </div>
          <div style={{ fontWeight: 700, fontSize: 13 }}>{patientName || '—'}</div>
          {patientNic    && <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>NIC: {patientNic}</div>}
          {patientMobile && <div style={{ fontSize: 11, color: '#6b7280' }}>Mobile: {patientMobile}</div>}
        </div>
      </div>

      {/* ── Clinical Details ── */}
      <div className={cell} style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
          Clinical Details
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontSize: 12 }}>
          {prescription.diagnosis && (
            <div><span style={{ color: '#6b7280' }}>Diagnosis: </span><strong>{prescription.diagnosis}</strong></div>
          )}
          <div><span style={{ color: '#6b7280' }}>Date: </span>{format(new Date(prescription.created_at), 'dd MMM yyyy')}</div>
          <div><span style={{ color: '#6b7280' }}>Valid until: </span>{format(new Date(prescription.valid_until), 'dd MMM yyyy')}</div>
        </div>
        {prescription.notes && (
          <div style={{ fontSize: 11, color: '#4b5563', marginTop: 8, fontStyle: 'italic',
                        borderTop: '1px solid #f3f4f6', paddingTop: 8 }}>
            "{prescription.notes}"
          </div>
        )}
      </div>

      {/* ── Medicines ── */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
          Prescribed Medicines
        </div>
        <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse',
                        border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
          <thead>
            <tr style={{ background: '#f9fafb' }}>
              {['#','Medicine','Dosage','Qty','Frequency','Instructions'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '8px 10px', fontWeight: 600,
                                     color: '#4b5563', borderBottom: '1px solid #e5e7eb' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {prescription.medicines?.map((med, i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#f9fafb',
                                   borderTop: '1px solid #f3f4f6' }}>
                <td style={{ padding: '8px 10px', color: '#9ca3af' }}>{i + 1}</td>
                <td style={{ padding: '8px 10px', fontWeight: 600 }}>{med.medicine_name}</td>
                <td style={{ padding: '8px 10px', color: '#059669', fontWeight: 600 }}>{med.dosage}</td>
                <td style={{ padding: '8px 10px', color: '#4b5563' }}>{med.quantity}</td>
                <td style={{ padding: '8px 10px', color: '#4b5563' }}>{med.frequency || '—'}</td>
                <td style={{ padding: '8px 10px', color: '#4b5563' }}>{med.instructions || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── QR + Pharmacy ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
        {prescription.qr_code && (
          <div className={cell} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
              Verification QR
            </div>
            <img src={prescription.qr_code} alt="QR" style={{ width: 110, height: 110, margin: '0 auto', display: 'block' }} />
          </div>
        )}
        {prescription.pharmacy_name && (
          <div className={cell}>
            <div style={{ fontSize: 10, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
              Dispensing Pharmacy
            </div>
            <div style={{ fontWeight: 700, fontSize: 13 }}>{prescription.pharmacy_name}</div>
            {prescription.pharmacy_address && <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>{prescription.pharmacy_address}</div>}
            {prescription.dispensed_at && (
              <div style={{ fontSize: 11, color: '#059669', marginTop: 4, fontWeight: 600 }}>
                Dispensed: {format(new Date(prescription.dispensed_at), 'dd MMM yyyy HH:mm')}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 12, textAlign: 'center' }}>
        <div style={{ fontSize: 10, color: '#9ca3af' }}>This is a digitally verified prescription generated by CareWeave eRx</div>
        <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 2 }}>
          careweave-erx.vercel.app · Ministry of Health Sri Lanka · {prescription.prescription_code}
        </div>
      </div>
    </div>
  );
}

/* ─── Main page ─────────────────────────────────────────────────────────── */
export default function PrescriptionPDF() {
  const { id } = useParams();
  const navigate = useNavigate();
  const captureRef = useRef(null);   // hidden 700px div → PDF capture
  const [prescription, setPrescription] = useState(null);
  const [loading, setLoading]     = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    api.get(`/prescriptions/${id}`)
      .then(r => setPrescription(r.data.data))
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDownload = async () => {
    if (!captureRef.current) return;
    setGenerating(true);
    try {
      const canvas = await html2canvas(captureRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: 700,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const imgH  = (canvas.height * pageW) / canvas.width;

      let yOffset = 0, remaining = imgH;
      while (remaining > 0) {
        pdf.addImage(imgData, 'PNG', 0, -yOffset, pageW, imgH);
        remaining -= pageH;
        yOffset   += pageH;
        if (remaining > 0) pdf.addPage();
      }

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

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Top bar ── */}
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

      {/* ── Mobile-friendly PREVIEW (visible, responsive) ── */}
      <div className="max-w-2xl mx-auto py-5 px-4">
        <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-6">
          <PrescriptionContent prescription={prescription} compact={true} />
        </div>
      </div>

      {/* ── Hidden PDF capture div (always 700 px, off-screen) ── */}
      <div style={{ position: 'absolute', left: '-9999px', top: 0, background: '#fff', padding: 32 }}
           ref={captureRef}>
        <PrescriptionContent prescription={prescription} compact={false} />
      </div>
    </div>
  );
}

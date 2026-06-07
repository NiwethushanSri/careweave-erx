import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import api from '../../utils/api';
import { format } from 'date-fns';
import { ArrowLeft, Download, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function PrescriptionPDF() {
  const { id } = useParams();
  const navigate = useNavigate();
  const contentRef = useRef(null);
  const [prescription, setPrescription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    api.get(`/prescriptions/${id}`)
      .then(r => setPrescription(r.data.data))
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDownload = async () => {
    if (!contentRef.current) return;
    setGenerating(true);
    try {
      const canvas = await html2canvas(contentRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const imgW = pageW;
      const imgH = (canvas.height * imgW) / canvas.width;

      // If content taller than one page, split across pages
      let yOffset = 0;
      let remaining = imgH;
      while (remaining > 0) {
        pdf.addImage(imgData, 'PNG', 0, -yOffset, imgW, imgH);
        remaining -= pageH;
        yOffset += pageH;
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
        <p className="text-gray-400 text-sm">Loading prescription...</p>
      </div>
    </div>
  );
  if (!prescription) return <div className="p-8 text-center text-gray-400">Prescription not found</div>;

  const wi = prescription.walk_in_patient;
  const patientName   = wi ? wi.name   : prescription.patient_name;
  const patientNic    = wi ? wi.nic    : prescription.patient_nic;
  const patientMobile = wi ? wi.mobile : prescription.patient_mobile;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 shadow-sm">
        <button onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-gray-500 hover:text-gray-800 text-sm font-medium">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="flex-1 text-center">
          <p className="text-xs text-gray-400 font-mono">{prescription.prescription_code}</p>
        </div>

        <button
          onClick={handleDownload}
          disabled={generating}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors shadow-sm"
        >
          {generating
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</>
            : <><Download className="w-4 h-4" /> Download PDF</>}
        </button>
      </div>

      {/* Prescription content — this is what gets captured */}
      <div className="max-w-2xl mx-auto py-6 px-4">
        <div ref={contentRef}
          className="bg-white rounded-2xl shadow-sm p-6 sm:p-8"
          style={{ fontFamily: 'Inter, sans-serif' }}>

          {/* ── Header ── */}
          <div className="flex items-start justify-between gap-4 pb-4 mb-5 border-b-2 border-green-600">
            <div>
              <h1 className="text-2xl font-bold text-green-700">CareWeave eRx</h1>
              <p className="text-xs text-gray-500 mt-0.5">Ministry of Health Sri Lanka · Digital Prescription Platform</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs text-gray-400">Prescription</p>
              <p className="text-base font-mono font-bold text-green-700">{prescription.prescription_code}</p>
              <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-semibold mt-1 ${
                prescription.status === 'dispensed' ? 'bg-green-100 text-green-700' :
                prescription.status === 'sent'      ? 'bg-blue-100 text-blue-700' :
                'bg-yellow-100 text-yellow-700'
              }`}>{prescription.status.toUpperCase()}</span>
            </div>
          </div>

          {/* ── Doctor & Patient ── */}
          <div className="grid grid-cols-2 gap-4 mb-5">
            <div className="border border-gray-200 rounded-xl p-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Prescribing Doctor</p>
              <p className="font-semibold text-sm">Dr. {prescription.doctor_name}</p>
              <p className="text-xs text-gray-500">SLMC: {prescription.slmc_number}</p>
              {prescription.specialisation && <p className="text-xs text-gray-500">{prescription.specialisation}</p>}
              {prescription.clinic_name    && <p className="text-xs text-gray-500">{prescription.clinic_name}</p>}
            </div>
            <div className="border border-gray-200 rounded-xl p-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
                Patient {wi && <span className="text-amber-500">(Walk-in)</span>}
              </p>
              <p className="font-semibold text-sm">{patientName || '—'}</p>
              {patientNic    && <p className="text-xs text-gray-500">NIC: {patientNic}</p>}
              {patientMobile && <p className="text-xs text-gray-500">Mobile: {patientMobile}</p>}
            </div>
          </div>

          {/* ── Clinical Details ── */}
          <div className="border border-gray-200 rounded-xl p-3 mb-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Clinical Details</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {prescription.diagnosis && (
                <div><span className="text-gray-500">Diagnosis: </span><span className="font-semibold">{prescription.diagnosis}</span></div>
              )}
              <div><span className="text-gray-500">Date: </span>{format(new Date(prescription.created_at), 'dd MMM yyyy')}</div>
              <div><span className="text-gray-500">Valid until: </span>{format(new Date(prescription.valid_until), 'dd MMM yyyy')}</div>
            </div>
            {prescription.notes && (
              <p className="text-xs text-gray-600 mt-2 italic border-t border-gray-100 pt-2">"{prescription.notes}"</p>
            )}
          </div>

          {/* ── Medicines ── */}
          <div className="mb-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Prescribed Medicines</p>
            <table className="w-full text-xs border border-gray-200 rounded-xl overflow-hidden">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left px-3 py-2 font-semibold text-gray-600 w-6">#</th>
                  <th className="text-left px-3 py-2 font-semibold text-gray-600">Medicine</th>
                  <th className="text-left px-3 py-2 font-semibold text-gray-600">Dosage</th>
                  <th className="text-left px-3 py-2 font-semibold text-gray-600">Qty</th>
                  <th className="text-left px-3 py-2 font-semibold text-gray-600">Frequency</th>
                  <th className="text-left px-3 py-2 font-semibold text-gray-600">Instructions</th>
                </tr>
              </thead>
              <tbody>
                {prescription.medicines?.map((med, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                    <td className="px-3 py-2 text-gray-400">{i + 1}</td>
                    <td className="px-3 py-2 font-semibold text-gray-900">{med.medicine_name}</td>
                    <td className="px-3 py-2 text-green-700 font-semibold">{med.dosage}</td>
                    <td className="px-3 py-2 text-gray-600">{med.quantity}</td>
                    <td className="px-3 py-2 text-gray-600">{med.frequency || '—'}</td>
                    <td className="px-3 py-2 text-gray-600">{med.instructions || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── QR + Pharmacy ── */}
          <div className="grid grid-cols-2 gap-4 mb-5">
            {prescription.qr_code && (
              <div className="border border-gray-200 rounded-xl p-3 text-center">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Verification QR</p>
                <img src={prescription.qr_code} alt="QR Code" className="w-28 h-28 mx-auto" />
              </div>
            )}
            {prescription.pharmacy_name && (
              <div className="border border-gray-200 rounded-xl p-3">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Dispensing Pharmacy</p>
                <p className="font-semibold text-sm">{prescription.pharmacy_name}</p>
                {prescription.pharmacy_address && <p className="text-xs text-gray-500 mt-0.5">{prescription.pharmacy_address}</p>}
                {prescription.dispensed_at && (
                  <p className="text-xs text-green-600 mt-1 font-medium">
                    Dispensed: {format(new Date(prescription.dispensed_at), 'dd MMM yyyy HH:mm')}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* ── Footer ── */}
          <div className="border-t border-gray-200 pt-3 text-center">
            <p className="text-xs text-gray-400">This is a digitally verified prescription generated by CareWeave eRx</p>
            <p className="text-xs text-gray-400 mt-0.5">careweave-erx.vercel.app · Ministry of Health Sri Lanka · {prescription.prescription_code}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

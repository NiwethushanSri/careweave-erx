import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { format } from 'date-fns';
import { ArrowLeft, Download } from 'lucide-react';
import toast from 'react-hot-toast';

export default function PrescriptionPDF() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [prescription, setPrescription] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/prescriptions/${id}`)
      .then(r => setPrescription(r.data.data))
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false));
  }, [id]);

  const handlePrint = () => window.print();

  if (loading) return <div className="p-8 text-center text-gray-400">Loading...</div>;
  if (!prescription) return <div className="p-8 text-center text-gray-400">Not found</div>;

  return (
    <div>
      {/* Print controls - hidden when printing */}
      <div className="print:hidden p-4 flex items-center gap-3 border-b border-gray-100 bg-white">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <button onClick={handlePrint} className="btn-primary flex items-center gap-2 text-sm ml-auto">
          <Download className="w-4 h-4" /> Download / Print PDF
        </button>
      </div>

      {/* PDF Content */}
      <div className="max-w-2xl mx-auto p-8 bg-white" id="prescription-pdf">
        {/* Header */}
        <div className="border-b-2 border-green-600 pb-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-green-700">RxSystem SL</h1>
              <p className="text-sm text-gray-500">Ministry of Health Sri Lanka · Digital Prescription Platform</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">Prescription Code</p>
              <p className="text-lg font-mono font-bold text-green-700">{prescription.prescription_code}</p>
              <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium mt-1 ${
                prescription.status === 'dispensed' ? 'bg-green-100 text-green-700' :
                prescription.status === 'sent' ? 'bg-blue-100 text-blue-700' :
                'bg-yellow-100 text-yellow-700'
              }`}>{prescription.status.toUpperCase()}</span>
            </div>
          </div>
        </div>

        {/* Doctor & Patient */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-xs font-semibold text-gray-400 uppercase mb-2">Prescribing Doctor</h3>
            <p className="font-semibold">Dr. {prescription.doctor_name}</p>
            <p className="text-sm text-gray-600">SLMC: {prescription.slmc_number}</p>
            {prescription.specialisation && <p className="text-sm text-gray-600">{prescription.specialisation}</p>}
            {prescription.clinic_name && <p className="text-sm text-gray-600">{prescription.clinic_name}</p>}
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-xs font-semibold text-gray-400 uppercase mb-2">Patient</h3>
            <p className="font-semibold">{prescription.patient_name}</p>
            <p className="text-sm text-gray-600">NIC: {prescription.patient_nic}</p>
            {prescription.patient_mobile && <p className="text-sm text-gray-600">Mobile: {prescription.patient_mobile}</p>}
          </div>
        </div>

        {/* Clinical */}
        <div className="border border-gray-200 rounded-lg p-4 mb-6">
          <h3 className="text-xs font-semibold text-gray-400 uppercase mb-2">Clinical Details</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {prescription.diagnosis && <div><span className="text-gray-500">Diagnosis:</span> <span className="font-medium">{prescription.diagnosis}</span></div>}
            <div><span className="text-gray-500">Date:</span> {format(new Date(prescription.created_at), 'dd MMM yyyy')}</div>
            <div><span className="text-gray-500">Valid until:</span> {format(new Date(prescription.valid_until), 'dd MMM yyyy')}</div>
          </div>
          {prescription.notes && <p className="text-sm text-gray-600 mt-2 italic">"{prescription.notes}"</p>}
        </div>

        {/* Medicines */}
        <div className="mb-6">
          <h3 className="text-xs font-semibold text-gray-400 uppercase mb-3">Prescribed Medicines</h3>
          <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-3 font-medium text-gray-600">#</th>
                <th className="text-left p-3 font-medium text-gray-600">Medicine</th>
                <th className="text-left p-3 font-medium text-gray-600">Dosage</th>
                <th className="text-left p-3 font-medium text-gray-600">Qty</th>
                <th className="text-left p-3 font-medium text-gray-600">Frequency</th>
                <th className="text-left p-3 font-medium text-gray-600">Instructions</th>
              </tr>
            </thead>
            <tbody>
              {prescription.medicines?.map((med, i) => (
                <tr key={i} className="border-t border-gray-100">
                  <td className="p-3 text-gray-500">{i + 1}</td>
                  <td className="p-3 font-medium">{med.medicine_name}</td>
                  <td className="p-3">{med.dosage}</td>
                  <td className="p-3">{med.quantity}</td>
                  <td className="p-3 text-gray-600">{med.frequency || '—'}</td>
                  <td className="p-3 text-gray-600">{med.instructions || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* QR + Pharmacy */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          {prescription.qr_code && (
            <div className="border border-gray-200 rounded-lg p-4 text-center">
              <h3 className="text-xs font-semibold text-gray-400 uppercase mb-2">Verification QR</h3>
              <img src={prescription.qr_code} alt="QR" className="w-32 h-32 mx-auto" />
            </div>
          )}
          {prescription.pharmacy_name && (
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-xs font-semibold text-gray-400 uppercase mb-2">Dispensing Pharmacy</h3>
              <p className="font-medium">{prescription.pharmacy_name}</p>
              {prescription.pharmacy_address && <p className="text-sm text-gray-600">{prescription.pharmacy_address}</p>}
              {prescription.dispensed_at && <p className="text-sm text-green-600 mt-1">Dispensed: {format(new Date(prescription.dispensed_at), 'dd MMM yyyy HH:mm')}</p>}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 pt-4 text-center">
          <p className="text-xs text-gray-400">This is a digitally verified prescription generated by RxSystem SL</p>
          <p className="text-xs text-gray-400">Ministry of Health Sri Lanka · {prescription.prescription_code}</p>
        </div>
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          #prescription-pdf, #prescription-pdf * { visibility: visible; }
          #prescription-pdf { position: absolute; left: 0; top: 0; width: 100%; }
        }
      `}</style>
    </div>
  );
}

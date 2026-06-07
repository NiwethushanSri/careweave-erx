import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { ArrowLeft, Send, X, FileText, Receipt, MapPin } from 'lucide-react';

const statusColors = {
  created: 'bg-yellow-50 text-yellow-700',
  sent: 'bg-blue-50 text-blue-700',
  received: 'bg-purple-50 text-purple-700',
  dispensed: 'bg-green-50 text-green-700',
  cancelled: 'bg-red-50 text-red-700',
};

export default function PrescriptionDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [prescription, setPrescription] = useState(null);
  const [pharmacies, setPharmacies] = useState([]);
  const [selectedPharmacy, setSelectedPharmacy] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    api.get(`/prescriptions/${id}`)
      .then(async (p) => {
        const pres = p.data.data;
        setPrescription(pres);
        if (pres.pharmacy_id) setSelectedPharmacy(pres.pharmacy_id);

        // Fetch pharmacies filtered by patient's district (if available)
        const district = pres.patient_district;
        const url = district ? `/pharmacies?district=${encodeURIComponent(district)}` : '/pharmacies';
        const ph = await api.get(url);
        setPharmacies(ph.data.data || []);
      })
      .catch(() => toast.error('Failed to load prescription'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSend = async () => {
    if (!selectedPharmacy) return toast.error('Please select a pharmacy first');
    setSending(true);
    try {
      await api.post(`/prescriptions/${id}/send`, { pharmacy_id: selectedPharmacy });
      toast.success('Prescription sent to pharmacy!');
      const { data } = await api.get(`/prescriptions/${id}`);
      setPrescription(data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send');
    } finally {
      setSending(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm('Cancel this prescription?')) return;
    setCancelling(true);
    try {
      await api.post(`/prescriptions/${id}/cancel`);
      toast.success('Prescription cancelled');
      navigate('/doctor');
    } catch (err) {
      toast.error('Failed to cancel');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-400">Loading...</div>;
  if (!prescription) return <div className="p-8 text-center text-gray-400">Not found</div>;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-gray-700">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="flex items-center gap-2">
          {(user.role === 'pharmacy' || user.role === 'admin') && prescription.status === 'dispensed' && (
            <button onClick={() => navigate(`/prescription/${id}/invoice`)}
              className="btn-secondary flex items-center gap-2 text-sm text-green-700 border-green-200">
              <Receipt className="w-4 h-4" /> Create Invoice
            </button>
          )}
          <button onClick={() => navigate(`/prescription/${id}/pdf`)}
            className="btn-secondary flex items-center gap-2 text-sm">
            <FileText className="w-4 h-4" /> Download PDF
          </button>
      {user.role === 'doctor' && prescription.status === 'created' && (
            <button onClick={handleCancel} disabled={cancelling}
              className="btn-danger flex items-center gap-2 text-sm">
              <X className="w-4 h-4" /> Cancel
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-xl font-bold font-mono text-brand-700">{prescription.prescription_code}</h1>
        <span className={`status-badge ${statusColors[prescription.status] || 'bg-gray-100 text-gray-600'}`}>
          {prescription.status}
        </span>
        <span className="text-sm text-gray-400 ml-auto">
          Created {format(new Date(prescription.created_at), 'dd MMM yyyy, HH:mm')}
        </span>
      </div>

      <div className="card p-5 mb-4">
        <h2 className="font-semibold mb-3">Patient</h2>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div><span className="text-gray-500">Name:</span> <span className="font-medium">{prescription.patient_name}</span></div>
          <div><span className="text-gray-500">NIC:</span> <span className="font-medium">{prescription.patient_nic}</span></div>
          {prescription.patient_mobile && <div><span className="text-gray-500">Mobile:</span> {prescription.patient_mobile}</div>}
        </div>
      </div>

      <div className="card p-5 mb-4">
        <h2 className="font-semibold mb-3">Doctor</h2>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div><span className="text-gray-500">Name:</span> <span className="font-medium">Dr. {prescription.doctor_name}</span></div>
          <div><span className="text-gray-500">SLMC:</span> {prescription.slmc_number}</div>
          {prescription.specialisation && <div><span className="text-gray-500">Specialisation:</span> {prescription.specialisation}</div>}
          {prescription.clinic_name && <div><span className="text-gray-500">Clinic:</span> {prescription.clinic_name}</div>}
        </div>
      </div>

      {(prescription.diagnosis || prescription.notes) && (
        <div className="card p-5 mb-4">
          <h2 className="font-semibold mb-3">Clinical Details</h2>
          {prescription.diagnosis && <p className="text-sm"><span className="text-gray-500">Diagnosis:</span> {prescription.diagnosis}</p>}
          {prescription.notes && <p className="text-sm mt-1"><span className="text-gray-500">Notes:</span> {prescription.notes}</p>}
          <p className="text-sm mt-1"><span className="text-gray-500">Valid until:</span> {format(new Date(prescription.valid_until), 'dd MMM yyyy')}</p>
        </div>
      )}

      <div className="card p-5 mb-4">
        <h2 className="font-semibold mb-3">Medicines ({prescription.medicines?.length || 0})</h2>
        {prescription.medicines?.length > 0 ? (
          <div className="space-y-3">
            {prescription.medicines.map((med, i) => (
              <div key={i} className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm">{med.medicine_name}</span>
                  <span className="text-xs text-gray-500">Qty: {med.quantity}</span>
                </div>
                <p className="text-xs text-gray-600">Dosage: {med.dosage}</p>
                {med.frequency && <p className="text-xs text-gray-500">{med.frequency}</p>}
                {med.instructions && <p className="text-xs text-gray-500 italic">{med.instructions}</p>}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">No medicines added</p>
        )}
      </div>

      {/* Contact Details - visible to pharmacy when received/dispensed */}
      {user.role === 'pharmacy' && ['received','dispensed','sent'].includes(prescription.status) && (
        <div className="card p-5 mb-4 border-brand-100 bg-brand-50/30">
          <h2 className="font-semibold mb-3 text-brand-700 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-brand-500 inline-block" /> Contact Details
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Patient contact */}
            <div className="bg-white rounded-lg p-3 border border-gray-100">
              <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Patient</p>
              <p className="font-medium text-sm">{prescription.patient_name}</p>
              <p className="text-sm text-gray-500">NIC: {prescription.patient_nic}</p>
              {prescription.patient_mobile && (
                <a href={`tel:${prescription.patient_mobile}`}
                  className="flex items-center gap-1 text-sm text-brand-600 hover:underline mt-1 font-medium">
                  📞 {prescription.patient_mobile}
                </a>
              )}
            </div>
            {/* Doctor contact */}
            <div className="bg-white rounded-lg p-3 border border-gray-100">
              <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Prescribing Doctor</p>
              <p className="font-medium text-sm">Dr. {prescription.doctor_name}</p>
              <p className="text-sm text-gray-500">SLMC: {prescription.slmc_number}</p>
              {prescription.specialisation && <p className="text-sm text-gray-500">{prescription.specialisation}</p>}
              {prescription.clinic_name && <p className="text-sm text-gray-500">🏥 {prescription.clinic_name}</p>}
            </div>
          </div>
        </div>
      )}

      {user.role === 'doctor' && prescription.status === 'created' && (
        <div className="card p-5 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Send to Pharmacy</h2>
            {prescription.patient_district && (
              <span className="text-xs bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                <MapPin className="w-3 h-3" /> Showing pharmacies near patient — {prescription.patient_district}
              </span>
            )}
          </div>
          {pharmacies.length === 0 ? (
            <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 text-sm text-amber-700">
              No approved pharmacies found in <strong>{prescription.patient_district || 'the patient\'s area'}</strong>.
              Please ask the patient to update their district or wait for a nearby pharmacy to register.
            </div>
          ) : (
          <div className="flex gap-3">
            <select className="input flex-1" value={selectedPharmacy}
              onChange={e => setSelectedPharmacy(e.target.value)}>
              <option value="">— Select nearby pharmacy —</option>
              {pharmacies.map(ph => (
                <option key={ph.id} value={ph.id}>
                  {ph.pharmacy_name} — {ph.city || ph.district}
                  {ph.id === prescription.preferred_pharmacy_id ? ' ⭐ Patient preferred' : ''}
                </option>
              ))}
            </select>
            <button onClick={handleSend} disabled={sending}
              className="btn-primary flex items-center gap-2 whitespace-nowrap">
              <Send className="w-4 h-4" />
              {sending ? 'Sending...' : 'Send'}
            </button>
          </div>
          )}
        </div>
      )}

      {prescription.pharmacy_name && prescription.status !== 'created' && (
        <div className="card p-5 mb-4 border-blue-100 bg-blue-50/20">
          <h2 className="font-semibold mb-3 text-blue-700 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" /> Pharmacy Contact
          </h2>
          <div className="bg-white rounded-lg p-3 border border-gray-100">
            <p className="font-medium text-sm">{prescription.pharmacy_name}</p>
            {prescription.pharmacy_address && (
              <p className="text-sm text-gray-500 mt-0.5">📍 {prescription.pharmacy_address}</p>
            )}
            {prescription.pharmacy_phone && (
              <a href={`tel:${prescription.pharmacy_phone}`}
                className="flex items-center gap-1 text-sm text-blue-600 hover:underline mt-1 font-medium">
                📞 {prescription.pharmacy_phone}
              </a>
            )}
            {prescription.status === 'dispensed' && (
              <p className="text-xs text-green-600 font-medium mt-2">✅ Medicines have been dispensed</p>
            )}
            {prescription.status === 'sent' && (
              <p className="text-xs text-blue-600 font-medium mt-2">⏳ Pharmacy has received your prescription — preparing medicines</p>
            )}
            {prescription.status === 'received' && (
              <p className="text-xs text-purple-600 font-medium mt-2">📦 Pharmacist is verifying your prescription</p>
            )}
          </div>
        </div>
      )}

      {prescription.qr_code && (
        <div className="card p-5 text-center">
          <h2 className="font-semibold mb-3">Prescription QR Code</h2>
          <img src={prescription.qr_code} alt="QR Code" className="w-40 h-40 mx-auto" />
          <p className="text-xs text-gray-400 mt-2">Scan to verify prescription authenticity</p>
        </div>
      )}
    </div>
  );
}

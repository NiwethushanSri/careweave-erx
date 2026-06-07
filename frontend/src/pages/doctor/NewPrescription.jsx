import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { Plus, Trash2, Search, MapPin } from 'lucide-react';

const emptyMed = { medicine_name: '', generic_name: '', dosage: '', quantity: 1, frequency: '', duration: '', instructions: '' };

export default function NewPrescription() {
  const navigate = useNavigate();
  const [patientNic, setPatientNic] = useState('');
  const [patient, setPatient] = useState(null);
  const [pharmacies, setPharmacies] = useState([]);
  const [pharmacyId, setPharmacyId] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [notes, setNotes] = useState('');
  const [validDays, setValidDays] = useState(30);
  const [medicines, setMedicines] = useState([{ ...emptyMed }]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [loadingPharmacies, setLoadingPharmacies] = useState(false);

  const searchPatient = async () => {
    if (!patientNic.trim()) return;
    setSearching(true);
    try {
      const { data } = await api.get(`/patients/search?nic=${patientNic}`);
      const found = data.data;
      setPatient(found);
      setPharmacies([]);
      setPharmacyId('');

      // Fetch pharmacies filtered by patient's district
      if (found.district) {
        setLoadingPharmacies(true);
        try {
          const ph = await api.get(`/pharmacies?district=${encodeURIComponent(found.district)}`);
          const list = ph.data.data || [];
          setPharmacies(list);
          // Auto-select preferred pharmacy if set
          if (found.preferred_pharmacy_id) {
            const match = list.find(p => p.id === found.preferred_pharmacy_id);
            if (match) setPharmacyId(match.id);
          }
        } finally {
          setLoadingPharmacies(false);
        }
      } else {
        // No district on patient — load all pharmacies
        const ph = await api.get('/pharmacies');
        setPharmacies(ph.data.data || []);
        if (found.preferred_pharmacy_id) {
          setPharmacyId(found.preferred_pharmacy_id);
        }
      }

      toast.success('Patient found');
    } catch {
      toast.error('Patient not found with this NIC');
      setPatient(null);
      setPharmacies([]);
    } finally {
      setSearching(false);
    }
  };

  const updateMed = (index, field, value) => {
    const updated = [...medicines];
    updated[index][field] = value;
    setMedicines(updated);
  };

  const addMed = () => setMedicines([...medicines, { ...emptyMed }]);
  const removeMed = (i) => setMedicines(medicines.filter((_, idx) => idx !== i));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!patient) return toast.error('Please search and select a patient first');
    if (medicines.some(m => !m.medicine_name || !m.dosage)) return toast.error('Fill in all medicine details');
    setLoading(true);
    try {
      const { data } = await api.post('/prescriptions', {
        patient_nic: patientNic,
        pharmacy_id: pharmacyId || null,
        diagnosis,
        notes,
        valid_days: validDays,
        medicines,
      });
      toast.success('Prescription created!');
      navigate(`/doctor/prescription/${data.data.prescription.id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create prescription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">New Prescription</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Patient Search */}
        <div className="card p-4 sm:p-6">
          <h2 className="font-semibold mb-4">Patient</h2>
          <div className="flex gap-2">
            <input
              className="input"
              placeholder="Enter patient NIC number"
              value={patientNic}
              onChange={e => setPatientNic(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), searchPatient())}
            />
            <button type="button" onClick={searchPatient} disabled={searching}
              className="btn-secondary flex items-center gap-2 whitespace-nowrap">
              <Search className="w-4 h-4" />
              {searching ? 'Searching...' : 'Search'}
            </button>
          </div>
          {patient && (
            <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-100 text-sm space-y-1">
              <p className="font-medium text-green-800">{patient.full_name}</p>
              <p className="text-green-600">NIC: {patient.nic} · {patient.gender} · DOB: {patient.date_of_birth || '—'}</p>
              {patient.district && (
                <p className="text-green-700 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {patient.city ? `${patient.city}, ` : ''}{patient.district} District
                </p>
              )}
              {patient.allergies && <p className="text-red-600 font-medium">⚠ Allergies: {patient.allergies}</p>}
            </div>
          )}
        </div>

        {/* Pharmacy — only show after patient found */}
        {patient && (
          <div className="card p-4 sm:p-6">
            <div className="flex items-center justify-between mb-1">
              <h2 className="font-semibold">Pharmacy</h2>
              {patient.district && (
                <span className="text-xs text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> Nearby — {patient.district} district
                </span>
              )}
            </div>

            {loadingPharmacies ? (
              <div className="input text-gray-400 text-sm">Loading nearby pharmacies...</div>
            ) : pharmacies.length === 0 ? (
              <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 text-sm text-amber-700">
                No approved pharmacies found in <strong>{patient.district}</strong> district.
                Doctor will need to send the prescription after pharmacies are registered.
              </div>
            ) : (
              <>
                <select className="input" value={pharmacyId} onChange={e => setPharmacyId(e.target.value)}>
                  <option value="">— Select nearby pharmacy (optional) —</option>
                  {pharmacies.map(ph => (
                    <option key={ph.id} value={ph.id}>
                      {ph.pharmacy_name} — {ph.city || ph.district}
                      {ph.id === patient.preferred_pharmacy_id ? ' ⭐ Preferred' : ''}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-400 mt-1">
                  {pharmacies.length} approved pharmacy{pharmacies.length !== 1 ? 's' : ''} near patient · You can also send later from prescription detail
                </p>
              </>
            )}
          </div>
        )}

        {/* Clinical Details */}
        <div className="card p-4 sm:p-6">
          <h2 className="font-semibold mb-4">Clinical Details</h2>
          <div className="space-y-4">
            <div>
              <label className="label">Diagnosis</label>
              <input className="input" placeholder="e.g. Type 2 Diabetes Mellitus" value={diagnosis} onChange={e => setDiagnosis(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Valid for (days)</label>
                <select className="input" value={validDays} onChange={e => setValidDays(Number(e.target.value))}>
                  <option value={7}>7 days</option>
                  <option value={14}>14 days</option>
                  <option value={30}>30 days</option>
                  <option value={60}>60 days</option>
                  <option value={90}>90 days</option>
                </select>
              </div>
            </div>
            <div>
              <label className="label">Notes</label>
              <textarea className="input" rows={2} placeholder="Additional notes for pharmacist..." value={notes} onChange={e => setNotes(e.target.value)} />
            </div>
          </div>
        </div>

        {/* Medicines */}
        <div className="card p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Medicines</h2>
            <button type="button" onClick={addMed} className="btn-secondary flex items-center gap-1 text-sm">
              <Plus className="w-3 h-3" /> Add Medicine
            </button>
          </div>
          <div className="space-y-4">
            {medicines.map((med, i) => (
              <div key={i} className="p-4 border border-gray-100 rounded-lg bg-gray-50">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-600">Medicine {i + 1}</span>
                  {medicines.length > 1 && (
                    <button type="button" onClick={() => removeMed(i)} className="text-red-400 hover:text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Medicine name *</label>
                    <input className="input" placeholder="e.g. Metformin" value={med.medicine_name}
                      onChange={e => updateMed(i, 'medicine_name', e.target.value)} required />
                  </div>
                  <div>
                    <label className="label">Dosage *</label>
                    <input className="input" placeholder="e.g. 500mg" value={med.dosage}
                      onChange={e => updateMed(i, 'dosage', e.target.value)} required />
                  </div>
                  <div>
                    <label className="label">Quantity</label>
                    <input className="input" type="number" min="1" value={med.quantity}
                      onChange={e => updateMed(i, 'quantity', parseInt(e.target.value))} />
                  </div>
                  <div>
                    <label className="label">Frequency</label>
                    <select className="input" value={med.frequency} onChange={e => updateMed(i, 'frequency', e.target.value)}>
                      <option value="">Select frequency</option>
                      <option>Once daily</option>
                      <option>Twice daily</option>
                      <option>Three times daily</option>
                      <option>Four times daily</option>
                      <option>Every 8 hours</option>
                      <option>As needed</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Duration</label>
                    <input className="input" placeholder="e.g. 1 month" value={med.duration}
                      onChange={e => updateMed(i, 'duration', e.target.value)} />
                  </div>
                  <div>
                    <label className="label">Instructions</label>
                    <input className="input" placeholder="e.g. Take after meals" value={med.instructions}
                      onChange={e => updateMed(i, 'instructions', e.target.value)} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <button type="button" onClick={() => navigate('/doctor')} className="btn-secondary flex-1">Cancel</button>
          <button type="submit" disabled={loading} className="btn-primary flex-1">
            {loading ? 'Creating...' : 'Create Prescription'}
          </button>
        </div>
      </form>
    </div>
  );
}

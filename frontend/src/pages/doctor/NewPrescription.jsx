import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { Plus, Trash2, Search, MapPin, UserX, UserCheck, X, ChevronRight, AlertTriangle, Upload, Camera, FileText, Download, Paperclip } from 'lucide-react';
import { format } from 'date-fns';
import { checkAllergyConflicts, checkDrugInteractions } from '../../data/drugInteractions';
import CameraCapture from '../../components/CameraCapture';

const DOC_TYPE_LABELS = { xray: 'X-Ray', blood_report: 'Blood Report', ecg: 'ECG Report', other: 'Other' };

const emptyMed = { medicine_name: '', generic_name: '', dosage: '', quantity: 1, frequency: '', duration: '', instructions: '' };
const emptyManual = { name: '', nic: '', dob: '', gender: '', mobile: '' };

// ── Patient card shown after selection ─────────────────────────────────────
function PatientCard({ patient, activeMedicines, onClear }) {
  return (
    <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200 text-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-0.5 min-w-0">
          <p className="font-semibold text-green-800 truncate">{patient.full_name}</p>
          <p className="text-green-600 text-xs">
            {patient.nic && <>NIC: {patient.nic} · </>}
            {patient.gender && <>{patient.gender} · </>}
            {patient.date_of_birth && <>DOB: {format(new Date(patient.date_of_birth), 'dd MMM yyyy')}</>}
          </p>
          {patient.mobile && <p className="text-green-600 text-xs">📞 {patient.mobile}</p>}
          {patient.district && (
            <p className="text-green-700 text-xs flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {patient.city ? `${patient.city}, ` : ''}{patient.district} District
            </p>
          )}
          {patient.allergies && (
            <p className="text-red-600 font-medium text-xs">⚠ Allergies: {patient.allergies}</p>
          )}
          {activeMedicines?.length > 0 && (
            <p className="text-green-700 text-xs">
              💊 Currently on: {activeMedicines.map(m => m.medicine_name).join(', ')}
            </p>
          )}
        </div>
        <button type="button" onClick={onClear}
          className="text-gray-400 hover:text-red-500 shrink-0 mt-0.5">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default function NewPrescription() {
  const navigate = useNavigate();

  // Patient mode
  const [mode, setMode] = useState('search');

  // Search fields
  const [searchFields, setSearchFields] = useState({ q: '', name: '', dob: '', mobile: '' });
  const [searchType, setSearchType] = useState('quick'); // 'quick' | 'advanced'
  const [results, setResults] = useState([]);   // multiple hits
  const [patient, setPatient] = useState(null); // selected patient
  const [searching, setSearching] = useState(false);

  // Manual mode
  const [manual, setManual] = useState({ ...emptyManual });

  // Pharmacy
  const [pharmacies, setPharmacies] = useState([]);
  const [pharmacyId, setPharmacyId] = useState('');
  const [loadingPharmacies, setLoadingPharmacies] = useState(false);

  // Patient's other current medicines — used for interaction checks
  const [activeMedicines, setActiveMedicines] = useState([]);

  // Medical documents (X-ray, blood report, ECG...)
  const [documents, setDocuments] = useState([]);
  const [docType, setDocType] = useState('xray');
  const [docNotes, setDocNotes] = useState('');
  const [docFile, setDocFile] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);

  // Prescription fields
  const [diagnosis, setDiagnosis] = useState('');
  const [notes, setNotes] = useState('');
  const [validDays, setValidDays] = useState(30);
  const [medicines, setMedicines] = useState([{ ...emptyMed }]);
  const [loading, setLoading] = useState(false);

  const setSF = (k, v) => setSearchFields(f => ({ ...f, [k]: v }));
  const setManualField = (k, v) => setManual(m => ({ ...m, [k]: v }));

  const switchMode = (m) => {
    setMode(m);
    setPatient(null);
    setResults([]);
    setSearchFields({ q: '', name: '', dob: '', mobile: '' });
    setManual({ ...emptyManual });
    setPharmacies([]);
    setPharmacyId('');
    setActiveMedicines([]);
    setDocuments([]);
    setDocFile(null);
    setDocNotes('');
  };

  const loadPharmacies = async (found) => {
    setPharmacies([]);
    setPharmacyId('');
    setLoadingPharmacies(true);
    try {
      const url = found.district
        ? `/pharmacies?district=${encodeURIComponent(found.district)}`
        : '/pharmacies';
      const ph = await api.get(url);
      const list = ph.data.data || [];
      setPharmacies(list);
      if (found.preferred_pharmacy_id) {
        const match = list.find(p => p.id === found.preferred_pharmacy_id);
        if (match) setPharmacyId(match.id);
      }
    } finally {
      setLoadingPharmacies(false);
    }
  };

  const loadActiveMedicines = async (patientId) => {
    setActiveMedicines([]);
    try {
      const { data } = await api.get(`/patients/${patientId}/active-medicines`);
      setActiveMedicines(data.data || []);
    } catch {
      // non-critical — interaction check just runs with less data
    }
  };

  const loadDocuments = async (patientId) => {
    setDocuments([]);
    try {
      const { data } = await api.get(`/patients/${patientId}/documents`);
      setDocuments(data.data || []);
    } catch {
      // non-critical
    }
  };

  const selectPatient = async (p) => {
    setPatient(p);
    setResults([]);
    await Promise.all([loadPharmacies(p), loadActiveMedicines(p.id), loadDocuments(p.id)]);
    toast.success(`Patient selected: ${p.full_name}`);
  };

  const uploadDocument = async () => {
    if (!docFile) return toast.error('Choose a file or take a photo first');
    if (!patient?.id) return toast.error('Select a registered patient first');
    setUploadingDoc(true);
    try {
      const form = new FormData();
      form.append('file', docFile);
      form.append('document_type', docType);
      form.append('notes', docNotes);
      const { data } = await api.post(`/patients/${patient.id}/documents`, form);
      setDocuments(prev => [{ ...data.data, uploaded_by_name: 'You' }, ...prev]);
      setDocFile(null);
      setDocNotes('');
      toast.success('Document uploaded — patient has been notified');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploadingDoc(false);
    }
  };

  const searchPatient = async () => {
    setSearching(true);
    setPatient(null);
    setResults([]);
    try {
      let url;
      if (searchType === 'quick') {
        const q = searchFields.q.trim();
        if (!q) { toast.error('Enter a name, NIC, mobile, or date of birth'); setSearching(false); return; }
        url = `/patients/search?q=${encodeURIComponent(q)}`;
      } else {
        // Advanced: build field params
        const parts = [];
        if (searchFields.name.trim())   parts.push(`name=${encodeURIComponent(searchFields.name.trim())}`);
        if (searchFields.dob.trim())    parts.push(`dob=${encodeURIComponent(searchFields.dob.trim())}`);
        if (searchFields.mobile.trim()) parts.push(`mobile=${encodeURIComponent(searchFields.mobile.trim())}`);
        if (!parts.length) { toast.error('Fill at least one search field'); setSearching(false); return; }
        url = `/patients/search?${parts.join('&')}`;
      }

      const { data } = await api.get(url);

      if (data.multiple && data.results?.length > 1) {
        // Show list to pick from
        setResults(data.results);
        toast.success(`${data.results.length} patients found — select one below`);
      } else {
        // Single match — auto-select
        await selectPatient(data.data);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'No patient found';
      toast.error(msg + '. Use "Enter Manually" for unregistered patients.');
      setPatient(null);
      setResults([]);
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

  // Allergy + drug-interaction warnings — an aid for the doctor, not a
  // replacement for clinical judgement or pharmacist review.
  const safetyWarnings = useMemo(() => {
    const names = medicines.map(m => m.medicine_name).filter(Boolean);
    const activeNames = activeMedicines.map(m => m.medicine_name);
    const warnings = new Set();

    names.forEach((name, i) => {
      checkAllergyConflicts(name, patient?.allergies).forEach(w => warnings.add(w));
      const others = [...names.slice(0, i), ...names.slice(i + 1), ...activeNames];
      checkDrugInteractions(name, others).forEach(w => warnings.add(w));
    });

    return [...warnings];
  }, [medicines, patient, activeMedicines]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (mode === 'search' && !patient) return toast.error('Please search and select a patient first');
    if (mode === 'manual' && !manual.name.trim()) return toast.error('Patient name is required');
    if (medicines.some(m => !m.medicine_name || !m.dosage)) return toast.error('Fill in medicine name and dosage for all medicines');

    setLoading(true);
    try {
      const payload = { pharmacy_id: pharmacyId || null, diagnosis, notes, valid_days: validDays, medicines };
      if (mode === 'search') {
        payload.patient_nic = patient.nic || patient.mobile;
      } else {
        payload.manual_patient = manual;
      }
      const { data } = await api.post('/prescriptions', payload);
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

        {/* ── Patient Section ── */}
        <div className="card p-4 sm:p-6">
          {/* Header + mode toggle */}
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <h2 className="font-semibold text-gray-900">Patient</h2>
            <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm">
              <button type="button" onClick={() => switchMode('search')}
                className={`flex items-center gap-1.5 px-3 py-1.5 transition-colors ${
                  mode === 'search' ? 'bg-brand-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}>
                <UserCheck className="w-3.5 h-3.5" /> Search Registered
              </button>
              <button type="button" onClick={() => switchMode('manual')}
                className={`flex items-center gap-1.5 px-3 py-1.5 transition-colors border-l border-gray-200 ${
                  mode === 'manual' ? 'bg-amber-500 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}>
                <UserX className="w-3.5 h-3.5" /> Enter Manually
              </button>
            </div>
          </div>

          {/* ── Search Mode ── */}
          {mode === 'search' && !patient && (
            <>
              {/* Quick / Advanced toggle */}
              <div className="flex gap-3 mb-3 text-sm">
                <button type="button"
                  onClick={() => setSearchType('quick')}
                  className={`px-3 py-1 rounded-full border transition-colors ${
                    searchType === 'quick'
                      ? 'bg-brand-50 border-brand-300 text-brand-700 font-medium'
                      : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                  🔍 Quick Search
                </button>
                <button type="button"
                  onClick={() => setSearchType('advanced')}
                  className={`px-3 py-1 rounded-full border transition-colors ${
                    searchType === 'advanced'
                      ? 'bg-brand-50 border-brand-300 text-brand-700 font-medium'
                      : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                  🎯 Advanced Search
                </button>
              </div>

              {/* Quick Search */}
              {searchType === 'quick' && (
                <div className="flex gap-2">
                  <input className="input" placeholder="Name, NIC, mobile number, or date of birth (YYYY-MM-DD)"
                    value={searchFields.q}
                    onChange={e => setSF('q', e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), searchPatient())} />
                  <button type="button" onClick={searchPatient} disabled={searching}
                    className="btn-secondary flex items-center gap-2 whitespace-nowrap">
                    <Search className="w-4 h-4" />
                    {searching ? 'Searching...' : 'Search'}
                  </button>
                </div>
              )}

              {/* Advanced Search */}
              {searchType === 'advanced' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="label">Patient Name</label>
                      <input className="input" placeholder="e.g. Suhesan"
                        value={searchFields.name} onChange={e => setSF('name', e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), searchPatient())} />
                    </div>
                    <div>
                      <label className="label">Date of Birth</label>
                      <input className="input" type="date"
                        value={searchFields.dob} onChange={e => setSF('dob', e.target.value)} />
                    </div>
                    <div>
                      <label className="label">Mobile Number</label>
                      <input className="input" placeholder="07XXXXXXXX" type="tel"
                        value={searchFields.mobile} onChange={e => setSF('mobile', e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), searchPatient())} />
                    </div>
                  </div>
                  <button type="button" onClick={searchPatient} disabled={searching}
                    className="btn-secondary flex items-center gap-2">
                    <Search className="w-4 h-4" />
                    {searching ? 'Searching...' : 'Search Patient'}
                  </button>
                </div>
              )}

              <p className="mt-2 text-xs text-gray-400">
                Patient not in the system?{' '}
                <button type="button" className="text-amber-600 underline hover:text-amber-700"
                  onClick={() => switchMode('manual')}>
                  Enter details manually →
                </button>
              </p>

              {/* Multiple results list */}
              {results.length > 1 && (
                <div className="mt-3 border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-3 py-2 text-xs text-gray-500 font-medium border-b border-gray-200">
                    {results.length} patients found — tap to select
                  </div>
                  {results.map((r, i) => (
                    <button key={r.id} type="button" onClick={() => selectPatient(r)}
                      className="w-full text-left px-4 py-3 hover:bg-brand-50 border-b border-gray-100 last:border-0 transition-colors flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-gray-800 text-sm">{r.full_name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {r.nic && <>NIC: {r.nic}</>}
                          {r.mobile && <> · 📞 {r.mobile}</>}
                          {r.date_of_birth && <> · DOB: {format(new Date(r.date_of_birth), 'dd MMM yyyy')}</>}
                          {r.district && <> · {r.district}</>}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Selected patient card */}
          {mode === 'search' && patient && (
            <PatientCard patient={patient} activeMedicines={activeMedicines}
              onClear={() => {
                setPatient(null); setResults([]); setPharmacies([]); setActiveMedicines([]);
                setDocuments([]); setDocFile(null); setDocNotes('');
              }} />
          )}

          {/* ── Manual Mode ── */}
          {mode === 'manual' && (
            <div className="space-y-3">
              <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg border border-amber-100 text-sm text-amber-800">
                <UserX className="w-4 h-4 mt-0.5 shrink-0 text-amber-500" />
                <span>For walk-in or unregistered patients. Only <strong>Name</strong> is required.</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="label">Patient Full Name *</label>
                  <input className="input" placeholder="e.g. Suhesan Arumugam"
                    value={manual.name} onChange={e => setManualField('name', e.target.value)} />
                </div>
                <div>
                  <label className="label">NIC Number <span className="text-gray-400 font-normal">(optional)</span></label>
                  <input className="input" placeholder="e.g. 199512345678"
                    value={manual.nic} onChange={e => setManualField('nic', e.target.value)} />
                </div>
                <div>
                  <label className="label">Mobile <span className="text-gray-400 font-normal">(optional)</span></label>
                  <input className="input" type="tel" placeholder="07XXXXXXXX"
                    value={manual.mobile} onChange={e => setManualField('mobile', e.target.value)} />
                </div>
                <div>
                  <label className="label">Date of Birth <span className="text-gray-400 font-normal">(optional)</span></label>
                  <input className="input" type="date"
                    value={manual.dob} onChange={e => setManualField('dob', e.target.value)} />
                </div>
                <div>
                  <label className="label">Gender <span className="text-gray-400 font-normal">(optional)</span></label>
                  <select className="input" value={manual.gender} onChange={e => setManualField('gender', e.target.value)}>
                    <option value="">— Select —</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Pharmacy (only when registered patient selected) ── */}
        {mode === 'search' && patient && (
          <div className="card p-4 sm:p-6">
            <div className="flex items-center justify-between mb-1">
              <h2 className="font-semibold">Pharmacy</h2>
              {patient.district && (
                <span className="text-xs text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> Nearby — {patient.district}
                </span>
              )}
            </div>
            {loadingPharmacies ? (
              <div className="input text-gray-400 text-sm">Loading nearby pharmacies...</div>
            ) : pharmacies.length === 0 ? (
              <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 text-sm text-amber-700">
                No approved pharmacies found{patient.district ? ` in ${patient.district} district` : ''}.
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
                  {pharmacies.length} pharmacy{pharmacies.length !== 1 ? 's' : ''} near patient · You can also send later
                </p>
              </>
            )}
          </div>
        )}

        {/* ── Medical Documents (X-ray, blood report, ECG...) — visible to doctor & patient only ── */}
        {mode === 'search' && patient && (
          <div className="card p-4 sm:p-6">
            <h2 className="font-semibold mb-1">Medical Documents</h2>
            <p className="text-xs text-gray-400 mb-4">Upload X-rays, blood reports, ECGs, or other files. The patient is notified automatically. Pharmacies cannot see these.</p>

            <div className="flex flex-col sm:flex-row gap-3 mb-3">
              <select className="input sm:w-48" value={docType} onChange={e => setDocType(e.target.value)}>
                <option value="xray">X-Ray</option>
                <option value="blood_report">Blood Report</option>
                <option value="ecg">ECG Report</option>
                <option value="other">Other</option>
              </select>
              <input className="input flex-1" placeholder="Notes (optional)" value={docNotes} onChange={e => setDocNotes(e.target.value)} />
            </div>

            <div className="flex flex-wrap gap-2 mb-3">
              <label className="btn-secondary flex items-center gap-2 text-sm cursor-pointer">
                <Upload className="w-4 h-4" /> Choose File
                <input type="file" accept=".pdf,image/jpeg,image/png,image/jpg" className="hidden"
                  onChange={e => setDocFile(e.target.files?.[0] || null)} />
              </label>
              <button type="button" onClick={() => setShowCamera(true)} className="btn-secondary flex items-center gap-2 text-sm">
                <Camera className="w-4 h-4" /> Take Photo
              </button>
              {docFile && (
                <span className="flex items-center gap-1.5 text-sm text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg">
                  <Paperclip className="w-3.5 h-3.5" /> {docFile.name}
                  <button type="button" onClick={() => setDocFile(null)} className="text-gray-400 hover:text-red-500">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              )}
              <button type="button" onClick={uploadDocument} disabled={!docFile || uploadingDoc}
                className="btn-primary flex items-center gap-2 text-sm ml-auto">
                {uploadingDoc ? 'Uploading...' : 'Upload'}
              </button>
            </div>

            {documents.length > 0 && (
              <div className="space-y-2 pt-3 border-t border-gray-100">
                {documents.map(doc => (
                  <div key={doc.id} className="flex items-center justify-between gap-2 p-2.5 bg-gray-50 rounded-lg text-sm">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="w-4 h-4 text-brand-600 shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium text-gray-800 truncate">{DOC_TYPE_LABELS[doc.document_type]} — {doc.file_name}</p>
                        <p className="text-xs text-gray-400">{format(new Date(doc.created_at), 'dd MMM yyyy, hh:mm a')} · {doc.uploaded_by_name}</p>
                      </div>
                    </div>
                    <a href={`${api.defaults.baseURL}/documents/${doc.id}/file`} target="_blank" rel="noreferrer"
                      onClick={async (e) => {
                        e.preventDefault();
                        const res = await api.get(`/documents/${doc.id}/file`, { responseType: 'blob' });
                        const url = URL.createObjectURL(res.data);
                        window.open(url, '_blank');
                      }}
                      className="text-brand-600 hover:text-brand-700 shrink-0">
                      <Download className="w-4 h-4" />
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {showCamera && (
          <CameraCapture onCapture={setDocFile} onClose={() => setShowCamera(false)} />
        )}

        {/* ── Clinical Details ── */}
        <div className="card p-4 sm:p-6">
          <h2 className="font-semibold mb-4">Clinical Details</h2>
          <div className="space-y-4">
            <div>
              <label className="label">Diagnosis</label>
              <input className="input" placeholder="e.g. Type 2 Diabetes Mellitus"
                value={diagnosis} onChange={e => setDiagnosis(e.target.value)} />
            </div>
            <div>
              <label className="label">Valid for (days)</label>
              <select className="input w-48" value={validDays} onChange={e => setValidDays(Number(e.target.value))}>
                <option value={7}>7 days</option>
                <option value={14}>14 days</option>
                <option value={30}>30 days</option>
                <option value={60}>60 days</option>
                <option value={90}>90 days</option>
              </select>
            </div>
            <div>
              <label className="label">Notes</label>
              <textarea className="input" rows={2} placeholder="Additional notes for pharmacist..."
                value={notes} onChange={e => setNotes(e.target.value)} />
            </div>
          </div>
        </div>

        {/* ── Safety warnings: allergy conflicts + drug interactions ── */}
        {safetyWarnings.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <h3 className="font-semibold text-red-800 text-sm">Safety check — please review</h3>
            </div>
            <ul className="space-y-1 mb-2">
              {safetyWarnings.map((w, i) => (
                <li key={i} className="text-sm text-red-700 flex items-start gap-1.5">
                  <span className="mt-1.5 w-1 h-1 rounded-full bg-red-500 shrink-0" />
                  {w}
                </li>
              ))}
            </ul>
            <p className="text-xs text-red-500">
              This is an automated aid based on common known interactions — it does not replace clinical judgement.
            </p>
          </div>
        )}

        {/* ── Medicines ── */}
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

        <div className="flex gap-3 pb-4">
          <button type="button" onClick={() => navigate('/doctor')} className="btn-secondary flex-1">Cancel</button>
          <button type="submit" disabled={loading} className="btn-primary flex-1">
            {loading ? 'Creating...' : 'Create Prescription'}
          </button>
        </div>
      </form>
    </div>
  );
}

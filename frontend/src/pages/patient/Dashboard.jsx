import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { FileText, Bell, MapPin, Activity, User, Pill, Stethoscope, Download, Navigation, Clock, ChevronDown, ChevronUp } from 'lucide-react';

// Expandable prescription card with full medicine details
function PrescriptionCard({ p, navigate, statusColors }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="card overflow-hidden">
      {/* Summary row — always visible */}
      <div className="p-4 cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => setOpen(!open)}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="font-mono text-sm font-semibold text-brand-700">{p.prescription_code}</span>
              <span className={`status-badge ${statusColors[p.status] || 'bg-gray-100 text-gray-600'}`}>{p.status}</span>
            </div>
            <p className="text-sm text-gray-700 font-medium">Dr. {p.doctor_name}</p>
            {p.diagnosis && <p className="text-xs text-gray-500 mt-0.5">Dx: {p.diagnosis}</p>}
            <p className="text-xs text-gray-400 mt-0.5">{format(new Date(p.created_at), 'dd MMM yyyy')} · Valid until {format(new Date(p.valid_until), 'dd MMM yyyy')}</p>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
          </div>
        </div>
      </div>

      {/* Expanded details */}
      {open && (
        <div className="border-t border-gray-100 bg-gray-50/50 p-4 space-y-3">
          {/* Doctor info */}
          <div className="text-xs text-gray-500">
            <span className="font-medium">Prescribed by:</span> Dr. {p.doctor_name}
            {p.slmc_number && ` · SLMC: ${p.slmc_number}`}
            {p.specialisation && ` · ${p.specialisation}`}
          </div>
          {p.pharmacy_name && (
            <div className="text-xs text-gray-500">
              <span className="font-medium">Pharmacy:</span> {p.pharmacy_name}
            </div>
          )}
          {p.notes && (
            <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 text-xs text-amber-800">
              <p className="font-semibold mb-0.5">Doctor's Notes</p>
              <p>{p.notes}</p>
            </div>
          )}

          {/* Medicines full detail */}
          {p.medicines?.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Medicines ({p.medicines.length})</p>
              {p.medicines.map((m, i) => (
                <div key={i} className="bg-white border border-gray-200 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold text-sm text-gray-900">{m.medicine_name}</p>
                    <span className="text-sm font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded-lg">{m.dosage}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 text-xs">
                    {m.frequency && (
                      <div className="bg-gray-50 rounded-lg p-2">
                        <p className="text-gray-400">How often</p>
                        <p className="font-semibold text-gray-700 mt-0.5">{m.frequency}</p>
                      </div>
                    )}
                    {m.quantity && (
                      <div className="bg-gray-50 rounded-lg p-2">
                        <p className="text-gray-400">Quantity</p>
                        <p className="font-semibold text-gray-700 mt-0.5">{m.quantity} tablet{m.quantity > 1 ? 's' : ''}</p>
                      </div>
                    )}
                    {m.duration && (
                      <div className="bg-gray-50 rounded-lg p-2">
                        <p className="text-gray-400">Duration</p>
                        <p className="font-semibold text-gray-700 mt-0.5">{m.duration}</p>
                      </div>
                    )}
                    {m.instructions && (
                      <div className="bg-green-50 border border-green-100 rounded-lg p-2 col-span-2">
                        <p className="text-green-500">Instructions</p>
                        <p className="font-medium text-green-800 mt-0.5">{m.instructions}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* PDF download */}
          <button onClick={() => navigate(`/prescription/${p.id}/pdf`)}
            className="flex items-center gap-1.5 text-xs text-brand-600 hover:underline font-medium pt-1">
            <Download className="w-3 h-3" /> Download Prescription PDF
          </button>
        </div>
      )}
    </div>
  );
}

function useGreeting() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const hour = now.getHours();
  let greeting, emoji;
  if (hour < 12)      { greeting = 'Good Morning';   emoji = '🌅'; }
  else if (hour < 17) { greeting = 'Good Afternoon';  emoji = '☀️'; }
  else if (hour < 20) { greeting = 'Good Evening';    emoji = '🌇'; }
  else                { greeting = 'Good Night';       emoji = '🌙'; }
  return { greeting, emoji, now };
}

const statusColors = {
  created: 'bg-yellow-50 text-yellow-700',
  sent: 'bg-blue-50 text-blue-700',
  received: 'bg-purple-50 text-purple-700',
  dispensed: 'bg-green-50 text-green-700',
  cancelled: 'bg-red-50 text-red-700',
};

export default function PatientDashboard() {
  const { user } = useAuth();
  const { greeting, emoji, now } = useGreeting();
  const navigate = useNavigate();
  const [prescriptions, setPrescriptions] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [pharmacies, setPharmacies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('dashboard');

  useEffect(() => {
    Promise.all([
      api.get('/prescriptions'),
      api.get('/notifications'),
      api.get('/pharmacies'),
    ]).then(([pRes, nRes, phRes]) => {
      setPrescriptions(pRes.data.data.prescriptions);
      setNotifications(nRes.data.data);
      setPharmacies(phRes.data.data);
    }).catch(() => toast.error('Failed to load data'))
      .finally(() => setLoading(false));
  }, []);

  const setPreferredPharmacy = async (pharmacy_id) => {
    try {
      await api.patch('/patients/preferred-pharmacy', { pharmacy_id });
      toast.success('Preferred pharmacy updated');
    } catch { toast.error('Failed to update'); }
  };

  const markRead = async (id) => {
    await api.patch(`/notifications/${id}/read`);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  // Analytics
  const dispensed = prescriptions.filter(p => p.status === 'dispensed');
  const active = prescriptions.filter(p => ['created','sent','received'].includes(p.status));

  // Medicines taken
  const medMap = {};
  dispensed.forEach(p => {
    (p.medicines || []).forEach(m => {
      const key = m.medicine_name;
      if (!medMap[key]) medMap[key] = { name: key, dosage: m.dosage, count: 0, times: [] };
      medMap[key].count++;
      medMap[key].times.push(format(new Date(p.created_at), 'dd MMM yyyy'));
    });
  });
  const topMedicines = Object.values(medMap).sort((a, b) => b.count - a.count);

  // Diseases
  const diseaseMap = {};
  dispensed.forEach(p => {
    if (!p.diagnosis) return;
    if (!diseaseMap[p.diagnosis]) diseaseMap[p.diagnosis] = { disease: p.diagnosis, count: 0, medicines: [] };
    diseaseMap[p.diagnosis].count++;
    (p.medicines || []).forEach(m => {
      if (!diseaseMap[p.diagnosis].medicines.includes(m.medicine_name)) {
        diseaseMap[p.diagnosis].medicines.push(m.medicine_name);
      }
    });
  });
  const topDiseases = Object.values(diseaseMap).sort((a, b) => b.count - a.count);

  // Doctors visited
  const doctorMap = {};
  prescriptions.forEach(p => {
    const key = p.doctor_name;
    if (!key) return;
    if (!doctorMap[key]) doctorMap[key] = { name: key, slmc: p.slmc_number, specialisation: p.specialisation, visits: 0, last_visit: p.created_at };
    doctorMap[key].visits++;
    if (new Date(p.created_at) > new Date(doctorMap[key].last_visit)) doctorMap[key].last_visit = p.created_at;
  });
  const doctors = Object.values(doctorMap).sort((a, b) => b.visits - a.visits);

  const tabs = [
    { key: 'tracker', label: 'Track Prescription', icon: Navigation },
    { key: 'dashboard', label: 'Dashboard', icon: Activity },
    { key: 'prescriptions', label: 'Prescriptions', icon: FileText },
    { key: 'medicines', label: 'Medicines', icon: Pill },
    { key: 'doctors', label: 'My Doctors', icon: Stethoscope },
    { key: 'notifications', label: `Alerts ${notifications.filter(n => !n.is_read).length > 0 ? `(${notifications.filter(n => !n.is_read).length})` : ''}`, icon: Bell },
    { key: 'pharmacy', label: 'Pharmacy', icon: MapPin },
  ];

  if (loading) return <div className="p-8 text-center text-gray-400">Loading...</div>;

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 gap-3">
        <div>
          <p className="text-xs text-gray-400 mb-0.5 flex items-center gap-1.5 flex-wrap">
            <Clock className="w-3.5 h-3.5" />
            {format(now, 'EEE, dd MMM yyyy')} &nbsp;·&nbsp;
            <span className="font-mono font-semibold text-gray-600 tracking-wider">
              {format(now, 'hh:mm:ss aa')}
            </span>
          </p>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{emoji} {greeting}, {user?.full_name}!</h1>
          <p className="text-gray-400 text-xs mt-0.5">NIC: {user?.nic} · Here's your health overview</p>
        </div>
        <button onClick={() => navigate(`/patient/summary-pdf`)}
          className="btn-primary flex items-center gap-2 text-sm self-start sm:self-auto whitespace-nowrap">
          <Download className="w-4 h-4" /> Health Summary PDF
        </button>
      </div>

      {/* Tabs - scrollable on mobile */}
      <div className="flex gap-1 mb-5 border-b border-gray-100 overflow-x-auto pb-0 scrollbar-hide">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-xs sm:text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
              tab === t.key ? 'border-brand-600 text-brand-700' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}>
            <t.icon className="w-3.5 h-3.5" /> {t.label}
          </button>
        ))}
      </div>

      {/* DASHBOARD TAB */}
      {tab === 'dashboard' && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Total prescriptions', value: prescriptions.length, color: 'bg-blue-50 text-blue-600' },
              { label: 'Medicines taken', value: dispensed.length, color: 'bg-green-50 text-green-600' },
              { label: 'Active prescriptions', value: active.length, color: 'bg-amber-50 text-amber-600' },
              { label: 'Doctors visited', value: doctors.length, color: 'bg-purple-50 text-purple-600' },
            ].map(s => (
              <div key={s.label} className="card p-4 text-center">
                <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                <p className="text-xs text-gray-500 mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Recent activity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="card p-5">
              <h2 className="font-semibold mb-4 flex items-center gap-2">
                <Pill className="w-4 h-4 text-brand-600" /> Most taken medicines
              </h2>
              {topMedicines.length > 0 ? (
                <div className="space-y-2">
                  {topMedicines.slice(0, 5).map((m, i) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium">{m.name}</p>
                        <p className="text-xs text-gray-400">{m.dosage}</p>
                      </div>
                      <span className="text-xs bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full font-medium">
                        ×{m.count}
                      </span>
                    </div>
                  ))}
                </div>
              ) : <p className="text-sm text-gray-400 text-center py-4">No medicines yet</p>}
            </div>

            <div className="card p-5">
              <h2 className="font-semibold mb-4 flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-brand-600" /> Doctors visited
              </h2>
              {doctors.length > 0 ? (
                <div className="space-y-2">
                  {doctors.slice(0, 5).map((d, i) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium">Dr. {d.name}</p>
                        <p className="text-xs text-gray-400">{d.specialisation || 'General'}</p>
                      </div>
                      <span className="text-xs text-gray-500">{d.visits} visit{d.visits > 1 ? 's' : ''}</span>
                    </div>
                  ))}
                </div>
              ) : <p className="text-sm text-gray-400 text-center py-4">No visits yet</p>}
            </div>

            <div className="card p-5">
              <h2 className="font-semibold mb-4 flex items-center gap-2">
                <Activity className="w-4 h-4 text-brand-600" /> Diagnoses history
              </h2>
              {topDiseases.length > 0 ? (
                <div className="space-y-2">
                  {topDiseases.slice(0, 5).map((d, i) => (
                    <div key={i} className="p-2 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium">{d.disease}</p>
                        <span className="text-xs text-gray-400">×{d.count}</span>
                      </div>
                      <p className="text-xs text-gray-400">Medicines: {d.medicines.join(', ')}</p>
                    </div>
                  ))}
                </div>
              ) : <p className="text-sm text-gray-400 text-center py-4">No diagnoses yet</p>}
            </div>

            <div className="card p-5">
              <h2 className="font-semibold mb-4 flex items-center gap-2">
                <FileText className="w-4 h-4 text-brand-600" /> Recent prescriptions
              </h2>
              {prescriptions.length > 0 ? (
                <div className="space-y-2">
                  {prescriptions.slice(0, 5).map((p, i) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-xs font-mono font-semibold text-brand-700">{p.prescription_code}</p>
                        <p className="text-xs text-gray-500">Dr. {p.doctor_name}</p>
                      </div>
                      <div className="text-right">
                        <span className={`status-badge text-xs ${statusColors[p.status] || 'bg-gray-100 text-gray-600'}`}>{p.status}</span>
                        <p className="text-xs text-gray-400 mt-0.5">{format(new Date(p.created_at), 'dd MMM')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : <p className="text-sm text-gray-400 text-center py-4">No prescriptions yet</p>}
            </div>
          </div>
        </>
      )}

      {/* TRACKER TAB */}
      {tab === 'tracker' && (
        <div className="text-center py-8">
          <p className="text-gray-500 mb-4">View real-time status of all your prescriptions</p>
          <button onClick={() => navigate('/patient/tracker')} className="btn-primary px-8 py-2.5">
            Open Prescription Tracker
          </button>
        </div>
      )}

      {/* PRESCRIPTIONS TAB */}
      {tab === 'prescriptions' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="font-semibold text-gray-800">All Prescriptions</h2>
            <span className="text-sm text-gray-400">{prescriptions.length} total</span>
          </div>
          {prescriptions.length === 0 ? (
            <div className="card p-8 text-center text-gray-400">No prescriptions yet</div>
          ) : (
            prescriptions.map(p => <PrescriptionCard key={p.id} p={p} navigate={navigate} statusColors={statusColors} />)
          )}
        </div>
      )}

      {/* MEDICINES TAB */}
      {tab === 'medicines' && (
        <div className="space-y-4">
          <div className="card p-5">
            <h2 className="font-semibold mb-4">Medicine history</h2>
            {topMedicines.length > 0 ? (
              <div className="space-y-3">
                {topMedicines.map((m, i) => (
                  <div key={i} className="border border-gray-100 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-medium">{m.name}</p>
                        <p className="text-sm text-gray-500">Dosage: {m.dosage}</p>
                      </div>
                      <span className="text-sm font-semibold text-brand-600 bg-brand-50 px-3 py-1 rounded-full">
                        {m.count} time{m.count > 1 ? 's' : ''}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400">Last taken: {m.times[m.times.length - 1]}</p>
                  </div>
                ))}
              </div>
            ) : <p className="text-center text-gray-400 py-8">No medicine history yet</p>}
          </div>
        </div>
      )}

      {/* DOCTORS TAB */}
      {tab === 'doctors' && (
        <div className="card p-5">
          <h2 className="font-semibold mb-4">Doctors I have visited</h2>
          {doctors.length > 0 ? (
            <div className="space-y-3">
              {doctors.map((d, i) => (
                <div key={i} className="border border-gray-100 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-brand-50 flex items-center justify-center">
                        <User className="w-5 h-5 text-brand-600" />
                      </div>
                      <div>
                        <p className="font-medium">Dr. {d.name}</p>
                        <p className="text-sm text-gray-500">{d.specialisation || 'General Practitioner'}</p>
                        <p className="text-xs text-gray-400">SLMC: {d.slmc}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-brand-600">{d.visits} visit{d.visits > 1 ? 's' : ''}</p>
                      <p className="text-xs text-gray-400">Last: {format(new Date(d.last_visit), 'dd MMM yyyy')}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : <p className="text-center text-gray-400 py-8">No doctors visited yet</p>}
        </div>
      )}

      {/* NOTIFICATIONS TAB */}
      {tab === 'notifications' && (
        <div className="card">
          <div className="p-4 border-b border-gray-100"><h2 className="font-semibold">Notifications</h2></div>
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-gray-400">No notifications</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {notifications.map(n => (
                <div key={n.id} onClick={() => !n.is_read && markRead(n.id)}
                  className={`p-4 cursor-pointer hover:bg-gray-50 ${!n.is_read ? 'bg-blue-50/30' : ''}`}>
                  <div className="flex items-start gap-3">
                    {!n.is_read && <div className="w-2 h-2 rounded-full bg-brand-500 mt-1.5 flex-shrink-0" />}
                    <div className={!n.is_read ? '' : 'ml-5'}>
                      <p className="text-sm font-medium">{n.title}</p>
                      <p className="text-sm text-gray-500">{n.message}</p>
                      <p className="text-xs text-gray-400 mt-1">{format(new Date(n.created_at), 'dd MMM yyyy HH:mm')}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* PHARMACY TAB */}
      {tab === 'pharmacy' && (
        <div className="card p-6">
          <h2 className="font-semibold mb-4">Set Preferred Pharmacy</h2>
          <p className="text-sm text-gray-500 mb-4">Your preferred pharmacy will be pre-selected when a doctor creates a prescription for you.</p>
          <div className="space-y-2">
            {pharmacies.map(ph => (
              <div key={ph.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:border-brand-200">
                <div>
                  <p className="font-medium text-sm">{ph.pharmacy_name}</p>
                  <p className="text-xs text-gray-400">{ph.address}, {ph.city}</p>
                </div>
                <button onClick={() => setPreferredPharmacy(ph.id)} className="btn-secondary text-xs py-1.5 px-3">
                  Select
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { CheckCircle, Clock, Package } from 'lucide-react';

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
  sent: 'bg-blue-50 text-blue-700',
  received: 'bg-purple-50 text-purple-700',
  dispensed: 'bg-green-50 text-green-700',
};

export default function PharmacyDashboard() {
  const { user } = useAuth();
  const { greeting, emoji, now } = useGreeting();
  const navigate = useNavigate();
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => { fetchPrescriptions(); }, []);

  const fetchPrescriptions = async () => {
    try {
      const { data } = await api.get('/prescriptions');
      setPrescriptions(data.data.prescriptions);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  const handleReceive = async (id, e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await api.post(`/prescriptions/${id}/receive`);
      toast.success('Prescription marked as received');
      fetchPrescriptions();
    } catch { toast.error('Failed to update'); }
  };

  const handleDispense = async (id, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('Confirm dispensing this prescription?')) return;
    try {
      await api.post(`/prescriptions/${id}/dispense`);
      toast.success('Prescription dispensed!');
      fetchPrescriptions();
    } catch { toast.error('Failed to dispense'); }
  };

  const filtered = filter === 'all' ? prescriptions : prescriptions.filter(p => p.status === filter);
  const counts = {
    sent: prescriptions.filter(p => p.status === 'sent').length,
    received: prescriptions.filter(p => p.status === 'received').length,
    dispensed: prescriptions.filter(p => p.status === 'dispensed').length,
  };

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      <div className="mb-5">
        <p className="text-xs text-gray-400 mb-0.5 flex items-center gap-1.5 flex-wrap">
          <Clock className="w-3.5 h-3.5" />
          {format(now, 'EEE, dd MMM yyyy')} &nbsp;·&nbsp;
          <span className="font-mono font-semibold text-gray-600 tracking-wider">
            {format(now, 'hh:mm:ss aa')}
          </span>
        </p>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{emoji} {greeting}, {user?.full_name}!</h1>
        <p className="text-gray-400 text-sm mt-0.5">Here's your pharmacy activity overview</p>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-5">
        {[
          { label: 'Awaiting', count: counts.sent, icon: Clock, color: 'text-blue-500' },
          { label: 'Received', count: counts.received, icon: Package, color: 'text-purple-500' },
          { label: 'Dispensed', count: counts.dispensed, icon: CheckCircle, color: 'text-green-500' },
        ].map(s => (
          <div key={s.label} className="card p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
              <div>
                <p className="text-xs sm:text-sm text-gray-500">{s.label}</p>
                <p className="text-xl sm:text-2xl font-bold mt-0.5">{s.count}</p>
              </div>
              <s.icon className={`w-5 h-5 sm:w-6 sm:h-6 ${s.color} hidden sm:block`} />
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="p-3 sm:p-4 border-b border-gray-100 flex items-center gap-2 overflow-x-auto scrollbar-hide">
          {['all', 'sent', 'received', 'dispensed'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                filter === f ? 'bg-brand-600 text-white' : 'text-gray-500 hover:bg-gray-100'
              }`}>
              {f === 'all' ? 'All' : f === 'sent' ? 'Awaiting' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No prescriptions found</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filtered.map(p => (
              <div key={p.id}
                onClick={() => navigate(`/doctor/prescription/${p.id}`)}
                className="p-3 sm:p-4 hover:bg-gray-50 cursor-pointer transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-mono text-sm font-semibold text-brand-700">{p.prescription_code}</span>
                      <span className={`status-badge ${statusColors[p.status] || 'bg-gray-100 text-gray-600'}`}>{p.status}</span>
                      <span className="text-xs text-gray-400 ml-auto">{format(new Date(p.created_at), 'dd MMM')}</span>
                    </div>
                    <p className="text-sm text-gray-700 font-medium truncate">
                      {p.patient_name || p.walk_in_patient?.name || 'Walk-in Patient'}
                      {p.walk_in_patient && <span className="ml-1 text-xs text-amber-600">(Unregistered)</span>}
                    </p>
                    <p className="text-xs text-gray-400">Dr. {p.doctor_name} · {p.medicines?.length || 0} item(s)</p>
                    {p.diagnosis && <p className="text-xs text-gray-500 mt-0.5">Dx: {p.diagnosis}</p>}
                  </div>
                </div>
                {/* Action buttons on their own row to prevent overflow */}
                {(p.status === 'sent' || p.status === 'received') && (
                  <div className="mt-2 flex justify-end">
                    {p.status === 'sent' && (
                      <button onClick={(e) => handleReceive(p.id, e)} className="btn-secondary text-xs py-1.5 px-4">
                        Receive
                      </button>
                    )}
                    {p.status === 'received' && (
                      <button onClick={(e) => handleDispense(p.id, e)} className="btn-primary text-xs py-1.5 px-4">
                        Dispense
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

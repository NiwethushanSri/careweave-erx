import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { FileText, Send, CheckCircle, Clock, Plus } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

function useGreeting() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const hour = now.getHours();
  let greeting, emoji;
  if (hour < 12) { greeting = 'Good Morning'; emoji = '🌅'; }
  else if (hour < 17) { greeting = 'Good Afternoon'; emoji = '☀️'; }
  else if (hour < 20) { greeting = 'Good Evening'; emoji = '🌇'; }
  else { greeting = 'Good Night'; emoji = '🌙'; }
  return { greeting, emoji, now };
}

const statusColors = {
  created: 'bg-yellow-50 text-yellow-700',
  sent: 'bg-blue-50 text-blue-700',
  received: 'bg-purple-50 text-purple-700',
  dispensed: 'bg-green-50 text-green-700',
  cancelled: 'bg-red-50 text-red-700',
  expired: 'bg-gray-100 text-gray-600',
};

export default function DoctorDashboard() {
  const { user } = useAuth();
  const { greeting, emoji, now } = useGreeting();
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, sent: 0, dispensed: 0, created: 0 });

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const fetchPrescriptions = async () => {
    try {
      const { data } = await api.get('/prescriptions');
      const list = data.data.prescriptions;
      setPrescriptions(list);
      setStats({
        total: list.length,
        created: list.filter(p => p.status === 'created').length,
        sent: list.filter(p => p.status === 'sent').length,
        dispensed: list.filter(p => p.status === 'dispensed').length,
      });
    } catch (err) {
      toast.error('Failed to load prescriptions');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
        <div>
          <p className="text-xs text-gray-400 mb-0.5 flex items-center gap-1.5 flex-wrap">
            <Clock className="w-3.5 h-3.5" />
            {format(now, 'EEE, dd MMM yyyy')} &nbsp;·&nbsp;
            <span className="font-mono font-semibold text-gray-600 tracking-wider">
              {format(now, 'hh:mm:ss aa')}
            </span>
          </p>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            {emoji} {greeting}, Dr. {user?.full_name}!
          </h1>
          <p className="text-gray-400 text-sm mt-0.5">Here's your prescription activity overview</p>
        </div>
        <Link to="/doctor/new-prescription" className="btn-primary flex items-center gap-2 self-start sm:self-auto whitespace-nowrap">
          <Plus className="w-4 h-4" /> New Prescription
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total', value: stats.total, icon: FileText, color: 'text-gray-600' },
          { label: 'Pending Send', value: stats.created, icon: Clock, color: 'text-yellow-600' },
          { label: 'Sent', value: stats.sent, icon: Send, color: 'text-blue-600' },
          { label: 'Dispensed', value: stats.dispensed, icon: CheckCircle, color: 'text-green-600' },
        ].map(s => (
          <div key={s.label} className="card p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500">{s.label}</span>
              <s.icon className={`w-4 h-4 ${s.color}`} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Prescriptions List */}
      <div className="card">
        <div className="p-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Recent Prescriptions</h2>
        </div>
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : prescriptions.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p>No prescriptions yet</p>
            <Link to="/doctor/new-prescription" className="text-brand-600 text-sm hover:underline">Create your first prescription</Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {prescriptions.map(p => (
              <Link key={p.id} to={`/doctor/prescription/${p.id}`}
                className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-mono text-sm font-semibold text-brand-700">{p.prescription_code}</span>
                    <span className={`status-badge ${statusColors[p.status] || 'bg-gray-100 text-gray-600'}`}>
                      {p.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 truncate">Patient: {p.patient_name || p.patient_nic}</p>
                  {p.pharmacy_name && <p className="text-xs text-gray-400">{p.pharmacy_name}</p>}
                </div>
                <div className="text-right ml-4">
                  <p className="text-xs text-gray-400">{format(new Date(p.created_at), 'dd MMM yyyy')}</p>
                  <p className="text-xs text-gray-400">{p.medicines?.length || 0} medicine(s)</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

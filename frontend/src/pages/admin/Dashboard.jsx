import { useState, useEffect } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { Users, FileText, CheckCircle, Clock, Shield } from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [pending, setPending] = useState({ doctors: [], pharmacies: [] });
  const [tab, setTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/admin/dashboard'),
      api.get('/admin/pending-approvals'),
    ]).then(([s, p]) => {
      setStats(s.data.data);
      setPending(p.data.data);
    }).catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  const handleApproval = async (userId, action) => {
    try {
      await api.post(`/admin/approve/${userId}`, { action });
      toast.success(`User ${action}d`);
      const { data } = await api.get('/admin/pending-approvals');
      setPending(data.data);
      const { data: sd } = await api.get('/admin/dashboard');
      setStats(sd.data);
    } catch { toast.error('Action failed'); }
  };

  if (loading) return <div className="p-8 text-center text-gray-400">Loading...</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Government Admin Portal</h1>
          <p className="text-gray-500 text-sm">RxSystem SL — System Management</p>
        </div>
      </div>

      {/* Nav tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { key: 'overview', label: 'Overview' },
          { key: 'approvals', label: `Approvals ${(pending.doctors.length + pending.pharmacies.length) > 0 ? `(${pending.doctors.length + pending.pharmacies.length})` : ''}` },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t.key ? 'bg-brand-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && stats && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Active Doctors', value: stats.users.doctors, icon: Users, color: 'text-blue-500' },
              { label: 'Active Pharmacies', value: stats.users.pharmacies, icon: Users, color: 'text-purple-500' },
              { label: 'Patients', value: stats.users.patients, icon: Users, color: 'text-teal-500' },
              { label: 'This Week', value: stats.prescriptions.this_week, icon: FileText, color: 'text-brand-500' },
            ].map(s => (
              <div key={s.label} className="card p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-500">{s.label}</span>
                  <s.icon className={`w-4 h-4 ${s.color}`} />
                </div>
                <p className="text-2xl font-bold">{s.value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="card p-6">
              <h3 className="font-semibold mb-4">Prescription Statistics</h3>
              <div className="space-y-3">
                {[
                  { label: 'Total prescriptions', value: stats.prescriptions.total },
                  { label: 'Successfully dispensed', value: stats.prescriptions.dispensed },
                  { label: 'Currently active', value: stats.prescriptions.active },
                ].map(item => (
                  <div key={item.label} className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">{item.label}</span>
                    <span className="font-semibold">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card p-6">
              <h3 className="font-semibold mb-4">Pending Approvals</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Doctors awaiting approval</span>
                  <span className={`font-semibold ${pending.doctors.length > 0 ? 'text-amber-600' : 'text-gray-900'}`}>
                    {pending.doctors.length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Pharmacies awaiting approval</span>
                  <span className={`font-semibold ${pending.pharmacies.length > 0 ? 'text-amber-600' : 'text-gray-900'}`}>
                    {pending.pharmacies.length}
                  </span>
                </div>
                {(pending.doctors.length + pending.pharmacies.length) > 0 && (
                  <button onClick={() => setTab('approvals')}
                    className="btn-primary w-full mt-2 text-sm">Review Approvals</button>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {tab === 'approvals' && (
        <div className="space-y-6">
          {/* Pending Doctors */}
          <div className="card">
            <div className="p-4 border-b border-gray-100">
              <h2 className="font-semibold">Pending Doctor Registrations ({pending.doctors.length})</h2>
            </div>
            {pending.doctors.length === 0 ? (
              <div className="p-6 text-center text-gray-400 text-sm">No pending doctor approvals</div>
            ) : (
              <div className="divide-y divide-gray-50">
                {pending.doctors.map(doc => (
                  <div key={doc.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-gray-900">{doc.full_name}</p>
                        <p className="text-sm text-gray-500">SLMC: {doc.slmc_number}</p>
                        <p className="text-sm text-gray-500">Specialisation: {doc.specialisation || '—'}</p>
                        <p className="text-sm text-gray-500">Clinic: {doc.clinic_name || '—'}</p>
                        <p className="text-xs text-gray-400">NIC: {doc.nic} · {doc.mobile}</p>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button onClick={() => handleApproval(doc.id, 'approve')}
                          className="btn-primary text-sm py-1.5 px-3">Approve</button>
                        <button onClick={() => handleApproval(doc.id, 'reject')}
                          className="btn-danger text-sm py-1.5 px-3">Reject</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pending Pharmacies */}
          <div className="card">
            <div className="p-4 border-b border-gray-100">
              <h2 className="font-semibold">Pending Pharmacy Registrations ({pending.pharmacies.length})</h2>
            </div>
            {pending.pharmacies.length === 0 ? (
              <div className="p-6 text-center text-gray-400 text-sm">No pending pharmacy approvals</div>
            ) : (
              <div className="divide-y divide-gray-50">
                {pending.pharmacies.map(ph => (
                  <div key={ph.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-gray-900">{ph.pharmacy_name}</p>
                        <p className="text-sm text-gray-500">Licence: {ph.licence_number}</p>
                        <p className="text-sm text-gray-500">{ph.address}, {ph.city}</p>
                        <p className="text-xs text-gray-400">Owner: {ph.full_name} · {ph.mobile}</p>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button onClick={() => handleApproval(ph.id, 'approve')}
                          className="btn-primary text-sm py-1.5 px-3">Approve</button>
                        <button onClick={() => handleApproval(ph.id, 'reject')}
                          className="btn-danger text-sm py-1.5 px-3">Reject</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

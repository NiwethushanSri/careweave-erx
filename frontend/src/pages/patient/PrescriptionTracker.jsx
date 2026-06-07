import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { CheckCircle, Clock, Package, Pill, FileText, ChevronRight } from 'lucide-react';

const steps = [
  { key: 'created', label: 'Prescription Created', icon: FileText, desc: 'Doctor created your prescription' },
  { key: 'sent', label: 'Sent to Pharmacy', icon: ChevronRight, desc: 'Doctor sent to pharmacy' },
  { key: 'received', label: 'Received by Pharmacy', icon: Package, desc: 'Pharmacy received and verified' },
  { key: 'dispensed', label: 'Medicines Dispensed', icon: Pill, desc: 'Medicines given to you' },
];

const statusIndex = { created: 0, sent: 1, received: 2, dispensed: 3, cancelled: -1 };

function TrackBar({ prescription }) {
  const currentStep = statusIndex[prescription.status] ?? 0;
  const isCancelled = prescription.status === 'cancelled';

  const stepTimes = {
    created: prescription.created_at,
    sent: prescription.sent_at,
    received: prescription.received_at,
    dispensed: prescription.dispensed_at,
  };

  return (
    <div className="card p-5 mb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="font-mono font-bold text-brand-700 text-sm">{prescription.prescription_code}</span>
          {isCancelled && (
            <span className="ml-2 text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-full">Cancelled</span>
          )}
        </div>
        <span className="text-xs text-gray-400">{format(new Date(prescription.created_at), 'dd MMM yyyy')}</span>
      </div>

      {/* Doctor & Diagnosis */}
      <div className="flex items-center gap-4 mb-5 text-sm text-gray-600">
        <span>Dr. {prescription.doctor_name}</span>
        {prescription.diagnosis && <span className="text-gray-400">· {prescription.diagnosis}</span>}
        {prescription.pharmacy_name && <span className="text-gray-400">· {prescription.pharmacy_name}</span>}
      </div>

      {/* Track bar */}
      {isCancelled ? (
        <div className="bg-red-50 border border-red-100 rounded-lg p-4 text-center text-red-600 text-sm font-medium">
          This prescription has been cancelled
        </div>
      ) : (
        <div className="relative">
          {/* Progress line */}
          <div className="absolute top-5 left-5 right-5 h-1 bg-gray-100 rounded" style={{ zIndex: 0 }} />
          <div className="absolute top-5 left-5 h-1 bg-brand-500 rounded transition-all duration-700"
            style={{ width: currentStep === 0 ? '0%' : `${(currentStep / 3) * 100}%`, zIndex: 1 }} />

          {/* Steps */}
          <div className="relative flex justify-between" style={{ zIndex: 2 }}>
            {steps.map((step, i) => {
              const done = i <= currentStep;
              const active = i === currentStep;
              const Icon = done ? CheckCircle : step.icon;

              return (
                <div key={step.key} className="flex flex-col items-center" style={{ width: '25%' }}>
                  {/* Circle */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                    done
                      ? 'bg-brand-600 border-brand-600 text-white'
                      : 'bg-white border-gray-200 text-gray-300'
                  } ${active ? 'ring-4 ring-brand-100' : ''}`}>
                    {done ? <CheckCircle className="w-5 h-5" /> : <step.icon className="w-4 h-4" />}
                  </div>

                  {/* Label */}
                  <p className={`text-xs font-medium mt-2 text-center leading-tight ${done ? 'text-brand-700' : 'text-gray-400'}`}>
                    {step.label}
                  </p>

                  {/* Time */}
                  {stepTimes[step.key] && (
                    <p className="text-xs text-gray-400 mt-1 text-center">
                      {format(new Date(stepTimes[step.key]), 'dd MMM HH:mm')}
                    </p>
                  )}
                  {!stepTimes[step.key] && done && i === currentStep && (
                    <p className="text-xs text-brand-500 mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> In progress
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Medicines */}
      {prescription.medicines?.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-50">
          <p className="text-xs text-gray-400 mb-2">Medicines</p>
          <div className="flex flex-wrap gap-1.5">
            {prescription.medicines.map((m, i) => (
              <span key={i} className="text-xs bg-gray-50 border border-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                {m.medicine_name} {m.dosage}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function PrescriptionTracker() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    api.get('/prescriptions')
      .then(r => setPrescriptions(r.data.data.prescriptions || []))
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  const filters = [
    { key: 'all', label: 'All' },
    { key: 'active', label: 'Active' },
    { key: 'dispensed', label: 'Dispensed' },
    { key: 'cancelled', label: 'Cancelled' },
  ];

  const filtered = prescriptions.filter(p => {
    if (filter === 'all') return true;
    if (filter === 'active') return ['created', 'sent', 'received'].includes(p.status);
    return p.status === filter;
  });

  const active = prescriptions.filter(p => ['created','sent','received'].includes(p.status)).length;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Prescription Tracker</h1>
          <p className="text-sm text-gray-500">Track your prescription journey in real time</p>
        </div>
        {active > 0 && (
          <span className="bg-brand-50 text-brand-700 text-sm font-medium px-3 py-1 rounded-full">
            {active} active
          </span>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        {filters.map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === f.key ? 'bg-brand-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}>
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading your prescriptions...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>No prescriptions found</p>
        </div>
      ) : (
        <div>
          {filtered.map(p => (
            <TrackBar key={p.id} prescription={p} />
          ))}
        </div>
      )}
    </div>
  );
}

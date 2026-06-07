import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';
import { ArrowLeft, Printer } from 'lucide-react';
import toast from 'react-hot-toast';

export default function PatientSummaryPDF() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/prescriptions')
      .then(r => setPrescriptions(r.data.data.prescriptions || []))
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  const dispensed = prescriptions.filter(p => p.status === 'dispensed');

  const medMap = {};
  dispensed.forEach(p => {
    (p.medicines || []).forEach(m => {
      if (!medMap[m.medicine_name]) medMap[m.medicine_name] = { name: m.medicine_name, dosage: m.dosage, count: 0, dates: [] };
      medMap[m.medicine_name].count++;
      medMap[m.medicine_name].dates.push(format(new Date(p.created_at), 'dd MMM yyyy'));
    });
  });
  const medicines = Object.values(medMap).sort((a, b) => b.count - a.count);

  const diseaseMap = {};
  dispensed.forEach(p => {
    if (!p.diagnosis) return;
    if (!diseaseMap[p.diagnosis]) diseaseMap[p.diagnosis] = { disease: p.diagnosis, count: 0, meds: [] };
    diseaseMap[p.diagnosis].count++;
    (p.medicines || []).forEach(m => {
      if (!diseaseMap[p.diagnosis].meds.includes(m.medicine_name)) diseaseMap[p.diagnosis].meds.push(m.medicine_name);
    });
  });
  const diseases = Object.values(diseaseMap).sort((a, b) => b.count - a.count);

  const doctorMap = {};
  prescriptions.forEach(p => {
    if (!p.doctor_name) return;
    if (!doctorMap[p.doctor_name]) doctorMap[p.doctor_name] = { name: p.doctor_name, slmc: p.slmc_number, spec: p.specialisation, visits: 0, last: p.created_at };
    doctorMap[p.doctor_name].visits++;
    if (new Date(p.created_at) > new Date(doctorMap[p.doctor_name].last)) doctorMap[p.doctor_name].last = p.created_at;
  });
  const doctors = Object.values(doctorMap).sort((a, b) => b.visits - a.visits);

  if (loading) return <div className="p-8 text-center text-gray-400">Loading...</div>;

  const SectionTitle = ({ color, label }) => (
    <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3 flex items-center gap-2">
      <span className={`w-1 h-4 ${color} rounded inline-block`} /> {label}
    </h2>
  );

  return (
    <div>
      {/* Top bar */}
      <div className="print:hidden p-4 flex items-center gap-3 border-b border-gray-100 bg-white sticky top-0 z-10">
        <button onClick={() => navigate('/patient')} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <button onClick={() => window.print()} className="btn-primary flex items-center gap-2 text-sm ml-auto">
          <Printer className="w-4 h-4" /> Print / Download PDF
        </button>
      </div>

      <div className="max-w-2xl mx-auto p-4 sm:p-8 bg-white" id="summary-pdf">
        {/* Header */}
        <div className="border-b-2 border-green-600 pb-4 mb-5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-green-700">Patient Health Summary</h1>
              <p className="text-xs sm:text-sm text-gray-500">CareWeave eRx · Ministry of Health Sri Lanka</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs text-gray-400">Generated on</p>
              <p className="text-sm font-semibold">{format(new Date(), 'dd MMM yyyy')}</p>
            </div>
          </div>
        </div>

        {/* Patient info */}
        <div className="bg-gray-50 rounded-lg p-3 sm:p-4 mb-5">
          <h2 className="text-xs font-semibold text-gray-400 uppercase mb-3">Patient Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            <div><span className="text-gray-500">Full Name: </span><span className="font-semibold">{user?.full_name}</span></div>
            <div><span className="text-gray-500">NIC: </span><span className="font-semibold">{user?.nic}</span></div>
            <div><span className="text-gray-500">Mobile: </span>{user?.mobile}</div>
            <div><span className="text-gray-500">Email: </span>{user?.email || '—'}</div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-5">
          {[
            { label: 'Total prescriptions', value: prescriptions.length },
            { label: 'Medicines dispensed', value: dispensed.length },
            { label: 'Doctors visited', value: doctors.length },
          ].map(s => (
            <div key={s.label} className="border border-gray-200 rounded-lg p-2 sm:p-3 text-center">
              <p className="text-2xl font-bold text-green-700">{s.value}</p>
              <p className="text-xs text-gray-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Doctors visited */}
        {doctors.length > 0 && (
          <div className="mb-5">
            <SectionTitle color="bg-green-600" label="Doctors Visited" />
            {/* Mobile cards */}
            <div className="sm:hidden space-y-2">
              {doctors.map((d, i) => (
                <div key={i} className="border border-gray-200 rounded-lg p-3">
                  <p className="font-semibold text-sm">Dr. {d.name}</p>
                  <p className="text-xs text-gray-500">{d.spec || 'General'} · {d.slmc}</p>
                  <div className="flex justify-between mt-1">
                    <span className="text-xs text-green-700 font-semibold">{d.visits} visit(s)</span>
                    <span className="text-xs text-gray-400">{format(new Date(d.last), 'dd MMM yyyy')}</span>
                  </div>
                </div>
              ))}
            </div>
            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
                <thead className="bg-green-50">
                  <tr>
                    <th className="text-left p-2.5 text-gray-600 font-medium">Doctor</th>
                    <th className="text-left p-2.5 text-gray-600 font-medium">Specialisation</th>
                    <th className="text-left p-2.5 text-gray-600 font-medium">SLMC</th>
                    <th className="text-center p-2.5 text-gray-600 font-medium">Visits</th>
                    <th className="text-right p-2.5 text-gray-600 font-medium">Last visit</th>
                  </tr>
                </thead>
                <tbody>
                  {doctors.map((d, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="p-2.5 font-medium">Dr. {d.name}</td>
                      <td className="p-2.5 text-gray-600">{d.spec || 'General'}</td>
                      <td className="p-2.5 text-gray-500">{d.slmc}</td>
                      <td className="p-2.5 text-center font-semibold text-green-700">{d.visits}</td>
                      <td className="p-2.5 text-right text-gray-500">{format(new Date(d.last), 'dd MMM yyyy')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Diagnosis History */}
        {diseases.length > 0 && (
          <div className="mb-5">
            <SectionTitle color="bg-blue-500" label="Diagnosis History" />
            <div className="sm:hidden space-y-2">
              {diseases.map((d, i) => (
                <div key={i} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex justify-between">
                    <p className="font-semibold text-sm">{d.disease}</p>
                    <span className="text-xs text-blue-700 font-semibold">{d.count}x</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Medicines: {d.meds.join(', ')}</p>
                </div>
              ))}
            </div>
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
                <thead className="bg-blue-50">
                  <tr>
                    <th className="text-left p-2.5 text-gray-600 font-medium">Diagnosis</th>
                    <th className="text-center p-2.5 text-gray-600 font-medium">Times</th>
                    <th className="text-left p-2.5 text-gray-600 font-medium">Medicines prescribed</th>
                  </tr>
                </thead>
                <tbody>
                  {diseases.map((d, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="p-2.5 font-medium">{d.disease}</td>
                      <td className="p-2.5 text-center font-semibold text-blue-700">{d.count}</td>
                      <td className="p-2.5 text-gray-600">{d.meds.join(', ')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Medicine History */}
        {medicines.length > 0 && (
          <div className="mb-5">
            <SectionTitle color="bg-purple-500" label="Medicine History" />
            <div className="sm:hidden space-y-2">
              {medicines.map((m, i) => (
                <div key={i} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex justify-between">
                    <p className="font-semibold text-sm">{m.name}</p>
                    <span className="text-xs text-purple-700 font-semibold">{m.count}x prescribed</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Dosage: {m.dosage}</p>
                  <p className="text-xs text-gray-400">Last: {m.dates[m.dates.length - 1]}</p>
                </div>
              ))}
            </div>
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
                <thead className="bg-purple-50">
                  <tr>
                    <th className="text-left p-2.5 text-gray-600 font-medium">Medicine</th>
                    <th className="text-left p-2.5 text-gray-600 font-medium">Dosage</th>
                    <th className="text-center p-2.5 text-gray-600 font-medium">Times prescribed</th>
                    <th className="text-right p-2.5 text-gray-600 font-medium">Last prescribed</th>
                  </tr>
                </thead>
                <tbody>
                  {medicines.map((m, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="p-2.5 font-medium">{m.name}</td>
                      <td className="p-2.5 text-gray-600">{m.dosage}</td>
                      <td className="p-2.5 text-center font-semibold text-purple-700">{m.count}</td>
                      <td className="p-2.5 text-right text-gray-500">{m.dates[m.dates.length - 1]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Prescription History */}
        <div className="mb-5">
          <SectionTitle color="bg-amber-500" label="Prescription History" />
          <div className="sm:hidden space-y-2">
            {prescriptions.map((p, i) => (
              <div key={i} className="border border-gray-200 rounded-lg p-3">
                <div className="flex justify-between items-start">
                  <p className="font-mono text-xs text-green-700 font-semibold">{p.prescription_code}</p>
                  <span className="text-xs text-gray-400">{format(new Date(p.created_at), 'dd MMM yyyy')}</span>
                </div>
                <p className="text-sm font-medium mt-1">Dr. {p.doctor_name}</p>
                <div className="flex justify-between mt-1">
                  <span className="text-xs text-gray-500">{p.diagnosis || '—'}</span>
                  <span className="text-xs capitalize font-medium text-gray-600">{p.status}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
              <thead className="bg-amber-50">
                <tr>
                  <th className="text-left p-2.5 text-gray-600 font-medium">Code</th>
                  <th className="text-left p-2.5 text-gray-600 font-medium">Doctor</th>
                  <th className="text-left p-2.5 text-gray-600 font-medium">Diagnosis</th>
                  <th className="text-left p-2.5 text-gray-600 font-medium">Status</th>
                  <th className="text-right p-2.5 text-gray-600 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {prescriptions.map((p, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="p-2.5 font-mono text-xs text-green-700">{p.prescription_code}</td>
                    <td className="p-2.5">Dr. {p.doctor_name}</td>
                    <td className="p-2.5 text-gray-600">{p.diagnosis || '—'}</td>
                    <td className="p-2.5 capitalize text-gray-600">{p.status}</td>
                    <td className="p-2.5 text-right text-gray-500">{format(new Date(p.created_at), 'dd MMM yyyy')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 pt-4 text-center">
          <p className="text-xs text-gray-400">This is an official health summary generated by CareWeave eRx</p>
          <p className="text-xs text-gray-400">Ministry of Health Sri Lanka · Developed by Niwethushan · Forge9x</p>
        </div>
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          #summary-pdf, #summary-pdf * { visibility: visible; }
          #summary-pdf { position: absolute; left: 0; top: 0; width: 100%; padding: 20px; }
          .sm\\:hidden { display: none !important; }
          .hidden { display: block !important; }
        }
      `}</style>
    </div>
  );
}

import { useState, useEffect } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { TrendingUp, Package, CheckCircle, Clock, Users, FileText, Pill, Activity } from 'lucide-react';

const COLORS = ['#059669','#3b82f6','#f59e0b','#ef4444','#8b5cf6','#ec4899','#06b6d4','#84cc16'];
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function PharmacyAnalytics() {
  const [period, setPeriod] = useState('yearly');
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [tab, setTab] = useState('overview');
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const years = [2024, 2025, 2026, 2027];

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/prescriptions');
      setPrescriptions(data.data.prescriptions || []);
    } catch { toast.error('Failed to load data'); }
    finally { setLoading(false); }
  };

  const filtered = prescriptions.filter(p => {
    const d = new Date(p.created_at);
    if (period === 'yearly') return d.getFullYear() === year;
    if (period === 'monthly') return d.getFullYear() === year && d.getMonth() + 1 === month;
    return d >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  });

  const dispensed = filtered.filter(p => p.status === 'dispensed');
  const pending = filtered.filter(p => p.status === 'sent' || p.status === 'received');
  const rate = filtered.length > 0 ? Math.round((dispensed.length / filtered.length) * 100) : 0;

  // Monthly chart data
  const monthlyData = MONTHS.map((m, i) => {
    const mp = prescriptions.filter(p => {
      const d = new Date(p.created_at);
      return d.getFullYear() === year && d.getMonth() === i;
    });
    return { month: m, Received: mp.length, Dispensed: mp.filter(p => p.status === 'dispensed').length };
  });

  const daysInMonth = new Date(year, month, 0).getDate();
  const dailyData = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    const dp = prescriptions.filter(p => {
      const d = new Date(p.created_at);
      return d.getFullYear() === year && d.getMonth() + 1 === month && d.getDate() === day;
    });
    return { day: `${day}`, Received: dp.length, Dispensed: dp.filter(p => p.status === 'dispensed').length };
  }).filter(d => d.Received > 0);

  const chartData = period === 'yearly' ? monthlyData : dailyData;
  const xKey = period === 'yearly' ? 'month' : 'day';

  // Top doctors
  const doctorMap = {};
  filtered.forEach(p => {
    const name = p.doctor_name || 'Unknown';
    if (!doctorMap[name]) doctorMap[name] = { name, total: 0, dispensed: 0, slmc: p.slmc_number };
    doctorMap[name].total++;
    if (p.status === 'dispensed') doctorMap[name].dispensed++;
  });
  const topDoctors = Object.values(doctorMap).sort((a, b) => b.total - a.total).slice(0, 8);

  // ===== MEDICINE ANALYTICS =====
  const allMedicines = [];
  dispensed.forEach(p => {
    (p.medicines || []).forEach(m => {
      allMedicines.push({
        name: m.medicine_name,
        quantity: parseInt(m.quantity) || 1,
        dosage: m.dosage,
        diagnosis: p.diagnosis || 'Not specified',
      });
    });
  });

  // Top medicines by dispensing count
  const medMap = {};
  allMedicines.forEach(m => {
    const key = m.name;
    if (!medMap[key]) medMap[key] = { name: key, count: 0, totalQty: 0, dosage: m.dosage };
    medMap[key].count++;
    medMap[key].totalQty += m.quantity;
  });
  const topMedicines = Object.values(medMap).sort((a, b) => b.count - a.count).slice(0, 10);

  // Medicine by quantity
  const topByQty = Object.values(medMap).sort((a, b) => b.totalQty - a.totalQty).slice(0, 8);

  // Disease vs medicine mapping
  const diseaseMap = {};
  dispensed.forEach(p => {
    const dx = p.diagnosis || 'Not specified';
    if (!diseaseMap[dx]) diseaseMap[dx] = { disease: dx, count: 0, medicines: {} };
    diseaseMap[dx].count++;
    (p.medicines || []).forEach(m => {
      diseaseMap[dx].medicines[m.medicine_name] = (diseaseMap[dx].medicines[m.medicine_name] || 0) + 1;
    });
  });
  const topDiseases = Object.values(diseaseMap).sort((a, b) => b.count - a.count).slice(0, 8);

  // Medicines for pie chart (top 6)
  const medPieData = topMedicines.slice(0, 6).map(m => ({ name: m.name, value: m.count }));

  const statusData = [
    { name: 'Dispensed', value: dispensed.length },
    { name: 'Pending', value: pending.length },
    { name: 'Cancelled', value: filtered.filter(p => p.status === 'cancelled').length },
  ].filter(d => d.value > 0);

  const tabs = [
    { key: 'overview', label: 'Overview', icon: TrendingUp },
    { key: 'medicines', label: 'Medicine Sales', icon: Pill },
    { key: 'diseases', label: 'Disease Analytics', icon: Activity },
    { key: 'doctors', label: 'Doctors', icon: Users },
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pharmacy Analytics</h1>
          <p className="text-sm text-gray-500">Sales, medicine trends & doctor tracking</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex bg-gray-100 rounded-lg p-1">
            {['weekly','monthly','yearly'].map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors capitalize ${period === p ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                {p}
              </button>
            ))}
          </div>
          {period !== 'weekly' && (
            <select className="input w-auto" value={year} onChange={e => setYear(Number(e.target.value))}>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          )}
          {period === 'monthly' && (
            <select className="input w-auto" value={month} onChange={e => setMonth(Number(e.target.value))}>
              {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-100 pb-0">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === t.key ? 'border-brand-600 text-brand-700' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}>
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400">Loading analytics...</div>
      ) : (
        <>
          {/* Summary cards always visible */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Total received', value: filtered.length, icon: FileText, color: 'text-blue-500', bg: 'bg-blue-50' },
              { label: 'Dispensed', value: dispensed.length, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
              { label: 'Pending', value: pending.length, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50' },
              { label: 'Success rate', value: `${rate}%`, icon: TrendingUp, color: 'text-brand-600', bg: 'bg-brand-50' },
            ].map(s => (
              <div key={s.label} className="card p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-500">{s.label}</span>
                  <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center`}>
                    <s.icon className={`w-4 h-4 ${s.color}`} />
                  </div>
                </div>
                <p className="text-2xl font-bold text-gray-900">{s.value}</p>
              </div>
            ))}
          </div>

          {/* OVERVIEW TAB */}
          {tab === 'overview' && (
            <>
              <div className="card p-6 mb-6">
                <h2 className="font-semibold mb-4">
                  Prescriptions {period === 'yearly' ? `by month — ${year}` : period === 'monthly' ? `— ${MONTHS[month-1]} ${year}` : '— last 7 days'}
                </h2>
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey={xKey} tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                      <Tooltip /><Legend />
                      <Bar dataKey="Received" fill="#3b82f6" radius={[4,4,0,0]} />
                      <Bar dataKey="Dispensed" fill="#059669" radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <div className="h-40 flex items-center justify-center text-gray-400">No data</div>}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="card p-6">
                  <h2 className="font-semibold mb-4">Status breakdown</h2>
                  {statusData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie data={statusData} cx="50%" cy="50%" outerRadius={75} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                          {statusData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : <div className="h-40 flex items-center justify-center text-gray-400">No data</div>}
                </div>
                <div className="card p-6">
                  <h2 className="font-semibold mb-4">Annual trend — {year}</h2>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                      <Tooltip />
                      <Line type="monotone" dataKey="Dispensed" stroke="#059669" strokeWidth={2} dot={{ r: 3 }} />
                      <Line type="monotone" dataKey="Received" stroke="#3b82f6" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          )}

          {/* MEDICINE SALES TAB */}
          {tab === 'medicines' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                <div className="card p-6">
                  <h2 className="font-semibold mb-1">Most dispensed medicines</h2>
                  <p className="text-xs text-gray-400 mb-4">By number of prescriptions</p>
                  {topMedicines.length > 0 ? (
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={topMedicines.slice(0,8)} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                        <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={100} />
                        <Tooltip />
                        <Bar dataKey="count" fill="#059669" radius={[0,4,4,0]} name="Prescriptions" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : <div className="h-40 flex items-center justify-center text-gray-400">No dispensed data</div>}
                </div>

                <div className="card p-6">
                  <h2 className="font-semibold mb-1">Medicine share</h2>
                  <p className="text-xs text-gray-400 mb-4">Top 6 medicines by frequency</p>
                  {medPieData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={260}>
                      <PieChart>
                        <Pie data={medPieData} cx="50%" cy="50%" outerRadius={90} dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          labelLine={false}>
                          {medPieData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : <div className="h-40 flex items-center justify-center text-gray-400">No data</div>}
                </div>
              </div>

              <div className="card p-6">
                <h2 className="font-semibold mb-1">Total units dispensed</h2>
                <p className="text-xs text-gray-400 mb-4">By total quantity across all prescriptions</p>
                {topByQty.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={topByQty}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-20} textAnchor="end" height={50} />
                      <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="totalQty" fill="#3b82f6" radius={[4,4,0,0]} name="Units" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <div className="h-24 flex items-center justify-center text-gray-400">No data</div>}
              </div>

              <div className="card p-6 mt-6">
                <h2 className="font-semibold mb-4">Medicine sales table</h2>
                {topMedicines.length > 0 ? (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left py-2 text-gray-500 font-medium">#</th>
                        <th className="text-left py-2 text-gray-500 font-medium">Medicine</th>
                        <th className="text-left py-2 text-gray-500 font-medium">Common dosage</th>
                        <th className="text-right py-2 text-gray-500 font-medium">Prescriptions</th>
                        <th className="text-right py-2 text-gray-500 font-medium">Total units</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {topMedicines.map((m, i) => (
                        <tr key={i}>
                          <td className="py-2 text-gray-400">{i + 1}</td>
                          <td className="py-2 font-medium">{m.name}</td>
                          <td className="py-2 text-gray-500">{m.dosage}</td>
                          <td className="py-2 text-right font-semibold text-green-600">{m.count}</td>
                          <td className="py-2 text-right font-semibold text-blue-600">{m.totalQty}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : <div className="py-8 text-center text-gray-400">No medicine data for this period</div>}
              </div>
            </>
          )}

          {/* DISEASE ANALYTICS TAB */}
          {tab === 'diseases' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                <div className="card p-6">
                  <h2 className="font-semibold mb-1">Most common diagnoses</h2>
                  <p className="text-xs text-gray-400 mb-4">Diseases with most prescriptions</p>
                  {topDiseases.length > 0 ? (
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={topDiseases} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                        <YAxis type="category" dataKey="disease" tick={{ fontSize: 11 }} width={120} />
                        <Tooltip />
                        <Bar dataKey="count" fill="#8b5cf6" radius={[0,4,4,0]} name="Cases" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : <div className="h-40 flex items-center justify-center text-gray-400">No diagnosis data</div>}
                </div>

                <div className="card p-6">
                  <h2 className="font-semibold mb-1">Disease distribution</h2>
                  <p className="text-xs text-gray-400 mb-4">Proportion of each diagnosis</p>
                  {topDiseases.length > 0 ? (
                    <ResponsiveContainer width="100%" height={280}>
                      <PieChart>
                        <Pie data={topDiseases.slice(0,6).map(d => ({ name: d.disease, value: d.count }))}
                          cx="50%" cy="50%" outerRadius={90} dataKey="value"
                          label={({ name, percent }) => `${(percent*100).toFixed(0)}%`} labelLine={false}>
                          {topDiseases.slice(0,6).map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : <div className="h-40 flex items-center justify-center text-gray-400">No data</div>}
                </div>
              </div>

              <div className="card p-6">
                <h2 className="font-semibold mb-4">Disease — medicine breakdown</h2>
                <p className="text-xs text-gray-400 mb-4">Which medicines are prescribed for each disease</p>
                {topDiseases.length > 0 ? (
                  <div className="space-y-4">
                    {topDiseases.slice(0, 6).map((d, i) => (
                      <div key={i} className="border border-gray-100 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ background: COLORS[i] }} />
                            <span className="font-medium text-sm">{d.disease}</span>
                          </div>
                          <span className="text-xs text-gray-400">{d.count} case{d.count > 1 ? 's' : ''}</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {Object.entries(d.medicines)
                            .sort((a, b) => b[1] - a[1])
                            .slice(0, 6)
                            .map(([med, count], j) => (
                              <span key={j} className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-50 border border-gray-100 rounded-full text-xs text-gray-700">
                                {med}
                                <span className="text-gray-400">×{count}</span>
                              </span>
                            ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : <div className="py-8 text-center text-gray-400">No data for this period</div>}
              </div>
            </>
          )}

          {/* DOCTORS TAB */}
          {tab === 'doctors' && (
            <div className="card p-6">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-brand-600" />
                <h2 className="font-semibold">Doctors sending prescriptions</h2>
                <span className="ml-auto text-sm text-gray-400">{topDoctors.length} doctors</span>
              </div>
              {topDoctors.length > 0 ? (
                <>
                  <div className="mb-6">
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={topDoctors} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis type="number" tick={{ fontSize: 12 }} allowDecimals={false} />
                        <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={100}
                          tickFormatter={v => `Dr. ${v.split(' ')[0]}`} />
                        <Tooltip />
                        <Bar dataKey="total" fill="#3b82f6" radius={[0,4,4,0]} name="Sent" />
                        <Bar dataKey="dispensed" fill="#059669" radius={[0,4,4,0]} name="Dispensed" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {topDoctors.map((doc, i) => (
                      <div key={i} className="flex items-center justify-between py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-full bg-brand-50 text-brand-700 text-xs flex items-center justify-center font-semibold">{i + 1}</div>
                          <div>
                            <p className="text-sm font-medium">Dr. {doc.name}</p>
                            <p className="text-xs text-gray-400">{doc.slmc}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-6 text-sm">
                          <div className="text-center">
                            <p className="font-semibold text-blue-600">{doc.total}</p>
                            <p className="text-xs text-gray-400">Sent</p>
                          </div>
                          <div className="text-center">
                            <p className="font-semibold text-green-600">{doc.dispensed}</p>
                            <p className="text-xs text-gray-400">Dispensed</p>
                          </div>
                          <div className="text-center">
                            <p className="font-semibold text-gray-600">{doc.total > 0 ? Math.round((doc.dispensed / doc.total) * 100) : 0}%</p>
                            <p className="text-xs text-gray-400">Rate</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : <div className="py-8 text-center text-gray-400">No doctor data for this period</div>}
            </div>
          )}
        </>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { TrendingUp, FileText, CheckCircle, Clock, Users, Download } from 'lucide-react';
import * as XLSX from 'xlsx';

const COLORS = ['#059669', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function Analytics() {
  const [period, setPeriod] = useState('monthly');
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, [period, year, month]);

  const fetchData = async () => {
    setLoading(true);
    try {
      let from, to;
      const now = new Date();

      if (period === 'monthly') {
        from = new Date(year, month - 1, 1).toISOString();
        to = new Date(year, month, 0, 23, 59, 59).toISOString();
      } else if (period === 'yearly') {
        from = new Date(year, 0, 1).toISOString();
        to = new Date(year, 11, 31, 23, 59, 59).toISOString();
      } else {
        from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6).toISOString();
        to = now.toISOString();
      }

      const { data: res } = await api.get(`/admin/reports?from=${from}&to=${to}`);
      setData(res.data);
    } catch {
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  const exportExcel = () => {
    if (!data) return toast.error('No data to export');

    const periodLabel = period === 'yearly'
      ? `${year}`
      : period === 'monthly'
      ? `${months[month - 1]}_${year}`
      : 'Last_7_days';

    const wb = XLSX.utils.book_new();

    // ── Sheet 1: Summary ──────────────────────────────────────────
    const summaryRows = [
      ['CareWeave eRx — Annual Report'],
      [`Period: ${period === 'yearly' ? year : period === 'monthly' ? `${months[month-1]} ${year}` : 'Last 7 Days'}`],
      [`Generated: ${new Date().toLocaleString()}`],
      [],
      ['Metric', 'Value'],
      ['Total Prescriptions Created', totalCreated],
      ['Total Dispensed', totalDispensed],
      ['Dispensing Rate', `${dispensingRate}%`],
      ['Active Doctors', data.topDoctors?.length || 0],
    ];
    const ws1 = XLSX.utils.aoa_to_sheet(summaryRows);
    ws1['!cols'] = [{ wch: 35 }, { wch: 20 }];
    // Style header
    ws1['A1'] = { v: 'CareWeave eRx — Annual Report', t: 's' };
    XLSX.utils.book_append_sheet(wb, ws1, 'Summary');

    // ── Sheet 2: Daily / Monthly Stats ────────────────────────────
    const statsHeader = ['Date', 'Prescriptions Created', 'Dispensed'];
    const statsRows = (period === 'yearly' ? yearlyData : chartData).map(d => [
      d.date, d.Created, d.Dispensed
    ]);
    const ws2 = XLSX.utils.aoa_to_sheet([statsHeader, ...statsRows]);
    ws2['!cols'] = [{ wch: 15 }, { wch: 25 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(wb, ws2, period === 'yearly' ? 'Monthly Breakdown' : 'Daily Breakdown');

    // ── Sheet 3: Prescriptions by Status ──────────────────────────
    const statusHeader = ['Status', 'Count'];
    const statusRows = (data.prescriptionsByStatus || []).map(s => [s.status, parseInt(s.count)]);
    const ws3 = XLSX.utils.aoa_to_sheet([statusHeader, ...statusRows]);
    ws3['!cols'] = [{ wch: 20 }, { wch: 10 }];
    XLSX.utils.book_append_sheet(wb, ws3, 'Status Breakdown');

    // ── Sheet 4: Top Doctors ───────────────────────────────────────
    const docHeader = ['Rank', 'Doctor Name', 'SLMC Number', 'Prescriptions'];
    const docRows = (data.topDoctors || []).map((d, i) => [
      i + 1, d.full_name, d.slmc_number, parseInt(d.prescriptions_count)
    ]);
    const ws4 = XLSX.utils.aoa_to_sheet([docHeader, ...docRows]);
    ws4['!cols'] = [{ wch: 6 }, { wch: 30 }, { wch: 20 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(wb, ws4, 'Top Doctors');

    // ── Sheet 5: Top Pharmacies ────────────────────────────────────
    const pharHeader = ['Rank', 'Pharmacy Name', 'Dispensed Count'];
    const pharRows = (data.topPharmacies || []).map((p, i) => [
      i + 1, p.pharmacy_name, parseInt(p.dispensed_count)
    ]);
    const ws5 = XLSX.utils.aoa_to_sheet([pharHeader, ...pharRows]);
    ws5['!cols'] = [{ wch: 6 }, { wch: 35 }, { wch: 18 }];
    XLSX.utils.book_append_sheet(wb, ws5, 'Top Pharmacies');

    XLSX.writeFile(wb, `CareWeave_eRx_Report_${periodLabel}.xlsx`);
    toast.success('Excel report downloaded!');
  };
  const years = [2024, 2025, 2026, 2027];

  const totalCreated = data?.dailyStats?.reduce((a, d) => a + parseInt(d.created), 0) || 0;
  const totalDispensed = data?.dailyStats?.reduce((a, d) => a + parseInt(d.dispensed), 0) || 0;
  const dispensingRate = totalCreated > 0 ? Math.round((totalDispensed / totalCreated) * 100) : 0;

  // Format daily stats for chart
  const chartData = data?.dailyStats?.map(d => ({
    date: period === 'yearly'
      ? months[new Date(d.date).getMonth()]
      : new Date(d.date).getDate() + ' ' + months[new Date(d.date).getMonth()],
    Created: parseInt(d.created),
    Dispensed: parseInt(d.dispensed),
  })) || [];

  // Aggregate by month for yearly view
  const yearlyData = period === 'yearly' ? months.map((m, i) => {
    const monthData = data?.dailyStats?.filter(d => new Date(d.date).getMonth() === i) || [];
    return {
      date: m,
      Created: monthData.reduce((a, d) => a + parseInt(d.created), 0),
      Dispensed: monthData.reduce((a, d) => a + parseInt(d.dispensed), 0),
    };
  }) : chartData;

  const pieData = data?.prescriptionsByStatus?.map(s => ({
    name: s.status,
    value: parseInt(s.count),
  })) || [];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-500 text-sm">Prescription statistics and trends</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Export button */}
          <button
            onClick={exportExcel}
            disabled={loading || !data}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" />
            Export Excel
          </button>

        {/* Period controls */}
        <div className="flex items-center gap-3">
          <div className="flex bg-gray-100 rounded-lg p-1">
            {['weekly', 'monthly', 'yearly'].map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors capitalize ${
                  period === p ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}>
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
              {months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
          )}
        </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400">Loading analytics...</div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Total prescriptions', value: totalCreated, icon: FileText, color: 'text-blue-500', bg: 'bg-blue-50' },
              { label: 'Dispensed', value: totalDispensed, icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50' },
              { label: 'Dispensing rate', value: `${dispensingRate}%`, icon: TrendingUp, color: 'text-brand-500', bg: 'bg-brand-50' },
              { label: 'Active doctors', value: data?.topDoctors?.length || 0, icon: Users, color: 'text-purple-500', bg: 'bg-purple-50' },
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

          {/* Line chart */}
          <div className="card p-6 mb-6">
            <h2 className="font-semibold mb-4">
              Prescriptions {period === 'yearly' ? `— ${year}` : period === 'monthly' ? `— ${months[month-1]} ${year}` : '— Last 7 days'}
            </h2>
            {yearlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={yearlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Created" fill="#3b82f6" radius={[4,4,0,0]} />
                  <Bar dataKey="Dispensed" fill="#059669" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-40 flex items-center justify-center text-gray-400">No data for this period</div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
            {/* Status pie chart */}
            <div className="card p-6">
              <h2 className="font-semibold mb-4">Prescriptions by status</h2>
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                      {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-40 flex items-center justify-center text-gray-400">No data</div>
              )}
            </div>

            {/* Top doctors */}
            <div className="card p-6">
              <h2 className="font-semibold mb-4">Top doctors</h2>
              {data?.topDoctors?.length > 0 ? (
                <div className="space-y-3">
                  {data.topDoctors.slice(0, 6).map((doc, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 text-xs flex items-center justify-center font-medium">
                          {i + 1}
                        </div>
                        <div>
                          <p className="text-sm font-medium">Dr. {doc.full_name}</p>
                          <p className="text-xs text-gray-400">{doc.slmc_number}</p>
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-brand-600">{doc.prescriptions_count} Rx</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-40 flex items-center justify-center text-gray-400">No data</div>
              )}
            </div>
          </div>

          {/* Top pharmacies */}
          <div className="card p-6">
            <h2 className="font-semibold mb-4">Top pharmacies by dispensing</h2>
            {data?.topPharmacies?.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={data.topPharmacies.slice(0, 8)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" tick={{ fontSize: 12 }} allowDecimals={false} />
                  <YAxis type="category" dataKey="pharmacy_name" tick={{ fontSize: 11 }} width={120} />
                  <Tooltip />
                  <Bar dataKey="dispensed_count" fill="#059669" radius={[0,4,4,0]} name="Dispensed" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-24 flex items-center justify-center text-gray-400">No data</div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

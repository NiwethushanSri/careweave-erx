import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';
import { ArrowLeft, Download, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/* ── Build PDF DOM with pure inline styles (no Tailwind) ─────────────────── */
function buildSummaryDOM({ user, prescriptions, dispensed, medicines, diseases, doctors }) {
  const card = `background:#f9fafb;border-radius:12px;padding:14px;margin-bottom:12px;`;
  const lbl  = `font-size:10px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;`;

  const doctorRows = doctors.map((d, i) => `
    <div style="border:1px solid #e5e7eb;border-radius:10px;padding:12px;margin-bottom:8px;background:${i%2===0?'#fff':'#f9fafb'};display:flex;justify-content:space-between;">
      <div>
        <div style="font-weight:700;font-size:13px;">Dr. ${d.name}</div>
        <div style="font-size:11px;color:#6b7280;">${d.spec||'General'} · ${d.slmc}</div>
      </div>
      <div style="text-align:right;">
        <div style="font-size:12px;font-weight:700;color:#059669;">${d.visits} visit${d.visits!==1?'s':''}</div>
        <div style="font-size:10px;color:#9ca3af;">${format(new Date(d.last),'dd MMM yyyy')}</div>
      </div>
    </div>`).join('');

  const diseaseRows = diseases.map((d, i) => `
    <div style="border:1px solid #e5e7eb;border-radius:10px;padding:12px;margin-bottom:8px;background:${i%2===0?'#fff':'#f9fafb'};">
      <div style="display:flex;justify-content:space-between;">
        <div style="font-weight:700;font-size:13px;">${d.disease}</div>
        <span style="font-size:11px;color:#3b82f6;font-weight:700;">${d.count}×</span>
      </div>
      <div style="font-size:11px;color:#6b7280;margin-top:3px;">Meds: ${d.meds.join(', ')}</div>
    </div>`).join('');

  const medicineRows = medicines.map((m, i) => `
    <div style="border:1px solid #e5e7eb;border-radius:10px;padding:12px;margin-bottom:8px;background:${i%2===0?'#fff':'#f9fafb'};display:flex;justify-content:space-between;">
      <div>
        <div style="font-weight:700;font-size:13px;">${m.name}</div>
        <div style="font-size:11px;color:#6b7280;">Dosage: ${m.dosage}</div>
      </div>
      <div style="text-align:right;">
        <div style="font-size:12px;font-weight:700;color:#8b5cf6;">${m.count}× prescribed</div>
        <div style="font-size:10px;color:#9ca3af;">${m.dates[m.dates.length-1]}</div>
      </div>
    </div>`).join('');

  const rxRows = prescriptions.map((p, i) => `
    <div style="border:1px solid #e5e7eb;border-radius:10px;padding:12px;margin-bottom:8px;background:${i%2===0?'#fff':'#f9fafb'};">
      <div style="display:flex;justify-content:space-between;">
        <div style="font-family:monospace;font-size:11px;font-weight:700;color:#059669;">${p.prescription_code}</div>
        <div style="font-size:10px;color:#9ca3af;">${format(new Date(p.created_at),'dd MMM yyyy')}</div>
      </div>
      <div style="font-size:13px;font-weight:600;margin-top:2px;">Dr. ${p.doctor_name}</div>
      <div style="display:flex;justify-content:space-between;margin-top:2px;">
        <div style="font-size:11px;color:#6b7280;">${p.diagnosis||'—'}</div>
        <div style="font-size:11px;color:#4b5563;font-weight:600;text-transform:capitalize;">${p.status}</div>
      </div>
    </div>`).join('');

  const html = `
    <div style="font-family:Arial,sans-serif;background:#fff;padding:24px;width:400px;box-sizing:border-box;">

      <!-- Header -->
      <div style="border-bottom:2px solid #059669;padding-bottom:14px;margin-bottom:16px;display:flex;justify-content:space-between;align-items:flex-start;">
        <div>
          <div style="font-size:18px;font-weight:700;color:#059669;">Patient Health Summary</div>
          <div style="font-size:10px;color:#6b7280;margin-top:2px;">CareWeave eRx · Ministry of Health Sri Lanka</div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:9px;color:#9ca3af;">Generated on</div>
          <div style="font-size:11px;font-weight:700;">${format(new Date(),'dd MMM yyyy')}</div>
        </div>
      </div>

      <!-- Patient info -->
      <div style="${card}">
        <div style="${lbl}">Patient Information</div>
        <div style="font-size:12px;margin-bottom:3px;"><span style="color:#6b7280;">Name: </span><strong>${user?.full_name||'—'}</strong></div>
        <div style="font-size:12px;margin-bottom:3px;"><span style="color:#6b7280;">NIC: </span>${user?.nic||'—'}</div>
        <div style="font-size:12px;margin-bottom:3px;"><span style="color:#6b7280;">Mobile: </span>${user?.mobile||'—'}</div>
        <div style="font-size:12px;"><span style="color:#6b7280;">Email: </span>${user?.email||'—'}</div>
      </div>

      <!-- Stats -->
      <div style="display:flex;gap:8px;margin-bottom:12px;">
        <div style="flex:1;border:1px solid #e5e7eb;border-radius:10px;padding:10px 8px;text-align:center;">
          <div style="font-size:22px;font-weight:800;color:#059669;">${prescriptions.length}</div>
          <div style="font-size:9px;color:#6b7280;margin-top:2px;">Prescriptions</div>
        </div>
        <div style="flex:1;border:1px solid #e5e7eb;border-radius:10px;padding:10px 8px;text-align:center;">
          <div style="font-size:22px;font-weight:800;color:#3b82f6;">${dispensed.length}</div>
          <div style="font-size:9px;color:#6b7280;margin-top:2px;">Dispensed</div>
        </div>
        <div style="flex:1;border:1px solid #e5e7eb;border-radius:10px;padding:10px 8px;text-align:center;">
          <div style="font-size:22px;font-weight:800;color:#8b5cf6;">${doctors.length}</div>
          <div style="font-size:9px;color:#6b7280;margin-top:2px;">Doctors</div>
        </div>
      </div>

      ${doctors.length > 0 ? `
      <div style="margin-bottom:12px;">
        <div style="${lbl}">Doctors Visited</div>
        ${doctorRows}
      </div>` : ''}

      ${diseases.length > 0 ? `
      <div style="margin-bottom:12px;">
        <div style="${lbl}">Diagnosis History</div>
        ${diseaseRows}
      </div>` : ''}

      ${medicines.length > 0 ? `
      <div style="margin-bottom:12px;">
        <div style="${lbl}">Medicine History</div>
        ${medicineRows}
      </div>` : ''}

      <div style="margin-bottom:12px;">
        <div style="${lbl}">Prescription History</div>
        ${rxRows}
      </div>

      <!-- Footer -->
      <div style="border-top:1px solid #e5e7eb;padding-top:12px;text-align:center;margin-top:8px;">
        <div style="font-size:10px;color:#9ca3af;">Official health summary · CareWeave eRx</div>
        <div style="font-size:10px;color:#9ca3af;margin-top:2px;">Ministry of Health Sri Lanka · Niwethushan · Forge9x</div>
      </div>
    </div>`;

  const wrapper = document.createElement('div');
  wrapper.style.cssText = 'position:fixed;top:0;left:0;z-index:-9999;pointer-events:none;';
  wrapper.innerHTML = html;
  return wrapper;
}

/* ─── Main page ─────────────────────────────────────────────────────────── */
export default function PatientSummaryPDF() {
  const { user } = useAuth();
  const navigate  = useNavigate();
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [generating, setGenerating] = useState(false);

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

  const handleDownload = async () => {
    setGenerating(true);
    try {
      const node = buildSummaryDOM({ user, prescriptions, dispensed, medicines, diseases, doctors });
      document.body.appendChild(node);
      await new Promise(r => setTimeout(r, 300));

      const el = node.firstElementChild;
      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
      });

      document.body.removeChild(node);

      const pxW = canvas.width  / 2;
      const pxH = canvas.height / 2;
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: [pxW, pxH] });
      pdf.addImage(canvas.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, pxW, pxH);
      pdf.save(`CareWeave_Health_Summary_${user?.full_name?.replace(/\s+/g, '_')}.pdf`);
      toast.success('Health summary downloaded!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate PDF');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 shadow-sm">
        <button onClick={() => navigate('/patient')}
          className="flex items-center gap-1.5 text-gray-500 hover:text-gray-800 text-sm font-medium">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <p className="flex-1 text-center text-sm font-semibold text-gray-700">Health Summary</p>
        <button onClick={handleDownload} disabled={generating}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-60
                     text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors shadow-sm shrink-0">
          {generating
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</>
            : <><Download className="w-4 h-4" /> Download PDF</>}
        </button>
      </div>

      {/* ── Mobile preview ── */}
      <div className="max-w-2xl mx-auto py-5 px-4 space-y-4">
        <div className="bg-white rounded-2xl shadow-sm p-4 border-l-4 border-green-600">
          <h1 className="text-lg font-bold text-green-700">Patient Health Summary</h1>
          <p className="text-xs text-gray-400">CareWeave eRx · {format(new Date(), 'dd MMM yyyy')}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-4">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Patient Information</p>
          <div className="grid grid-cols-2 gap-y-2 text-sm">
            <div><span className="text-gray-400 text-xs">Name</span><p className="font-semibold">{user?.full_name}</p></div>
            <div><span className="text-gray-400 text-xs">NIC</span><p className="font-semibold">{user?.nic}</p></div>
            <div><span className="text-gray-400 text-xs">Mobile</span><p>{user?.mobile||'—'}</p></div>
            <div><span className="text-gray-400 text-xs">Email</span><p className="truncate">{user?.email||'—'}</p></div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Prescriptions', value: prescriptions.length, color: 'text-green-700' },
            { label: 'Dispensed',     value: dispensed.length,     color: 'text-blue-600' },
            { label: 'Doctors',       value: doctors.length,       color: 'text-purple-600' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl shadow-sm p-3 text-center">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {doctors.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Doctors Visited</p>
            <div className="space-y-2">
              {doctors.map((d, i) => (
                <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded-xl">
                  <div><p className="text-sm font-semibold">Dr. {d.name}</p><p className="text-xs text-gray-400">{d.spec||'General'} · {d.slmc}</p></div>
                  <div className="text-right"><p className="text-xs font-bold text-green-700">{d.visits} visit{d.visits!==1?'s':''}</p><p className="text-xs text-gray-400">{format(new Date(d.last),'dd MMM yyyy')}</p></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {diseases.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Diagnosis History</p>
            <div className="space-y-2">
              {diseases.map((d, i) => (
                <div key={i} className="p-2 bg-gray-50 rounded-xl">
                  <div className="flex justify-between"><p className="text-sm font-semibold">{d.disease}</p><span className="text-xs text-blue-600 font-bold">{d.count}×</span></div>
                  <p className="text-xs text-gray-400 mt-0.5">Medicines: {d.meds.join(', ')}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {medicines.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Medicine History</p>
            <div className="space-y-2">
              {medicines.map((m, i) => (
                <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded-xl">
                  <div><p className="text-sm font-semibold">{m.name}</p><p className="text-xs text-gray-400">Dosage: {m.dosage}</p></div>
                  <div className="text-right"><p className="text-xs font-bold text-purple-600">{m.count}× prescribed</p><p className="text-xs text-gray-400">{m.dates[m.dates.length-1]}</p></div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm p-4">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Prescription History</p>
          <div className="space-y-2">
            {prescriptions.map((p, i) => (
              <div key={i} className="p-2 bg-gray-50 rounded-xl">
                <div className="flex justify-between items-start">
                  <p className="font-mono text-xs text-green-700 font-bold">{p.prescription_code}</p>
                  <p className="text-xs text-gray-400">{format(new Date(p.created_at),'dd MMM yyyy')}</p>
                </div>
                <p className="text-sm font-medium mt-0.5">Dr. {p.doctor_name}</p>
                <div className="flex justify-between mt-0.5">
                  <p className="text-xs text-gray-500">{p.diagnosis||'—'}</p>
                  <span className="text-xs capitalize text-gray-600 font-medium">{p.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 pb-4">
          Official health summary · CareWeave eRx · Ministry of Health Sri Lanka
        </p>
      </div>
    </div>
  );
}

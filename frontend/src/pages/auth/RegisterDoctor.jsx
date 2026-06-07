import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import SRI_LANKA_HOSPITALS from '../../data/sriLankaHospitals';

function HospitalDropdown({ value, onChange }) {
  const [search, setSearch] = useState(value || '');
  const [open, setOpen] = useState(false);
  const [filtered, setFiltered] = useState([]);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (!search.trim()) { setFiltered([]); return; }
    const q = search.toLowerCase();
    setFiltered(
      SRI_LANKA_HOSPITALS.filter(h =>
        h.name.toLowerCase().includes(q) ||
        h.city.toLowerCase().includes(q) ||
        h.district.toLowerCase().includes(q) ||
        h.province.toLowerCase().includes(q)
      ).slice(0, 8)
    );
  }, [search]);

  const select = (hospital) => {
    setSearch(hospital.name);
    onChange(hospital.name, hospital.city);
    setOpen(false);
  };

  const handleInput = (e) => {
    setSearch(e.target.value);
    onChange(e.target.value, '');
    setOpen(true);
  };

  const typeBadgeColor = (type) => {
    switch (type) {
      case 'Teaching': return 'bg-blue-100 text-blue-700';
      case 'Specialized': return 'bg-purple-100 text-purple-700';
      case 'Private': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className="relative" ref={ref}>
      <input
        className="input"
        placeholder="Search hospital or clinic..."
        value={search}
        onChange={handleInput}
        onFocus={() => search && setOpen(true)}
        autoComplete="off"
      />
      {open && filtered.length > 0 && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {filtered.map((h, i) => (
            <button
              key={i}
              type="button"
              className="w-full text-left px-3 py-2.5 hover:bg-brand-50 border-b border-gray-50 last:border-0 transition-colors"
              onClick={() => select(h)}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-gray-800 truncate">{h.name}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded font-medium shrink-0 ${typeBadgeColor(h.type)}`}>
                  {h.type}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">{h.city}, {h.district} — {h.province}</p>
            </button>
          ))}
        </div>
      )}
      {open && search.length > 1 && filtered.length === 0 && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-md px-3 py-2.5">
          <p className="text-sm text-gray-400">No hospital found — you can type a custom name</p>
        </div>
      )}
    </div>
  );
}

export default function RegisterDoctor() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    full_name: '', nic: '', email: '', mobile: '', password: '',
    slmc_number: '', specialisation: '', clinic_name: '', clinic_address: '', qualification: ''
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/register/doctor', form);
      toast.success('Registration submitted! Awaiting admin approval.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-6">
          <img src="/logo.png" alt="CareWeave eRx" className="h-12 mx-auto mb-3" />
          <h1 className="text-2xl font-bold text-gray-900">Doctor Registration</h1>
          <p className="text-gray-500 text-sm mt-1">Register as a licensed doctor on <span className="font-semibold text-brand-600">CareWeave eRx</span></p>
        </div>

        <div className="card p-5 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">Personal Details</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Full name *</label>
                <input className="input" placeholder="Dr. John Silva" value={form.full_name} onChange={e => set('full_name', e.target.value)} required />
              </div>
              <div>
                <label className="label">NIC number *</label>
                <input className="input" placeholder="199512345678" value={form.nic} onChange={e => set('nic', e.target.value)} required />
              </div>
              <div>
                <label className="label">Mobile *</label>
                <input className="input" placeholder="0771234567" value={form.mobile} onChange={e => set('mobile', e.target.value)} required />
              </div>
              <div>
                <label className="label">Email</label>
                <input className="input" type="email" placeholder="doctor@email.com" value={form.email} onChange={e => set('email', e.target.value)} />
              </div>
            </div>
            <div>
              <label className="label">Password *</label>
              <input className="input" type="password" placeholder="Min 8 characters" value={form.password} onChange={e => set('password', e.target.value)} required minLength={8} />
            </div>

            <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wide pt-2">Medical Details</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">SLMC number *</label>
                <input className="input" placeholder="SLMC/2020/12345" value={form.slmc_number} onChange={e => set('slmc_number', e.target.value)} required />
              </div>
              <div>
                <label className="label">Specialisation</label>
                <select className="input" value={form.specialisation} onChange={e => set('specialisation', e.target.value)}>
                  <option value="">General Practitioner</option>
                  <option>Cardiology</option>
                  <option>Dermatology</option>
                  <option>Endocrinology</option>
                  <option>Gastroenterology</option>
                  <option>Neurology</option>
                  <option>Oncology</option>
                  <option>Paediatrics</option>
                  <option>Psychiatry</option>
                  <option>Surgery</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="label">Qualification</label>
                <input className="input" placeholder="MBBS, MD" value={form.qualification} onChange={e => set('qualification', e.target.value)} />
              </div>
            </div>

            <div>
              <label className="label">Clinic / Hospital</label>
              <HospitalDropdown
                value={form.clinic_name}
                onChange={(name, city) => {
                  set('clinic_name', name);
                  if (city && !form.clinic_address) set('clinic_address', city);
                }}
              />
              <p className="text-xs text-gray-400 mt-1">Search from Sri Lanka hospitals or type a custom name</p>
            </div>

            <div>
              <label className="label">Clinic address</label>
              <input className="input" placeholder="123 Main St, Colombo" value={form.clinic_address} onChange={e => set('clinic_address', e.target.value)} />
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 mt-2">
              {loading ? 'Submitting...' : 'Submit Registration'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-4">
            Already registered? <Link to="/login" className="text-brand-600 hover:underline">Sign in</Link>
          </p>
        </div>
        <p className="text-center text-xs text-gray-400 mt-4">Your registration will be reviewed and approved by the admin.</p>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { MapPin } from 'lucide-react';

const SL_DISTRICTS = [
  'Colombo','Gampaha','Kalutara',
  'Kandy','Matale','Nuwara Eliya',
  'Galle','Matara','Hambantota',
  'Jaffna','Kilinochchi','Mannar','Mullaitivu','Vavuniya',
  'Ampara','Batticaloa','Trincomalee',
  'Kurunegala','Puttalam',
  'Anuradhapura','Polonnaruwa',
  'Badulla','Monaragala',
  'Kegalle','Ratnapura',
];

export default function RegisterPatient() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    full_name: '', nic: '', email: '', mobile: '', password: '',
    date_of_birth: '', gender: '', address: '', city: '', district: '',
    preferred_pharmacy_id: ''
  });
  const [nearbyPharmacies, setNearbyPharmacies] = useState([]);
  const [loadingPharmacies, setLoadingPharmacies] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // When district changes, fetch pharmacies in that district
  useEffect(() => {
    if (!form.district) { setNearbyPharmacies([]); set('preferred_pharmacy_id', ''); return; }
    setLoadingPharmacies(true);
    api.get(`/pharmacies?district=${encodeURIComponent(form.district)}`)
      .then(({ data }) => {
        setNearbyPharmacies(data.data || []);
        set('preferred_pharmacy_id', '');
      })
      .catch(() => setNearbyPharmacies([]))
      .finally(() => setLoadingPharmacies(false));
  }, [form.district]);

  const getAge = (dob) => {
    if (!dob) return null;
    const today = new Date();
    const birth = new Date(dob);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  const age = getAge(form.date_of_birth);
  const isMinor = age !== null && age < 15;
  const isAdult = age !== null && age >= 15;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.date_of_birth) return toast.error('Date of birth is required');
    if (isAdult && !form.nic) return toast.error('NIC is required for patients 15 years and above');
    if (!form.mobile) return toast.error('Mobile number is required');
    if (!form.district) return toast.error('Please select your district');
    if (!form.password || form.password.length < 8) return toast.error('Password must be at least 8 characters');

    setLoading(true);
    try {
      const payload = {
        ...form,
        nic: isMinor ? `DOB-${form.date_of_birth}-${form.full_name.replace(/\s+/g,'-')}` : form.nic,
        preferred_pharmacy_id: form.preferred_pharmacy_id || null,
      };
      await api.post('/auth/register/patient', payload);
      toast.success('Registration successful! You can now log in.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-white flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-lg">
          <div className="text-center mb-6">
            <img src="/logo.png" alt="CareWeave eRx" className="h-12 mx-auto mb-3" />
            <h1 className="text-2xl font-bold text-gray-900">Patient Registration</h1>
            <p className="text-gray-500 text-sm mt-1">Create your patient account on <span className="font-semibold text-brand-600">CareWeave eRx</span></p>
          </div>

          <div className="card p-8">
            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Full name */}
              <div>
                <label className="label">Full name *</label>
                <input className="input" placeholder="e.g. Mathushan Silva"
                  value={form.full_name} onChange={e => set('full_name', e.target.value)} required />
              </div>

              {/* Date of birth */}
              <div>
                <label className="label">Date of birth *</label>
                <input className="input" type="date"
                  max={new Date().toISOString().split('T')[0]}
                  value={form.date_of_birth} onChange={e => set('date_of_birth', e.target.value)} required />
                {age !== null && (
                  <p className={`text-xs mt-1 font-medium ${isMinor ? 'text-amber-600' : 'text-green-600'}`}>
                    {isMinor
                      ? `Age ${age} — NIC not required (under 15).`
                      : `Age ${age} — NIC required.`}
                  </p>
                )}
              </div>

              {/* NIC */}
              {(isAdult || age === null) && (
                <div>
                  <label className="label">
                    NIC number {isAdult ? '*' : ''}
                    <span className="text-gray-400 font-normal ml-1">(required for age 15+)</span>
                  </label>
                  <input className="input" placeholder="e.g. 200112345678"
                    value={form.nic} onChange={e => set('nic', e.target.value)}
                    required={isAdult} />
                </div>
              )}

              {isMinor && (
                <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 text-sm text-amber-700">
                  <p className="font-medium">Minor patient registration</p>
                  <p className="text-xs mt-0.5">For patients under 15, date of birth is used as the unique identifier.</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">{isMinor ? "Guardian's mobile *" : "Mobile *"}</label>
                  <input className="input" placeholder="0771234567"
                    value={form.mobile} onChange={e => set('mobile', e.target.value)} required />
                </div>
                <div>
                  <label className="label">Gender</label>
                  <select className="input" value={form.gender} onChange={e => set('gender', e.target.value)}>
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="label">Email</label>
                <input className="input" type="email" placeholder="email@example.com"
                  value={form.email} onChange={e => set('email', e.target.value)} />
              </div>

              {/* ── Location ── */}
              <div className="border-t border-gray-100 pt-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" /> Location Details
                </p>
                <div className="space-y-3">
                  <div>
                    <label className="label">District *</label>
                    <select className="input" value={form.district}
                      onChange={e => set('district', e.target.value)} required>
                      <option value="">— Select your district —</option>
                      {SL_DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="label">City / Town</label>
                    <input className="input" placeholder="e.g. Nugegoda"
                      value={form.city} onChange={e => set('city', e.target.value)} />
                  </div>

                  <div>
                    <label className="label">Full Address</label>
                    <input className="input" placeholder="123 Main St, Colombo"
                      value={form.address} onChange={e => set('address', e.target.value)} />
                  </div>
                </div>
              </div>

              {/* ── Preferred Pharmacy ── */}
              <div className="border-t border-gray-100 pt-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Preferred Pharmacy
                </p>
                {!form.district ? (
                  <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-400 text-center border border-dashed border-gray-200">
                    Select your district first to see nearby pharmacies
                  </div>
                ) : loadingPharmacies ? (
                  <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-400 text-center">
                    Loading pharmacies in {form.district}...
                  </div>
                ) : nearbyPharmacies.length === 0 ? (
                  <div className="bg-amber-50 rounded-lg p-3 text-sm text-amber-700 border border-amber-100">
                    No approved pharmacies found in {form.district} district yet.
                  </div>
                ) : (
                  <>
                    <select className="input" value={form.preferred_pharmacy_id}
                      onChange={e => set('preferred_pharmacy_id', e.target.value)}>
                      <option value="">— Select preferred pharmacy (optional) —</option>
                      {nearbyPharmacies.map(ph => (
                        <option key={ph.id} value={ph.id}>
                          {ph.pharmacy_name} — {ph.city || ph.district}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-400 mt-1">
                      {nearbyPharmacies.length} pharmacy{nearbyPharmacies.length !== 1 ? 's' : ''} found in {form.district} district
                    </p>
                  </>
                )}
              </div>

              <div className="border-t border-gray-100 pt-4">
                <label className="label">Password *</label>
                <input className="input" type="password" placeholder="Min 8 characters"
                  value={form.password} onChange={e => set('password', e.target.value)}
                  required minLength={8} />
                {isMinor && <p className="text-xs text-gray-400 mt-1">Set a password for the guardian to manage this account.</p>}
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 mt-2">
                {loading ? 'Registering...' : 'Create Account'}
              </button>
            </form>

            <p className="text-center text-sm text-gray-500 mt-4">
              Already have an account?{' '}
              <Link to="/login" className="text-brand-600 hover:underline">Sign in</Link>
            </p>
          </div>
        </div>
      </div>

      <footer className="border-t border-gray-100 bg-white">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col items-center gap-1 text-center">
          <span className="text-sm text-gray-500">CareWeave eRx — Digital Prescription Platform</span>
          <div className="text-sm text-gray-400">
            Developed by <span className="font-medium text-gray-600">Niwethushan</span>{' '}·{' '}
            <a href="https://forge9x.co.uk" target="_blank" rel="noreferrer"
              className="font-semibold text-brand-600 hover:text-brand-700">Forge9x</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

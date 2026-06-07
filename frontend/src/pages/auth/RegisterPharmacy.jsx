import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../utils/api';
import toast from 'react-hot-toast';

export default function RegisterPharmacy() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    full_name: '', nic: '', email: '', mobile: '', password: '',
    licence_number: '', pharmacy_name: '', address: '', city: '', district: ''
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/register/pharmacy', form);
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
          <h1 className="text-2xl font-bold text-gray-900">Pharmacy Registration</h1>
          <p className="text-gray-500 text-sm mt-1">Register your pharmacy on <span className="font-semibold text-brand-600">CareWeave eRx</span></p>
        </div>

        <div className="card p-5 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">Owner Details</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Owner full name *</label>
                <input className="input" placeholder="John Silva" value={form.full_name} onChange={e => set('full_name', e.target.value)} required />
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
                <input className="input" type="email" placeholder="pharmacy@email.com" value={form.email} onChange={e => set('email', e.target.value)} />
              </div>
            </div>
            <div>
              <label className="label">Password *</label>
              <input className="input" type="password" placeholder="Min 8 characters" value={form.password} onChange={e => set('password', e.target.value)} required minLength={8} />
            </div>

            <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wide pt-2">Pharmacy Details</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Pharmacy name *</label>
                <input className="input" placeholder="City Pharmacy" value={form.pharmacy_name} onChange={e => set('pharmacy_name', e.target.value)} required />
              </div>
              <div>
                <label className="label">Licence number *</label>
                <input className="input" placeholder="PH/2020/12345" value={form.licence_number} onChange={e => set('licence_number', e.target.value)} required />
              </div>
              <div>
                <label className="label">City</label>
                <input className="input" placeholder="Colombo" value={form.city} onChange={e => set('city', e.target.value)} />
              </div>
              <div>
                <label className="label">District</label>
                <input className="input" placeholder="Colombo" value={form.district} onChange={e => set('district', e.target.value)} />
              </div>
            </div>
            <div>
              <label className="label">Full address *</label>
              <input className="input" placeholder="123 Main St, Colombo 03" value={form.address} onChange={e => set('address', e.target.value)} required />
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

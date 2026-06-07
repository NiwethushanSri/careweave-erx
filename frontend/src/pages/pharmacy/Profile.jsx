import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { ArrowLeft, Building2, Save, Lock } from 'lucide-react';

const SL_DISTRICTS = [
  'Ampara','Anuradhapura','Badulla','Batticaloa','Colombo','Galle','Gampaha',
  'Hambantota','Jaffna','Kalutara','Kandy','Kegalle','Kilinochchi','Kurunegala',
  'Mannar','Matale','Matara','Monaragala','Mullaitivu','Nuwara Eliya',
  'Polonnaruwa','Puttalam','Ratnapura','Trincomalee','Vavuniya'
];

export default function PharmacyProfile() {
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    full_name: '', email: '', mobile: '',
    pharmacy_name: '', address: '', city: '', district: '',
    phone: '', operating_hours: '',
  });
  const [locked, setLocked] = useState({ nic: '', licence_number: '' });

  useEffect(() => {
    api.get('/profile/pharmacy')
      .then(({ data }) => {
        const d = data.data;
        setForm({
          full_name: d.full_name || '',
          email: d.email || '',
          mobile: d.mobile || '',
          pharmacy_name: d.pharmacy_name || '',
          address: d.address || '',
          city: d.city || '',
          district: d.district || '',
          phone: d.phone || '',
          operating_hours: d.operating_hours || '',
        });
        setLocked({ nic: d.nic || '', licence_number: d.licence_number || '' });
      })
      .catch(() => toast.error('Failed to load profile'))
      .finally(() => setLoading(false));
  }, []);

  const set = (field, val) => setForm(f => ({ ...f, [field]: val }));

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.pharmacy_name.trim()) return toast.error('Pharmacy name is required');
    if (!form.full_name.trim()) return toast.error('Owner name is required');
    setSaving(true);
    try {
      await api.patch('/profile/pharmacy', form);
      toast.success('Profile updated successfully!');
      if (setUser) setUser(u => ({ ...u, full_name: form.full_name, email: form.email, mobile: form.mobile }));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-400">Loading profile...</div>;

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto">
      <button onClick={() => navigate('/pharmacy')} className="flex items-center gap-1.5 text-gray-500 hover:text-gray-700 text-sm mb-5">
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </button>

      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center">
          <Building2 className="w-6 h-6 text-purple-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Pharmacy Profile</h1>
          <p className="text-sm text-gray-400">Update your pharmacy and owner details</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        {/* Locked fields */}
        <div className="card p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-3">
            <Lock className="w-4 h-4 text-gray-400" />
            <h2 className="font-semibold text-gray-700 text-sm">Verified Details <span className="text-xs font-normal text-gray-400 ml-1">(cannot be changed)</span></h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label">Owner NIC</label>
              <input className="input bg-gray-50 text-gray-400 cursor-not-allowed" value={locked.nic} disabled />
            </div>
            <div>
              <label className="label">NMRA Licence Number</label>
              <input className="input bg-gray-50 text-gray-400 cursor-not-allowed" value={locked.licence_number} disabled />
            </div>
          </div>
        </div>

        {/* Owner details */}
        <div className="card p-4 sm:p-5">
          <h2 className="font-semibold text-gray-800 mb-4">Owner / Contact Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="label">Owner Full Name *</label>
              <input className="input" value={form.full_name} onChange={e => set('full_name', e.target.value)}
                placeholder="Owner's full name" required />
            </div>
            <div>
              <label className="label">Email Address</label>
              <input className="input" type="email" value={form.email} onChange={e => set('email', e.target.value)}
                placeholder="pharmacy@example.com" />
            </div>
            <div>
              <label className="label">Mobile Number</label>
              <input className="input" type="tel" value={form.mobile} onChange={e => set('mobile', e.target.value)}
                placeholder="07XXXXXXXX" />
            </div>
          </div>
        </div>

        {/* Pharmacy details */}
        <div className="card p-4 sm:p-5">
          <h2 className="font-semibold text-gray-800 mb-4">Pharmacy Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="label">Pharmacy Name *</label>
              <input className="input" value={form.pharmacy_name} onChange={e => set('pharmacy_name', e.target.value)}
                placeholder="e.g. Batticaloa Central Pharmacy" required />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Address</label>
              <input className="input" value={form.address} onChange={e => set('address', e.target.value)}
                placeholder="Street address" />
            </div>
            <div>
              <label className="label">City</label>
              <input className="input" value={form.city} onChange={e => set('city', e.target.value)}
                placeholder="City" />
            </div>
            <div>
              <label className="label">District</label>
              <select className="input" value={form.district} onChange={e => set('district', e.target.value)}>
                <option value="">Select district</option>
                {SL_DISTRICTS.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Pharmacy Phone</label>
              <input className="input" type="tel" value={form.phone} onChange={e => set('phone', e.target.value)}
                placeholder="065XXXXXXX" />
            </div>
            <div>
              <label className="label">Operating Hours</label>
              <input className="input" value={form.operating_hours} onChange={e => set('operating_hours', e.target.value)}
                placeholder="e.g. Mon–Sat 8am–8pm" />
            </div>
          </div>
        </div>

        <div className="flex gap-3 pb-6">
          <button type="button" onClick={() => navigate('/pharmacy')} className="btn-secondary flex-1">
            Cancel
          </button>
          <button type="submit" disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}

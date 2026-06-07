import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { ArrowLeft, User, Save, Lock } from 'lucide-react';

const KNOWN_SPECS = [
  'General Practitioner','Cardiologist','Dermatologist','Endocrinologist',
  'Gastroenterologist','Neurologist','Oncologist','Ophthalmologist',
  'Orthopaedic Surgeon','Paediatrician','Psychiatrist','Pulmonologist',
  'Radiologist','Rheumatologist','Urologist',
];

function SpecialisationField({ value, onChange }) {
  const isOther = value && !KNOWN_SPECS.includes(value);
  const selectVal = isOther ? 'Other' : (value || '');

  return (
    <>
      <select className="input" value={selectVal}
        onChange={e => {
          if (e.target.value === 'Other') onChange('__other__');
          else onChange(e.target.value);
        }}>
        <option value="">Select specialisation</option>
        {KNOWN_SPECS.map(s => <option key={s}>{s}</option>)}
        <option value="Other">Other (type below)</option>
      </select>
      {(selectVal === 'Other' || isOther) && (
        <input className="input mt-2" placeholder="Type your specialisation..."
          value={value === '__other__' ? '' : value}
          onChange={e => onChange(e.target.value)}
          autoFocus />
      )}
    </>
  );
}

export default function DoctorProfile() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    full_name: '', email: '', mobile: '',
    specialisation: '', qualification: '', clinic_name: '',
    clinic_address: '', clinic_phone: '', experience_years: '', about: '',
  });
  const [locked, setLocked] = useState({ nic: '', slmc_number: '' });

  useEffect(() => {
    api.get('/profile/doctor')
      .then(({ data }) => {
        const d = data.data;
        setForm({
          full_name: d.full_name || '',
          email: d.email || '',
          mobile: d.mobile || '',
          specialisation: d.specialisation || '',
          qualification: d.qualification || '',
          clinic_name: d.clinic_name || '',
          clinic_address: d.clinic_address || '',
          clinic_phone: d.clinic_phone || '',
          experience_years: d.experience_years || '',
          about: d.about || '',
        });
        setLocked({ nic: d.nic || '', slmc_number: d.slmc_number || '' });
      })
      .catch(() => toast.error('Failed to load profile'))
      .finally(() => setLoading(false));
  }, []);

  const set = (field, val) => setForm(f => ({ ...f, [field]: val }));

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.full_name.trim()) return toast.error('Full name is required');
    setSaving(true);
    try {
      await api.patch('/profile/doctor', form);
      toast.success('Profile updated successfully!');
      // Refresh auth user name if changed
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
      <button onClick={() => navigate('/doctor')} className="flex items-center gap-1.5 text-gray-500 hover:text-gray-700 text-sm mb-5">
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </button>

      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-full bg-brand-50 flex items-center justify-center">
          <User className="w-6 h-6 text-brand-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">My Profile</h1>
          <p className="text-sm text-gray-400">Update your personal and clinic details</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        {/* Locked fields — read only */}
        <div className="card p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-3">
            <Lock className="w-4 h-4 text-gray-400" />
            <h2 className="font-semibold text-gray-700 text-sm">Verified Details <span className="text-xs font-normal text-gray-400 ml-1">(cannot be changed)</span></h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label">NIC Number</label>
              <input className="input bg-gray-50 text-gray-400 cursor-not-allowed" value={locked.nic} disabled />
            </div>
            <div>
              <label className="label">SLMC Licence Number</label>
              <input className="input bg-gray-50 text-gray-400 cursor-not-allowed" value={locked.slmc_number} disabled />
            </div>
          </div>
        </div>

        {/* Personal details */}
        <div className="card p-4 sm:p-5">
          <h2 className="font-semibold text-gray-800 mb-4">Personal Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="label">Full Name *</label>
              <input className="input" value={form.full_name} onChange={e => set('full_name', e.target.value)}
                placeholder="Dr. Your Full Name" required />
            </div>
            <div>
              <label className="label">Email Address</label>
              <input className="input" type="email" value={form.email} onChange={e => set('email', e.target.value)}
                placeholder="doctor@example.com" />
            </div>
            <div>
              <label className="label">Mobile Number</label>
              <input className="input" type="tel" value={form.mobile} onChange={e => set('mobile', e.target.value)}
                placeholder="07XXXXXXXX" />
            </div>
          </div>
        </div>

        {/* Professional details */}
        <div className="card p-4 sm:p-5">
          <h2 className="font-semibold text-gray-800 mb-4">Professional Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Specialisation</label>
              <SpecialisationField value={form.specialisation} onChange={v => set('specialisation', v)} />
            <div>
              <label className="label">Qualification</label>
              <input className="input" value={form.qualification} onChange={e => set('qualification', e.target.value)}
                placeholder="e.g. MBBS, MD, MS" />
            </div>
            <div>
              <label className="label">Years of Experience</label>
              <input className="input" type="number" min="0" max="60" value={form.experience_years}
                onChange={e => set('experience_years', e.target.value)} placeholder="e.g. 10" />
            </div>
          </div>
          <div className="mt-4">
            <label className="label">About / Bio</label>
            <textarea className="input" rows={3} value={form.about} onChange={e => set('about', e.target.value)}
              placeholder="Brief description about your practice..." />
          </div>
        </div>

        {/* Clinic details */}
        <div className="card p-4 sm:p-5">
          <h2 className="font-semibold text-gray-800 mb-4">Clinic / Hospital Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="label">Clinic / Hospital Name</label>
              <input className="input" value={form.clinic_name} onChange={e => set('clinic_name', e.target.value)}
                placeholder="e.g. Colombo National Hospital" />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Clinic Address</label>
              <input className="input" value={form.clinic_address} onChange={e => set('clinic_address', e.target.value)}
                placeholder="Full address" />
            </div>
            <div>
              <label className="label">Clinic Phone</label>
              <input className="input" type="tel" value={form.clinic_phone} onChange={e => set('clinic_phone', e.target.value)}
                placeholder="011XXXXXXX" />
            </div>
          </div>
        </div>

        <div className="flex gap-3 pb-6">
          <button type="button" onClick={() => navigate('/doctor')} className="btn-secondary flex-1">
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

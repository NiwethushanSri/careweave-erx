import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Stethoscope, Building2, Shield } from 'lucide-react';
import { useState } from 'react';

const guides = {
  patient: {
    icon: User,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    title: 'Patient Guide',
    steps: [
      { title: 'Register', desc: 'Click "Register as Patient" on the login page. Fill in your NIC, date of birth, mobile number, district, and preferred pharmacy. Patients are approved instantly.' },
      { title: 'Login', desc: 'Use your NIC, mobile number, or email along with your password to sign in.' },
      { title: 'View Prescriptions', desc: 'Your dashboard shows all prescriptions from your doctors. Track status: Created → Sent → Received → Dispensed.' },
      { title: 'Track Prescription', desc: 'Click "Track Prescription" tab and enter your prescription code to see real-time status.' },
      { title: 'Set Preferred Pharmacy', desc: 'Go to the Pharmacy tab in your dashboard and click "Set as Preferred" next to your preferred pharmacy.' },
      { title: 'Download Health Summary', desc: 'Click "Health Summary PDF" button to download your full medical history including prescriptions, medicines, and doctors visited.' },
      { title: 'Notifications', desc: 'Check the Alerts tab for notifications when your prescription is sent, received, or dispensed.' },
    ]
  },
  doctor: {
    icon: Stethoscope,
    color: 'text-green-600',
    bg: 'bg-green-50',
    border: 'border-green-200',
    title: 'Doctor Guide',
    steps: [
      { title: 'Register', desc: 'Click "Register as Doctor". You need your SLMC number, specialisation, and clinic details. Your account is reviewed by admin before activation.' },
      { title: 'Login', desc: 'After admin approval, login with your NIC or email and password.' },
      { title: 'Create Prescription', desc: 'Click "+ New Prescription" from your dashboard. Search for the patient by NIC number.' },
      { title: 'Search Patient', desc: 'Enter the patient\'s NIC number to find them. Their district and preferred pharmacy will auto-fill.' },
      { title: 'Add Medicines', desc: 'Add medicines with name, dosage, frequency, duration, and instructions. Add as many as needed.' },
      { title: 'Select Pharmacy', desc: 'Pharmacies near the patient\'s district are shown automatically. The patient\'s preferred pharmacy is marked with a star ⭐.' },
      { title: 'Send Prescription', desc: 'Once created, open the prescription and click "Send to Pharmacy". The pharmacy will receive it instantly.' },
      { title: 'Track Status', desc: 'Monitor prescriptions from your dashboard: Sent → Received → Dispensed.' },
    ]
  },
  pharmacy: {
    icon: Building2,
    color: 'text-purple-600',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    title: 'Pharmacy Guide',
    steps: [
      { title: 'Register', desc: 'Click "Register as Pharmacy". Provide your NMRA licence number, pharmacy name, address, and district. Account requires admin approval.' },
      { title: 'Login', desc: 'After admin approval, login with the owner\'s NIC or email and password.' },
      { title: 'View Incoming Prescriptions', desc: 'Your dashboard shows all prescriptions sent to your pharmacy. Filter by Awaiting, Received, or Dispensed.' },
      { title: 'Mark as Received', desc: 'When a patient arrives, click "Receive" on the prescription to confirm you have received it.' },
      { title: 'Dispense Medicines', desc: 'After giving medicines to the patient, click "Dispense". The patient gets notified automatically.' },
      { title: 'Create Invoice', desc: 'After dispensing, open the prescription and click "Create Invoice". Enter unit prices for each medicine and print.' },
      { title: 'View Analytics', desc: 'Click "Analytics" in the menu to see weekly/monthly reports, top medicines, and prescription trends.' },
    ]
  },
  admin: {
    icon: Shield,
    color: 'text-red-600',
    bg: 'bg-red-50',
    border: 'border-red-200',
    title: 'Admin Guide',
    steps: [
      { title: 'Login', desc: 'Login with admin credentials provided by the system developer.' },
      { title: 'Approve Doctors', desc: 'Go to Dashboard → Pending Approvals. Review doctor SLMC numbers and approve or reject applications.' },
      { title: 'Approve Pharmacies', desc: 'Review pharmacy NMRA licence numbers and approve or reject applications.' },
      { title: 'Monitor System', desc: 'The admin dashboard shows total users, prescriptions, active doctors, and pharmacies.' },
      { title: 'View Audit Logs', desc: 'All actions on the platform are logged. Go to Audit Logs to track all system activities.' },
      { title: 'View Reports', desc: 'Access Analytics for system-wide reports including prescription volume, top medicines, and user growth.' },
    ]
  }
};

export default function UserGuide() {
  const navigate = useNavigate();
  const [active, setActive] = useState('patient');
  const guide = guides[active];
  const Icon = guide.icon;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <img src="/logo.png" alt="CareWeave eRx" className="h-7 object-contain" />
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">User Guide</h1>
        <p className="text-sm text-gray-400 mb-6">How to use CareWeave eRx — Digital Prescription Platform</p>

        {/* Role selector */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-8">
          {Object.entries(guides).map(([key, g]) => {
            const I = g.icon;
            return (
              <button key={key} onClick={() => setActive(key)}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-sm font-medium ${
                  active === key ? `${g.border} ${g.bg} ${g.color}` : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                }`}>
                <I className="w-5 h-5" />
                {g.title.replace(' Guide', '')}
              </button>
            );
          })}
        </div>

        {/* Steps */}
        <div className={`rounded-xl border-2 ${guide.border} overflow-hidden`}>
          <div className={`${guide.bg} px-4 py-3 flex items-center gap-2`}>
            <Icon className={`w-5 h-5 ${guide.color}`} />
            <h2 className={`font-semibold ${guide.color}`}>{guide.title}</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {guide.steps.map((step, i) => (
              <div key={i} className="p-4 flex gap-4 bg-white">
                <div className={`w-7 h-7 rounded-full ${guide.bg} ${guide.color} flex items-center justify-center text-sm font-bold shrink-0`}>
                  {i + 1}
                </div>
                <div>
                  <p className="font-semibold text-sm text-gray-800">{step.title}</p>
                  <p className="text-sm text-gray-500 mt-0.5 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 text-center text-xs text-gray-400">
          <p>Need more help? Contact us at support@careweave.lk</p>
          <p className="mt-1">CareWeave eRx · Ministry of Health Sri Lanka · Developed by Niwethushan · Forge9x</p>
        </div>
      </div>
    </div>
  );
}

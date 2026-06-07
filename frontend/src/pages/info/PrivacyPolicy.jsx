import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPolicy() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <img src="/logo.png" alt="CareWeave eRx" className="h-7 object-contain" />
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Privacy Policy</h1>
        <p className="text-sm text-gray-400 mb-8">Last updated: June 2026 · CareWeave eRx</p>

        {[
          {
            title: '1. Information We Collect',
            content: `We collect the following information when you register and use CareWeave eRx:\n• Personal: Full name, NIC number, date of birth, mobile number, email address\n• Medical: Prescriptions, diagnosis, medicines, doctor visits\n• Technical: IP address, browser type, device information, login timestamps`
          },
          {
            title: '2. How We Use Your Information',
            content: `• To create and manage your digital prescriptions\n• To connect patients with licensed doctors and pharmacies\n• To send notifications about your prescription status\n• To generate health summaries for patients\n• To maintain audit logs for regulatory compliance`
          },
          {
            title: '3. Data Sharing',
            content: `Your data is only shared with:\n• Your treating doctor (when you are their patient)\n• The pharmacy receiving your prescription\n• System administrators for approval and compliance purposes\n\nWe do NOT sell, rent, or share your personal data with third-party advertisers or marketers.`
          },
          {
            title: '4. Data Security',
            content: `• All data is encrypted using industry-standard encryption (TLS/SSL)\n• Passwords are hashed using bcrypt (12 rounds)\n• JWT tokens are used for secure authentication\n• All actions are recorded in an audit log\n• Database access is restricted to authorised services only`
          },
          {
            title: '5. Data Retention',
            content: `Patient health records and prescription history are retained for a minimum of 7 years as required by Sri Lanka Ministry of Health regulations. You may request deletion of non-medical account data by contacting support.`
          },
          {
            title: '6. Your Rights',
            content: `You have the right to:\n• Access your personal data\n• Request correction of inaccurate data\n• Request deletion of your account (subject to legal retention requirements)\n• Download your health summary PDF at any time\n• Opt out of non-essential communications`
          },
          {
            title: '7. Cookies',
            content: `CareWeave eRx uses only essential session cookies for authentication purposes. We do not use tracking or advertising cookies.`
          },
          {
            title: '8. Contact Us',
            content: `For privacy-related requests:\nEmail: privacy@careweave.lk\nDeveloped by Niwethushan · Forge9x`
          },
        ].map((section, i) => (
          <div key={i} className="mb-6">
            <h2 className="text-base font-semibold text-gray-800 mb-2">{section.title}</h2>
            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{section.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function TermsAndConditions() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="CareWeave eRx" className="h-7 object-contain" />
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Terms & Conditions</h1>
        <p className="text-sm text-gray-400 mb-8">Last updated: June 2026 · CareWeave eRx</p>

        {[
          {
            title: '1. Acceptance of Terms',
            content: `By accessing and using CareWeave eRx ("the Platform"), you agree to be bound by these Terms and Conditions. If you do not agree, please do not use this platform. These terms apply to all users including patients, doctors, pharmacies, and administrators.`
          },
          {
            title: '2. Platform Overview',
            content: `CareWeave eRx is a digital prescription management platform developed for Sri Lanka, operating under the Ministry of Health Sri Lanka guidelines. The platform facilitates the creation, transmission, and dispensing of digital prescriptions between licensed medical practitioners and approved pharmacies.`
          },
          {
            title: '3. User Accounts & Registration',
            content: `• Patients may register instantly and must provide accurate NIC, date of birth, and contact information.\n• Doctors must hold a valid SLMC (Sri Lanka Medical Council) registration number. Accounts are subject to admin verification before activation.\n• Pharmacies must hold a valid NMRA (National Medicines Regulatory Authority) licence. Accounts are subject to admin verification.\n• Users are responsible for maintaining the confidentiality of their login credentials.`
          },
          {
            title: '4. Medical Disclaimer',
            content: `CareWeave eRx is a prescription management tool only. It does not provide medical advice, diagnosis, or treatment. All medical decisions must be made by a licensed medical practitioner. The platform is not responsible for any medical outcomes resulting from prescriptions issued through the system.`
          },
          {
            title: '5. Data Privacy & Confidentiality',
            content: `All patient health data is treated as strictly confidential. Data is encrypted in transit and at rest. Patient information is only accessible to the treating doctor, dispensing pharmacy, and the patient themselves. CareWeave eRx complies with Sri Lanka's data protection guidelines and does not sell or share personal health data with third parties.`
          },
          {
            title: '6. Prescription Validity',
            content: `Digital prescriptions issued through CareWeave eRx are legally equivalent to paper prescriptions when dispensed by an approved pharmacy on this platform. Each prescription carries a unique QR code for verification. Prescriptions may not be altered after creation.`
          },
          {
            title: '7. Prohibited Activities',
            content: `Users must not:\n• Provide false medical information\n• Attempt to access another user's account\n• Misuse or forge prescription codes\n• Use the platform for non-medical commercial purposes\n• Attempt to reverse-engineer or interfere with the platform's systems`
          },
          {
            title: '8. Limitation of Liability',
            content: `CareWeave eRx and its developers shall not be liable for any indirect, incidental, or consequential damages arising from the use of this platform. The platform is provided "as is" without warranties of any kind.`
          },
          {
            title: '9. Modifications',
            content: `CareWeave eRx reserves the right to modify these Terms at any time. Users will be notified of significant changes. Continued use of the platform after changes constitutes acceptance of the new terms.`
          },
          {
            title: '10. Contact',
            content: `For queries regarding these Terms, contact:\nEmail: support@careweave.lk\nDeveloped by Niwethushan · Forge9x`
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

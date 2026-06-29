import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { Eye, EyeOff, MessageCircle, X, Send, Bot } from 'lucide-react';

const FAQ = [
  // General login
  { keywords: ['login','sign in','how to login','cant login','log in'], a: 'Enter your NIC number, mobile number or email in the first field, then your password. Click Sign in.' },
  { keywords: ['forgot password','reset password','lost password','change password'], a: 'Click the "Forgot password?" link below the password field. Enter your NIC and registered mobile number to reset it.' },
  { keywords: ['nic','national identity','identity card','id number'], a: 'Your NIC is your National Identity Card number. Sri Lankan NICs are either 9 digits + V/X or 12 digits. Example: 199512345678 or 956123456V' },
  { keywords: ['account not active','pending','not approved','waiting','approval'], a: 'Doctors and pharmacies need admin approval before login. You will receive a notification once approved. Patients are approved instantly.' },
  { keywords: ['secure','privacy','data','safe'], a: 'Yes. All data is encrypted, stored securely, and only accessible by authorised users. CareWeave eRx follows strict health data privacy standards.' },

  // Patient
  { keywords: ['register patient','register as patient','patient registration','new patient'], a: 'Click "Register as Patient" below the sign in form. Fill in your full name, NIC, date of birth, mobile and password. Patients are approved instantly and can log in right away.' },
  { keywords: ['patient login','patient sign in','how patient login'], a: 'Patients log in with their NIC number or mobile number and password. Click Sign in to access the patient portal.' },
  { keywords: ['patient portal','patient dashboard','my prescriptions'], a: 'After login, the patient portal shows your prescription history, medicines taken, doctors visited, notifications and you can set your preferred pharmacy.' },
  { keywords: ['baby','child','minor','under 15','no nic','young'], a: 'For patients under 15 years old, NIC is not required. Register as a patient and enter the date of birth — this is used as the unique identifier. A guardian mobile number is required.' },
  { keywords: ['preferred pharmacy','choose pharmacy','select pharmacy'], a: 'After logging in as a patient, go to the Pharmacy tab in your dashboard and click Select next to your preferred pharmacy.' },
  { keywords: ['prescription history','my medicines','health summary'], a: 'Log in as a patient and go to your dashboard. You can view all prescriptions, medicines history, disease history and download a health summary PDF.' },

  // Doctor
  { keywords: ['register doctor','doctor registration','register as doctor','new doctor'], a: 'Click "Register as Doctor" below the sign in form. You need your SLMC licence number, specialisation and clinic details. Your account will be reviewed and approved by the admin before you can log in.' },
  { keywords: ['doctor login','doctor sign in','how doctor login'], a: 'Doctors log in with their NIC number or mobile number and password. Once approved by admin, you can access the doctor portal.' },
  { keywords: ['slmc','slmc number','licence number','doctor licence'], a: 'Your SLMC number is your Sri Lanka Medical Council registration number. Format: SLMC/YEAR/NUMBER. Example: SLMC/2020/12345. This is required for doctor registration.' },
  { keywords: ['doctor portal','doctor dashboard','create prescription'], a: 'After login, the doctor portal lets you create digital prescriptions, search patients by NIC, select medicines and send prescriptions directly to pharmacies.' },
  { keywords: ['create prescription','new prescription','write prescription'], a: 'Log in as a doctor, click "+ New Prescription", search for the patient by NIC, add medicines with dosage and instructions, then send it to the pharmacy.' },
  { keywords: ['send prescription','prescription to pharmacy'], a: 'After creating a prescription, open it and select the pharmacy from the dropdown, then click Send. The pharmacy will receive it instantly.' },

  // Pharmacy
  { keywords: ['register pharmacy','pharmacy registration','register as pharmacy','new pharmacy'], a: 'Click "Register as Pharmacy" below the sign in form. You need your pharmacy licence number, pharmacy name and address. Your account will be reviewed and approved by the admin.' },
  { keywords: ['pharmacy login','pharmacy sign in','how pharmacy login'], a: 'Pharmacies log in with the owner NIC or mobile number and password. Once approved by admin, you can access the pharmacy portal.' },
  { keywords: ['pharmacy licence','pharmacy license','pharmacy registration number'], a: 'Your pharmacy licence number is issued by the National Medicines Regulatory Authority (NMRA) of Sri Lanka. Format: PH/YEAR/NUMBER.' },
  { keywords: ['pharmacy portal','pharmacy dashboard','dispense'], a: 'After login, the pharmacy portal shows all incoming prescriptions. You can mark them as Received and then Dispense them once medicines are given.' },
  { keywords: ['receive prescription','dispense prescription','dispense medicine'], a: 'In the pharmacy portal, click Receive when you get a prescription, then click Dispense once medicines are given to the patient. The patient gets notified automatically.' },
  { keywords: ['invoice','pharmacy invoice','billing'], a: 'After dispensing, open the prescription and click "Create Invoice". Enter the unit price for each medicine and print the invoice for the patient.' },
  { keywords: ['pharmacy analytics','sales report','monthly report'], a: 'Log in as pharmacy and click Analytics in the top nav. You can view weekly, monthly and yearly reports including most dispensed medicines, top doctors and disease trends.' },

  // System
  { keywords: ['prescription','how prescription works','prescription system'], a: 'A doctor creates a digital prescription → sends to pharmacy → pharmacy receives and verifies → dispenses medicine → patient gets notified at every step. All prescriptions have a QR code for verification.' },
  { keywords: ['qr code','verify prescription','prescription qr'], a: 'Every prescription has a unique QR code. Pharmacies can scan it to verify authenticity. The QR code is also available on the PDF download.' },
  { keywords: ['pdf','download prescription','print prescription'], a: 'Open any prescription and click "Download PDF" to get a printable version with full details, medicines list and QR code.' },
  { keywords: ['notification','alert','sms','email notification'], a: 'Patients receive notifications when a prescription is created, sent, received and dispensed. Doctors and pharmacies also get alerts for incoming prescriptions.' },
  { keywords: ['admin','government portal','admin approve'], a: 'The government admin portal manages doctor and pharmacy approvals, views system analytics and audits all prescriptions. Contact your system administrator for admin access.' },
  { keywords: ['contact','support','help','problem'], a: 'For technical support, please contact the CareWeave eRx support team or your system administrator. You can also ask me any question about the platform!' },
];

const findAnswer = (text) => {
  const lower = text.toLowerCase();
  for (const item of FAQ) {
    if (item.keywords.some(k => lower.includes(k))) return item.a;
  }
  return null;
};

function ChatBot({ onClose }) {
  const [messages, setMessages] = useState([
    { from: 'bot', text: 'Hello! I am the CareWeave eRx assistant. How can I help you today? You can ask me about login, registration, or how the system works.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text) return;
    setInput('');
    setMessages(prev => [...prev, { from: 'user', text }]);
    setLoading(true);

    // Check FAQ first
    const answer = findAnswer(text);
    if (answer) {
      setTimeout(() => {
        setMessages(prev => [...prev, { from: 'bot', text: answer }]);
        setLoading(false);
      }, 600);
      return;
    }

    // Call Claude API for other questions
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 300,
          system: `You are a helpful assistant for CareWeave eRx, a digital prescription platform in Sri Lanka. 
You help users with: login issues, registration (patient/doctor/pharmacy), password reset, how the system works, and general health platform questions.
Keep answers short, clear and friendly. Do not answer questions unrelated to the platform.`,
          messages: [{ role: 'user', content: text }]
        })
      });
      const data = await response.json();
      const reply = data.content?.[0]?.text || "I'm not sure about that. Please contact support.";
      setMessages(prev => [...prev, { from: 'bot', text: reply }]);
    } catch {
      setMessages(prev => [...prev, { from: 'bot', text: "Sorry, I'm having trouble connecting. Please try again or contact support." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', bottom: '100px', right: '10px', width: 'min(340px, calc(100vw - 20px))',
      background: 'white', borderRadius: '16px', boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
      zIndex: 100, display: 'flex', flexDirection: 'column', overflow: 'hidden',
      border: '1px solid rgba(0,0,0,0.08)', maxHeight: '480px'
    }}>
      {/* Header */}
      <div style={{ background: '#059669', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Bot size={18} color="white" />
          <span style={{ color: 'white', fontWeight: '600', fontSize: '14px' }}>CareWeave Assistant</span>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'white', padding: '2px' }}>
          <X size={16} />
        </button>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px', minHeight: '200px' }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: m.from === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{
              maxWidth: '85%', padding: '8px 12px', borderRadius: m.from === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
              background: m.from === 'user' ? '#059669' : '#f3f4f6',
              color: m.from === 'user' ? 'white' : '#111827',
              fontSize: '13px', lineHeight: '1.5'
            }}>
              {m.text}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{ background: '#f3f4f6', padding: '8px 14px', borderRadius: '12px 12px 12px 2px', fontSize: '18px' }}>
              ···
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick questions */}
      <div style={{ padding: '8px 12px', borderTop: '1px solid #f0f0f0', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        {['How to login?', 'Register doctor', 'Register pharmacy', 'Register patient', 'Forgot password'].map(q => (
          <button key={q} onClick={() => { setInput(q); }}
            style={{ fontSize: '11px', padding: '3px 8px', background: '#f0fdf4', color: '#059669', border: '1px solid #bbf7d0', borderRadius: '20px', cursor: 'pointer' }}>
            {q}
          </button>
        ))}
      </div>

      {/* Input */}
      <div style={{ padding: '10px 12px', borderTop: '1px solid #f0f0f0', display: 'flex', gap: '8px' }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
          placeholder="Ask me anything..."
          style={{ flex: 1, border: '1px solid #e5e7eb', borderRadius: '8px', padding: '6px 10px', fontSize: '13px', outline: 'none' }}
        />
        <button onClick={sendMessage} disabled={loading || !input.trim()}
          style={{ background: '#059669', border: 'none', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center' }}>
          <Send size={14} />
        </button>
      </div>
    </div>
  );
}

export default function Login() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [slowWarn, setSlowWarn] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSlowWarn(false);
    // Show wake-up warning after 5 seconds (Render free tier sleeps)
    const warnTimer = setTimeout(() => setSlowWarn(true), 5000);
    try {
      const user = await login(identifier, password);
      clearTimeout(warnTimer);
      toast.success(`Welcome, ${user.full_name}`);
      const routes = { doctor: '/doctor', pharmacy: '/pharmacy', patient: '/patient', admin: '/admin' };
      navigate(routes[user.role] || '/');
    } catch (err) {
      clearTimeout(warnTimer);
      toast.error(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
      setSlowWarn(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* Background image */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'url(/bg-login.jpg)',
        backgroundSize: 'cover', backgroundPosition: 'center',
        opacity: 0.45, zIndex: 0,
      }} />

      {/* Full-screen centered content — no scroll */}
      <div style={{
        position: 'relative', zIndex: 2,
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '12px 16px 80px 16px',   /* bottom pad for footer */
        gap: '12px',
        overflow: 'hidden',
      }}>
        {/* Logo */}
        <img src="/logo.png" alt="CareWeave eRx"
          style={{ height: '58px', objectFit: 'contain', filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.18))', flexShrink: 0 }} />

        {/* Login card */}
        <div className="card w-full" style={{
          maxWidth: '380px', background: 'rgba(255,255,255,0.97)',
          backdropFilter: 'blur(8px)', padding: '20px',
        }}>
          <h2 className="font-semibold mb-4" style={{ fontSize: '16px' }}>Sign in to your account</h2>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label className="label">NIC / Mobile / Email</label>
              <input className="input" placeholder="Enter NIC, mobile number or email"
                value={identifier} onChange={e => setIdentifier(e.target.value)} required />
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input className="input pr-10" type={showPass ? 'text' : 'password'}
                  placeholder="Enter password" value={password}
                  onChange={e => setPassword(e.target.value)} required />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <div className="flex justify-end mt-1">
                <Link to="/forgot-password" className="text-xs text-brand-600 hover:underline">Forgot password?</Link>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
              {loading ? 'Signing in…' : 'Sign in'}
            </button>

            {slowWarn && (
              <div className="mt-2 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                <span className="text-amber-500 mt-0.5 text-base">⏳</span>
                <p className="text-xs text-amber-700">
                  <strong>Server is waking up</strong> — this can take up to 60 seconds on first use. Please wait, do not refresh.
                </p>
              </div>
            )}
          </form>

          <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid #f3f4f6', textAlign: 'center' }}>
            <p className="text-gray-500" style={{ fontSize: '13px', marginBottom: '6px' }}>New to CareWeave eRx?</p>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap', fontSize: '13px' }}>
              <Link to="/register/patient" className="text-brand-600 hover:underline">Register as Patient</Link>
              <span className="text-gray-300">|</span>
              <Link to="/register/doctor" className="text-brand-600 hover:underline">Register as Doctor</Link>
              <span className="text-gray-300">|</span>
              <Link to="/register/pharmacy" className="text-brand-600 hover:underline">Register as Pharmacy</Link>
            </div>
          </div>
        </div>

        {/* Ministry text */}
        <p style={{ fontSize: '11px', color: '#4b5563', fontWeight: '500', textAlign: 'center', flexShrink: 0 }}>
          Ministry of Health Sri Lanka · Secure Digital Health Platform
        </p>
      </div>

      {/* Fixed footer */}
      <footer style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10, background: 'rgba(255,255,255,0.88)', borderTop: '1px solid rgba(0,0,0,0.06)', backdropFilter: 'blur(8px)' }}>
        <div style={{ padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: '#6b7280' }}>
          Developed by <span style={{ fontWeight: '600', color: '#374151', margin: '0 4px' }}>Niwethushan</span> ·
          <a href="https://forge9x.co.uk" target="_blank" rel="noreferrer"
            className="font-bold text-brand-600 hover:text-brand-700 ml-1">Forge9x</a>
        </div>
      </footer>

      {/* AI Chatbot button */}
      <button onClick={() => setChatOpen(!chatOpen)} style={{
        position: 'absolute', bottom: '48px', right: '16px', zIndex: 99,
        width: '46px', height: '46px', borderRadius: '50%',
        background: '#059669', border: 'none', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 4px 16px rgba(5,150,105,0.4)',
      }}>
        {chatOpen ? <X size={20} color="white" /> : <MessageCircle size={20} color="white" />}
      </button>

      {/* Chatbot tooltip - desktop only */}
      {!chatOpen && (
        <div className="hidden sm:block" style={{
          position: 'absolute', bottom: '102px', right: '16px', zIndex: 99,
          background: '#059669', color: 'white', fontSize: '12px',
          padding: '4px 10px', borderRadius: '20px', whiteSpace: 'nowrap',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
        }}>
          Need help? Chat with us!
        </div>
      )}

      {/* Chatbot panel */}
      {chatOpen && <ChatBot onClose={() => setChatOpen(false)} />}
    </div>
  );
}

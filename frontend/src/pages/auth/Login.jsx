import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { Eye, EyeOff, MessageCircle, X, Send, Bot, ShieldCheck } from 'lucide-react';

const FAQ = [
  { keywords: ['login','sign in','how to login','cant login','log in'], a: 'Enter your NIC number, mobile number or email in the first field, then your password. Click Sign in.' },
  { keywords: ['forgot password','reset password','lost password','change password'], a: 'Click the "Forgot password?" link below the password field. Enter your NIC and registered mobile number to reset it.' },
  { keywords: ['nic','national identity','identity card','id number'], a: 'Your NIC is your National Identity Card number. Sri Lankan NICs are either 9 digits + V/X or 12 digits. Example: 199512345678 or 956123456V' },
  { keywords: ['account not active','pending','not approved','waiting','approval'], a: 'Doctors and pharmacies need admin approval before login. You will receive a notification once approved. Patients are approved instantly.' },
  { keywords: ['secure','privacy','data','safe'], a: 'Yes. All data is encrypted, stored securely, and only accessible by authorised users. CareWeave eRx follows strict health data privacy standards.' },
  { keywords: ['register patient','register as patient','patient registration','new patient'], a: 'Click "Register as Patient" below the sign in form. Fill in your full name, NIC, date of birth, mobile and password. Patients are approved instantly and can log in right away.' },
  { keywords: ['patient login','patient sign in','how patient login'], a: 'Patients log in with their NIC number or mobile number and password. Click Sign in to access the patient portal.' },
  { keywords: ['patient portal','patient dashboard','my prescriptions'], a: 'After login, the patient portal shows your prescription history, medicines taken, doctors visited, notifications and you can set your preferred pharmacy.' },
  { keywords: ['baby','child','minor','under 15','no nic','young'], a: 'For patients under 15 years old, NIC is not required. Register as a patient and enter the date of birth — this is used as the unique identifier. A guardian mobile number is required.' },
  { keywords: ['preferred pharmacy','choose pharmacy','select pharmacy'], a: 'After logging in as a patient, go to the Pharmacy tab in your dashboard and click Select next to your preferred pharmacy.' },
  { keywords: ['prescription history','my medicines','health summary'], a: 'Log in as a patient and go to your dashboard. You can view all prescriptions, medicines history, disease history and download a health summary PDF.' },
  { keywords: ['register doctor','doctor registration','register as doctor','new doctor'], a: 'Click "Register as Doctor" below the sign in form. You need your SLMC licence number, specialisation and clinic details. Your account will be reviewed and approved by the admin before you can log in.' },
  { keywords: ['doctor login','doctor sign in','how doctor login'], a: 'Doctors log in with their NIC number or mobile number and password. Once approved by admin, you can access the doctor portal.' },
  { keywords: ['slmc','slmc number','licence number','doctor licence'], a: 'Your SLMC number is your Sri Lanka Medical Council registration number. Format: SLMC/YEAR/NUMBER. Example: SLMC/2020/12345. This is required for doctor registration.' },
  { keywords: ['doctor portal','doctor dashboard','create prescription'], a: 'After login, the doctor portal lets you create digital prescriptions, search patients by NIC, select medicines and send prescriptions directly to pharmacies.' },
  { keywords: ['create prescription','new prescription','write prescription'], a: 'Log in as a doctor, click "+ New Prescription", search for the patient by NIC, add medicines with dosage and instructions, then send it to the pharmacy.' },
  { keywords: ['send prescription','prescription to pharmacy'], a: 'After creating a prescription, open it and select the pharmacy from the dropdown, then click Send. The pharmacy will receive it instantly.' },
  { keywords: ['register pharmacy','pharmacy registration','register as pharmacy','new pharmacy'], a: 'Click "Register as Pharmacy" below the sign in form. You need your pharmacy licence number, pharmacy name and address. Your account will be reviewed and approved by the admin.' },
  { keywords: ['pharmacy login','pharmacy sign in','how pharmacy login'], a: 'Pharmacies log in with the owner NIC or mobile number and password. Once approved by admin, you can access the pharmacy portal.' },
  { keywords: ['pharmacy licence','pharmacy license','pharmacy registration number'], a: 'Your pharmacy licence number is issued by the National Medicines Regulatory Authority (NMRA) of Sri Lanka. Format: PH/YEAR/NUMBER.' },
  { keywords: ['pharmacy portal','pharmacy dashboard','dispense'], a: 'After login, the pharmacy portal shows all incoming prescriptions. You can mark them as Received and then Dispense them once medicines are given.' },
  { keywords: ['receive prescription','dispense prescription','dispense medicine'], a: 'In the pharmacy portal, click Receive when you get a prescription, then click Dispense once medicines are given to the patient. The patient gets notified automatically.' },
  { keywords: ['invoice','pharmacy invoice','billing'], a: 'After dispensing, open the prescription and click "Create Invoice". Enter the unit price for each medicine and print the invoice for the patient.' },
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

    const answer = findAnswer(text);
    if (answer) {
      setTimeout(() => {
        setMessages(prev => [...prev, { from: 'bot', text: answer }]);
        setLoading(false);
      }, 600);
      return;
    }

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
      <div style={{ background: 'linear-gradient(135deg,#059669,#047857)', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Bot size={18} color="white" />
          <span style={{ color: 'white', fontWeight: '600', fontSize: '14px' }}>CareWeave Assistant</span>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'white', padding: '2px' }}>
          <X size={16} />
        </button>
      </div>

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
            <div style={{ background: '#f3f4f6', padding: '8px 14px', borderRadius: '12px 12px 12px 2px', fontSize: '18px' }}>···</div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div style={{ padding: '8px 12px', borderTop: '1px solid #f0f0f0', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        {['How to login?', 'Register doctor', 'Register pharmacy', 'Register patient', 'Forgot password'].map(q => (
          <button key={q} onClick={() => setInput(q)}
            style={{ fontSize: '11px', padding: '3px 8px', background: '#f0fdf4', color: '#059669', border: '1px solid #bbf7d0', borderRadius: '20px', cursor: 'pointer' }}>
            {q}
          </button>
        ))}
      </div>

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

/* ─── Dashboard preview mockup for the gradient panel ─── */
function DashboardMockup() {
  const bars = [40, 55, 46, 70, 60, 85, 100];
  const recent = [
    { text: 'Dr. Perera → City Pharmacy', status: 'Dispensed', time: '2m ago', color: '#059669' },
    { text: 'Dr. Fernando → Lanka Pharmacy', status: 'Sent', time: '14m ago', color: '#2563eb' },
    { text: 'Dr. Silva → HealthPlus', status: 'Received', time: '38m ago', color: '#d97706' },
  ];

  return (
    <div style={{ position: 'relative', flex: 1, minHeight: '340px' }}>
      {/* Card A — stats + bar chart */}
      <div style={{
        position: 'absolute', top: 0, left: 0, width: '300px', maxWidth: '78%',
        background: 'white', borderRadius: '18px', padding: '20px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.22)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '18px' }}>
          <div>
            <div style={{ fontSize: '11.5px', color: '#94a3b8', fontWeight: '600', marginBottom: '4px' }}>Prescriptions Sent</div>
            <div style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a' }}>12,480</div>
          </div>
          <div>
            <div style={{ fontSize: '11.5px', color: '#94a3b8', fontWeight: '600', marginBottom: '4px' }}>Dispensed</div>
            <div style={{ fontSize: '22px', fontWeight: '800', color: '#059669' }}>94%</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: '46px' }}>
          {bars.map((h, i) => (
            <div key={i} style={{
              width: '10px', height: `${h}%`, borderRadius: '3px',
              background: i === bars.length - 1 ? '#059669' : '#a7f3d0',
            }} />
          ))}
        </div>
      </div>

      {/* Card B — approval gauge */}
      <div style={{
        position: 'absolute', top: '38px', right: 0, width: '150px',
        background: 'white', borderRadius: '18px', padding: '16px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.22)',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
      }}>
        <div style={{
          width: '84px', height: '84px', borderRadius: '50%',
          background: 'conic-gradient(#059669 0% 92%, #e5e7eb 92% 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            width: '62px', height: '62px', borderRadius: '50%', background: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '15px', fontWeight: '800', color: '#0f172a',
          }}>
            92%
          </div>
        </div>
        <div style={{ fontSize: '11.5px', color: '#94a3b8', fontWeight: '600', marginTop: '10px' }}>Approval Rate</div>
      </div>

      {/* Card C — recent activity */}
      <div style={{
        position: 'absolute', bottom: 0, left: '36px', right: 0,
        background: 'white', borderRadius: '18px', padding: '18px 20px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.22)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <span style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>Recent Activity</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: '#059669', fontWeight: '600' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#059669', display: 'inline-block' }} />
            Live
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {recent.map((r, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: r.color, flexShrink: 0 }} />
                <span style={{ fontSize: '12.5px', color: '#334155', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.text}</span>
              </div>
              <span style={{ fontSize: '11px', color: '#94a3b8', flexShrink: 0 }}>{r.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Minimal social login icons ─── */
function GoogleIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 48 48">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.6 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.2 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.2 29.5 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.3C29.3 35.4 26.8 36 24 36c-5.3 0-9.6-3.4-11.3-8l-6.5 5C9.6 39.6 16.3 44 24 44z"/>
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.2 5.6l6.3 5.3C40.9 36.6 44 30.9 44 24c0-1.3-.1-2.7-.4-3.5z"/>
    </svg>
  );
}
function AppleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="#0f172a">
      <path d="M16.365 1.43c0 1.14-.468 2.11-1.244 2.83-.84.79-2.03 1.4-3.12 1.31-.13-1.11.44-2.28 1.19-3 .84-.85 2.28-1.47 3.17-1.14zm3.03 17.28c-.53 1.19-.78 1.72-1.46 2.77-.94 1.46-2.27 3.28-3.92 3.3-1.46.02-1.83-.95-3.8-.94-1.97.01-2.38.96-3.84.94-1.65-.02-2.91-1.66-3.85-3.12C.31 17.65-.53 12.79 1.1 9.54c1.07-2.11 3.02-3.44 5.13-3.47 1.53-.03 2.98 1.03 3.92 1.03.93 0 2.68-1.27 4.52-1.09.77.03 2.93.31 4.32 2.35-.11.07-2.58 1.5-2.55 4.48.03 3.57 3.14 4.76 3.18 4.78-.03.08-.5 1.68-1.65 3.79z"/>
    </svg>
  );
}

export default function Login() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [slowWarn, setSlowWarn] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSlowWarn(false);
    const warnTimer = setTimeout(() => setSlowWarn(true), 5000);
    try {
      const user = await login(identifier, password, remember);
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
    <div className="login-page" style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: '#eef2f1', fontFamily: "'Inter', sans-serif",
    }}>
      <div className="login-card" style={{
        display: 'flex', width: '100%', maxWidth: '1080px',
        background: 'white', overflow: 'hidden',
        boxShadow: '0 30px 60px -20px rgba(15,23,42,0.25)',
      }}>

        {/* ══════════════ LEFT PANEL — login form ══════════════ */}
        <div className="login-form-panel" style={{
          flex: 1,
          display: 'flex', flexDirection: 'column',
          padding: 'clamp(24px, 6vw, 40px) clamp(20px, 6vw, 44px) 28px',
        }}>
          {/* Logo */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '32px' }}>
            <img src="/logo.png" alt="CareWeave eRx" style={{ height: 'clamp(52px, 12vw, 68px)', objectFit: 'contain' }} />
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', maxWidth: '340px', width: '100%', margin: '0 auto' }}>

            {/* Form header */}
            <div style={{ marginBottom: '26px' }}>
              <h2 style={{ fontSize: '26px', fontWeight: '800', color: '#0f172a', marginBottom: '8px', letterSpacing: '-0.4px' }}>
                Welcome Back
              </h2>
              <p style={{ fontSize: '13.5px', color: '#64748b' }}>
                Enter your NIC, mobile or email and password to access your account.
              </p>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

              {/* Identifier */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '7px' }}>
                  NIC / Mobile / Email
                </label>
                <input
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                  required
                  placeholder="Enter NIC, mobile number or email"
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    border: '1.5px solid #e2e8f0', borderRadius: '10px',
                    padding: '11px 14px', fontSize: '14px',
                    color: '#0f172a', outline: 'none',
                    transition: 'border-color 0.15s',
                    background: '#fafbfc',
                  }}
                  onFocus={e => e.target.style.borderColor = '#059669'}
                  onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                />
              </div>

              {/* Password */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '7px' }}>
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    placeholder="Enter your password"
                    style={{
                      width: '100%', boxSizing: 'border-box',
                      border: '1.5px solid #e2e8f0', borderRadius: '10px',
                      padding: '11px 42px 11px 14px', fontSize: '14px',
                      color: '#0f172a', outline: 'none',
                      transition: 'border-color 0.15s',
                      background: '#fafbfc',
                    }}
                    onFocus={e => e.target.style.borderColor = '#059669'}
                    onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)} style={{
                    position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '2px',
                    display: 'flex', alignItems: 'center',
                  }}>
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Remember me + Forgot password */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '13px', color: '#374151', cursor: 'pointer', userSelect: 'none' }}>
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={e => setRemember(e.target.checked)}
                    style={{ width: '15px', height: '15px', accentColor: '#059669', cursor: 'pointer' }}
                  />
                  Remember me
                </label>
                <Link to="/forgot-password" style={{ fontSize: '12.5px', color: '#059669', fontWeight: '600', textDecoration: 'none' }}>
                  Forgot password?
                </Link>
              </div>

              {/* Slow warning */}
              {slowWarn && (
                <div style={{
                  display: 'flex', alignItems: 'flex-start', gap: '10px',
                  background: '#fffbeb', border: '1px solid #fde68a',
                  borderRadius: '10px', padding: '10px 14px',
                }}>
                  <span style={{ fontSize: '16px', flexShrink: 0 }}>⏳</span>
                  <p style={{ fontSize: '12.5px', color: '#92400e', lineHeight: '1.5', margin: 0 }}>
                    <strong>Server is waking up</strong> — this can take up to 60 seconds on first use. Please wait, do not refresh.
                  </p>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%', padding: '13px',
                  background: loading ? '#6ee7b7' : 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                  color: 'white', border: 'none', borderRadius: '10px',
                  fontSize: '15px', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: loading ? 'none' : '0 4px 14px rgba(5,150,105,0.35)',
                  transition: 'all 0.2s', letterSpacing: '0.01em',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                }}
              >
                {loading ? (
                  <>
                    <span style={{
                      width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.4)',
                      borderTopColor: 'white', borderRadius: '50%',
                      display: 'inline-block', animation: 'spin 0.7s linear infinite',
                    }} />
                    Signing in…
                  </>
                ) : 'Log In'}
              </button>
            </form>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '20px 0 16px' }}>
              <div style={{ flex: 1, height: '1px', background: '#f1f5f9' }} />
              <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '500' }}>Or Log In With</span>
              <div style={{ flex: 1, height: '1px', background: '#f1f5f9' }} />
            </div>

            {/* Social login */}
            <div style={{ display: 'flex', gap: '10px' }}>
              {[
                { icon: <GoogleIcon />, label: 'Google' },
                { icon: <AppleIcon />, label: 'Apple' },
              ].map(({ icon, label }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => toast(`${label} sign-in is coming soon`, { icon: 'ℹ️' })}
                  style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    padding: '10px', border: '1.5px solid #e2e8f0', borderRadius: '10px',
                    background: 'white', fontSize: '13.5px', fontWeight: '600', color: '#374151',
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                  onMouseLeave={e => e.currentTarget.style.background = 'white'}
                >
                  {icon}
                  {label}
                </button>
              ))}
            </div>

            {/* Register links */}
            <div style={{ textAlign: 'center', marginTop: '22px' }}>
              <span style={{ fontSize: '13px', color: '#64748b' }}>Don't have an account? </span>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '10px' }}>
                {[
                  { to: '/register/patient', label: 'Patient' },
                  { to: '/register/doctor', label: 'Doctor' },
                  { to: '/register/pharmacy', label: 'Pharmacy' },
                ].map(({ to, label }) => (
                  <Link key={to} to={to} style={{
                    fontSize: '13px', fontWeight: '600', color: '#059669',
                    textDecoration: 'none', padding: '6px 14px',
                    border: '1.5px solid #d1fae5', borderRadius: '8px',
                    background: '#f0fdf4', transition: 'all 0.15s',
                  }}
                    onMouseEnter={e => { e.target.style.background = '#dcfce7'; e.target.style.borderColor = '#6ee7b7'; }}
                    onMouseLeave={e => { e.target.style.background = '#f0fdf4'; e.target.style.borderColor = '#d1fae5'; }}
                  >
                    Register as {label}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom mini-footer */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginTop: '24px', fontSize: '11.5px', color: '#94a3b8',
          }}>
            <span>© 2026 CareWeave eRx</span>
            <Link to="/privacy" style={{ color: '#94a3b8', textDecoration: 'none' }}>Privacy Policy</Link>
          </div>
        </div>

        {/* ══════════════ RIGHT PANEL — gradient dashboard preview ══════════════ */}
        <div
          className="login-side-panel"
          style={{
            flex: '0 0 54%',
            position: 'relative',
            overflow: 'hidden',
            background: 'linear-gradient(150deg, #10b981 0%, #059669 45%, #047857 100%)',
            display: 'none', /* hidden on mobile, shown on md+ via media query below */
            flexDirection: 'column',
            padding: '44px 44px 40px',
          }}
        >
          {/* Decorative blurred circles */}
          <div style={{
            position: 'absolute', top: '-60px', right: '-60px', width: '220px', height: '220px',
            borderRadius: '50%', background: 'rgba(255,255,255,0.10)', filter: 'blur(10px)',
          }} />
          <div style={{
            position: 'absolute', bottom: '-80px', left: '-60px', width: '260px', height: '260px',
            borderRadius: '50%', background: 'rgba(255,255,255,0.08)', filter: 'blur(10px)',
          }} />

          <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Badge */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px', alignSelf: 'flex-start',
              background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(6px)', borderRadius: '20px',
              padding: '4px 14px', marginBottom: '18px',
            }}>
              <ShieldCheck size={13} color="white" />
              <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: '11.5px', fontWeight: '600', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                Ministry of Health · Sri Lanka
              </span>
            </div>

            {/* Headline */}
            <h1 style={{
              color: 'white', fontSize: '28px', fontWeight: '800',
              lineHeight: '1.28', marginBottom: '10px', letterSpacing: '-0.4px', maxWidth: '380px',
            }}>
              Effortlessly manage prescriptions and pharmacy operations.
            </h1>
            <p style={{
              color: 'rgba(255,255,255,0.78)', fontSize: '14px',
              lineHeight: '1.6', maxWidth: '360px', marginBottom: '28px',
            }}>
              Log in to access the CareWeave eRx dashboard connecting doctors, pharmacies and patients in real time.
            </p>

            <DashboardMockup />
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer style={{
        marginTop: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '12px', color: '#94a3b8', gap: '4px',
      }}>
        Developed by
        <a href="https://forge9x.co.uk" target="_blank" rel="noreferrer"
          style={{ fontWeight: '700', color: '#059669', textDecoration: 'none' }}>
          Forge9x
        </a>
      </footer>

      {/* ══════════════ CHATBOT ══════════════ */}
      <button onClick={() => setChatOpen(!chatOpen)} style={{
        position: 'fixed', bottom: '56px', right: '20px', zIndex: 99,
        width: '50px', height: '50px', borderRadius: '50%',
        background: 'linear-gradient(135deg,#059669,#047857)',
        border: 'none', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 4px 20px rgba(5,150,105,0.45)',
        transition: 'transform 0.2s',
      }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.08)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
      >
        {chatOpen ? <X size={20} color="white" /> : <MessageCircle size={20} color="white" />}
      </button>

      {!chatOpen && (
        <div className="hidden sm:block" style={{
          position: 'fixed', bottom: '114px', right: '20px', zIndex: 99,
          background: '#059669', color: 'white', fontSize: '12px',
          padding: '5px 12px', borderRadius: '20px', whiteSpace: 'nowrap',
          boxShadow: '0 2px 10px rgba(0,0,0,0.12)',
        }}>
          Need help? Chat with us!
        </div>
      )}

      {chatOpen && <ChatBot onClose={() => setChatOpen(false)} />}

      {/* Global styles */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }

        /* Mobile: form fills the card, no rounded corners (edge-to-edge) */
        .login-page { padding: 0; }
        .login-card { border-radius: 0; min-height: 100vh; }
        @media (min-width: 480px) {
          .login-page { padding: 24px 16px 48px; }
          .login-card { border-radius: 20px; min-height: auto; }
        }

        /* Show gradient side panel + constrain form width on md+ screens only */
        @media (min-width: 768px) {
          .login-page { padding: 32px 16px 64px; }
          .login-side-panel { display: flex !important; }
          .login-form-panel { flex: 0 0 46% !important; }
          .login-card { border-radius: 28px; min-height: 640px; }
        }

        input::placeholder { color: #c4cbd6; }
      `}</style>
    </div>
  );
}

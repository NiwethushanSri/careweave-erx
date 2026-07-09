import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { Eye, EyeOff, MessageCircle, X, Send, Bot, ShieldCheck, Stethoscope, Pill, Clock } from 'lucide-react';

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

/* ─── Feature badge for left panel ─── */
function Feature({ icon: Icon, text }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <div style={{
        width: '34px', height: '34px', borderRadius: '10px',
        background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
      }}>
        <Icon size={16} color="white" />
      </div>
      <span style={{ color: 'rgba(255,255,255,0.92)', fontSize: '13.5px', lineHeight: '1.4' }}>{text}</span>
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
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>

      {/* ══════════════ LEFT PANEL — image + branding ══════════════ */}
      <div style={{
        flex: '0 0 52%',
        position: 'relative',
        overflow: 'hidden',
        display: 'none', /* hidden on mobile, shown on md+ via media query below */
      }}
        className="login-left-panel"
      >
        {/* Background photo */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'url(/bg-login.jpg)',
          backgroundSize: 'cover', backgroundPosition: 'center top',
        }} />

        {/* Dark gradient overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(160deg, rgba(2,68,48,0.82) 0%, rgba(5,150,105,0.70) 55%, rgba(4,120,87,0.88) 100%)',
        }} />

        {/* Content on top */}
        <div style={{
          position: 'relative', zIndex: 2,
          display: 'flex', flexDirection: 'column',
          height: '100%', padding: '44px 48px',
          justifyContent: 'space-between',
        }}>
          {/* Top: logo + wordmark */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img src="/logo.png" alt="CareWeave eRx"
              style={{ height: '44px', objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
          </div>

          {/* Mid: headline */}
          <div>
            <div style={{
              display: 'inline-block', background: 'rgba(255,255,255,0.15)',
              backdropFilter: 'blur(6px)', borderRadius: '20px',
              padding: '4px 14px', marginBottom: '18px',
            }}>
              <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: '12px', fontWeight: '600', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                Ministry of Health · Sri Lanka
              </span>
            </div>

            <h1 style={{
              color: 'white', fontSize: '32px', fontWeight: '800',
              lineHeight: '1.2', marginBottom: '12px', letterSpacing: '-0.5px',
            }}>
              Digital Prescriptions,<br />
              <span style={{ color: '#6ee7b7' }}>Smarter Healthcare</span>
            </h1>

            <p style={{
              color: 'rgba(255,255,255,0.78)', fontSize: '15px',
              lineHeight: '1.6', maxWidth: '340px', marginBottom: '32px',
            }}>
              Sri Lanka's secure national eRx platform — connecting doctors, pharmacies and patients in real time.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <Feature icon={Stethoscope} text="Instant digital prescriptions from verified doctors" />
              <Feature icon={Pill} text="Real-time pharmacy dispensing & tracking" />
              <Feature icon={ShieldCheck} text="End-to-end encrypted & government approved" />
              <Feature icon={Clock} text="24/7 access to your complete health history" />
            </div>
          </div>

          {/* Bottom: stats */}
          <div style={{ display: 'flex', gap: '28px' }}>
            {[['Doctors', '2,400+'], ['Pharmacies', '850+'], ['Prescriptions', '180K+']].map(([label, val]) => (
              <div key={label}>
                <div style={{ color: '#6ee7b7', fontSize: '22px', fontWeight: '800', lineHeight: 1 }}>{val}</div>
                <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: '12px', marginTop: '2px' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════ RIGHT PANEL — login form ══════════════ */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        background: '#f8fafb',
        position: 'relative',
        overflow: 'auto',
      }}>

        {/* Mobile-only background (when left panel hidden) */}
        <div className="login-mobile-bg" style={{
          position: 'fixed', inset: 0, zIndex: 0,
          backgroundImage: 'url(/bg-login.jpg)',
          backgroundSize: 'cover', backgroundPosition: 'center',
          opacity: 0.08,
        }} />

        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '40px 24px 80px',
          position: 'relative', zIndex: 1,
        }}>

          {/* Mobile logo (only shows when left panel hidden) */}
          <div className="login-mobile-logo" style={{ marginBottom: '24px', textAlign: 'center' }}>
            <img src="/logo.png" alt="CareWeave eRx" style={{ height: '52px', objectFit: 'contain' }} />
          </div>

          {/* Form card */}
          <div style={{
            width: '100%', maxWidth: '420px',
            background: 'white',
            borderRadius: '20px',
            boxShadow: '0 4px 24px rgba(0,0,0,0.07), 0 1px 4px rgba(0,0,0,0.04)',
            padding: '36px 36px 32px',
            border: '1px solid rgba(0,0,0,0.05)',
          }}>

            {/* Form header */}
            <div style={{ marginBottom: '28px' }}>
              <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a', marginBottom: '6px', letterSpacing: '-0.3px' }}>
                Welcome back
              </h2>
              <p style={{ fontSize: '14px', color: '#64748b' }}>
                Sign in to your CareWeave eRx account
              </p>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '7px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151' }}>
                    Password
                  </label>
                  <Link to="/forgot-password" style={{ fontSize: '12.5px', color: '#059669', fontWeight: '500', textDecoration: 'none' }}>
                    Forgot password?
                  </Link>
                </div>
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
                ) : 'Sign in'}
              </button>
            </form>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '22px 0 18px' }}>
              <div style={{ flex: 1, height: '1px', background: '#f1f5f9' }} />
              <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '500' }}>New to CareWeave eRx?</span>
              <div style={{ flex: 1, height: '1px', background: '#f1f5f9' }} />
            </div>

            {/* Register links */}
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
              {[
                { to: '/register/patient', label: '🧑‍⚕️ Patient' },
                { to: '/register/doctor', label: '🩺 Doctor' },
                { to: '/register/pharmacy', label: '🏥 Pharmacy' },
              ].map(({ to, label }) => (
                <Link key={to} to={to} style={{
                  fontSize: '13px', fontWeight: '600', color: '#059669',
                  textDecoration: 'none', padding: '7px 14px',
                  border: '1.5px solid #d1fae5', borderRadius: '8px',
                  background: '#f0fdf4', transition: 'all 0.15s',
                }}
                  onMouseEnter={e => { e.target.style.background = '#dcfce7'; e.target.style.borderColor = '#6ee7b7'; }}
                  onMouseLeave={e => { e.target.style.background = '#f0fdf4'; e.target.style.borderColor = '#d1fae5'; }}
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>

          {/* Ministry badge */}
          <p style={{ marginTop: '24px', fontSize: '12px', color: '#94a3b8', textAlign: 'center', fontWeight: '500' }}>
            🏛️ Ministry of Health Sri Lanka · Secure Digital Health Platform
          </p>
        </div>

        {/* Footer */}
        <footer style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 10,
          background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(8px)',
          borderTop: '1px solid rgba(0,0,0,0.05)',
          padding: '8px 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '12px', color: '#9ca3af', gap: '4px',
        }}>
          Developed by
          <span style={{ fontWeight: '700', color: '#374151', margin: '0 2px' }}>Niwethushan</span>
          ·
          <a href="https://forge9x.co.uk" target="_blank" rel="noreferrer"
            style={{ fontWeight: '700', color: '#059669', textDecoration: 'none', marginLeft: '2px' }}>
            Forge9x
          </a>
        </footer>
      </div>

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

        /* Show left panel on md+ screens */
        @media (min-width: 768px) {
          .login-left-panel { display: block !important; }
          .login-mobile-bg { display: none !important; }
          .login-mobile-logo { display: none !important; }
        }
        @media (max-width: 767px) {
          .login-left-panel { display: none !important; }
        }

        input::placeholder { color: #c4cbd6; }
      `}</style>
    </div>
  );
}

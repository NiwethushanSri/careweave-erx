import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { ArrowLeft, CheckCircle } from 'lucide-react';

export default function ForgotPassword() {
  const [step, setStep] = useState(1); // 1=enter details, 2=enter new password, 3=done
  const [identifier, setIdentifier] = useState('');
  const [nic, setNic] = useState('');
  const [mobile, setMobile] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState(null);

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/auth/forgot-password/verify', { nic, mobile });
      setUserId(data.data.userId);
      toast.success('Identity verified! Set your new password.');
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not verify identity');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) return toast.error('Passwords do not match');
    if (newPassword.length < 8) return toast.error('Password must be at least 8 characters');
    setLoading(true);
    try {
      await api.post('/auth/forgot-password/reset', { userId, newPassword });
      toast.success('Password reset successfully!');
      setStep(3);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-white flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <img src="/logo.png" alt="CareWeave eRx" className="h-12 mx-auto mb-3" />
            <h1 className="text-2xl font-bold text-gray-900">CareWeave eRx</h1>
            <p className="text-gray-500 text-sm mt-1">Reset your password</p>
          </div>

          <div className="card p-8">
            {step === 1 && (
              <>
                <h2 className="text-lg font-semibold mb-2">Forgot password?</h2>
                <p className="text-sm text-gray-500 mb-6">Enter your NIC number and registered mobile number to verify your identity.</p>
                <form onSubmit={handleVerify} className="space-y-4">
                  <div>
                    <label className="label">NIC number</label>
                    <input className="input" placeholder="e.g. 199512345678"
                      value={nic} onChange={e => setNic(e.target.value)} required />
                  </div>
                  <div>
                    <label className="label">Registered mobile number</label>
                    <input className="input" placeholder="e.g. 0771234567"
                      value={mobile} onChange={e => setMobile(e.target.value)} required />
                  </div>
                  <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
                    {loading ? 'Verifying...' : 'Verify identity'}
                  </button>
                </form>
              </>
            )}

            {step === 2 && (
              <>
                <h2 className="text-lg font-semibold mb-2">Set new password</h2>
                <p className="text-sm text-gray-500 mb-6">Your identity has been verified. Enter your new password below.</p>
                <form onSubmit={handleReset} className="space-y-4">
                  <div>
                    <label className="label">New password</label>
                    <input className="input" type="password" placeholder="Min 8 characters"
                      value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={8} />
                  </div>
                  <div>
                    <label className="label">Confirm new password</label>
                    <input className="input" type="password" placeholder="Repeat new password"
                      value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
                  </div>
                  <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
                    {loading ? 'Resetting...' : 'Reset password'}
                  </button>
                </form>
              </>
            )}

            {step === 3 && (
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Password reset!</h2>
                <p className="text-sm text-gray-500 mb-6">Your password has been reset successfully. You can now sign in with your new password.</p>
                <Link to="/login" className="btn-primary inline-block px-8 py-2.5">Go to sign in</Link>
              </div>
            )}

            {step !== 3 && (
              <div className="mt-6 text-center">
                <Link to="/login" className="flex items-center justify-center gap-1 text-sm text-gray-500 hover:text-gray-700">
                  <ArrowLeft className="w-3 h-3" /> Back to sign in
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      <footer className="border-t border-gray-100 bg-white">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col items-center gap-1 text-center">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="CareWeave eRx" className="h-6" />
            <span className="text-sm text-gray-500">CareWeave eRx — Digital Prescription Platform</span>
          </div>
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

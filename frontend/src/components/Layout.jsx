import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, FileText, LayoutDashboard, Plus, Shield, Package, BarChart2, Menu, X, UserCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useState } from 'react';

const navByRole = {
  doctor: [
    { to: '/doctor', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/doctor/new-prescription', label: 'New Rx', icon: Plus },
    { to: '/doctor/profile', label: 'My Profile', icon: UserCircle },
  ],
  pharmacy: [
    { to: '/pharmacy', label: 'Dashboard', icon: Package },
    { to: '/pharmacy/analytics', label: 'Analytics', icon: BarChart2 },
    { to: '/pharmacy/profile', label: 'My Profile', icon: UserCircle },
  ],
  patient: [
    { to: '/patient', label: 'My Prescriptions', icon: FileText },
  ],
  admin: [
    { to: '/admin', label: 'Dashboard', icon: Shield },
    { to: '/admin/analytics', label: 'Analytics', icon: BarChart2 },
  ],
};

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    toast.success('Logged out');
    navigate('/login');
  };

  const navItems = navByRole[user?.role] || [];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top nav */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-14">
          {/* Logo + desktop nav */}
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2">
              <img src="/logo.png" alt="CareWeave eRx" className="h-8 object-contain" />
            </Link>
            <div className="hidden sm:flex items-center gap-1">
              {navItems.map(item => (
                <Link key={item.to} to={item.to}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    location.pathname === item.to
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}>
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-medium text-gray-800">{user?.full_name}</p>
              <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
            </div>
            <button onClick={handleLogout}
              className="hidden sm:flex text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              title="Logout">
              <LogOut className="w-4 h-4" />
            </button>
            {/* Mobile hamburger */}
            <button onClick={() => setMenuOpen(!menuOpen)}
              className="sm:hidden p-1.5 rounded-lg hover:bg-gray-100 text-gray-600">
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown menu */}
        {menuOpen && (
          <div className="sm:hidden border-t border-gray-100 bg-white px-4 py-3 space-y-1">
            <p className="text-xs text-gray-400 mb-2">{user?.full_name} · <span className="capitalize">{user?.role}</span></p>
            {navItems.map(item => (
              <Link key={item.to} to={item.to}
                onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === item.to
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}>
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            ))}
            <button onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 w-full mt-1">
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        )}
      </nav>

      {/* Main content */}
      <main className="max-w-6xl mx-auto w-full flex-1 px-0">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-white mt-auto">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Links */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1 text-xs text-gray-400">
              <Link to="/guide" className="hover:text-brand-600 transition-colors">User Guide</Link>
              <span className="hidden sm:inline text-gray-200">|</span>
              <Link to="/terms" className="hover:text-brand-600 transition-colors">Terms & Conditions</Link>
              <span className="hidden sm:inline text-gray-200">|</span>
              <Link to="/privacy" className="hover:text-brand-600 transition-colors">Privacy Policy</Link>
              <span className="hidden sm:inline text-gray-200">|</span>
              <a href="mailto:support@careweave.lk" className="hover:text-brand-600 transition-colors">Support</a>
            </div>
            {/* Credit */}
            <div className="text-xs text-gray-400 text-center sm:text-right">
              <span>Ministry of Health Sri Lanka · </span>
              Developed by{' '}
              <span className="font-medium text-gray-600">Niwethushan</span>
              {' '}·{' '}
              <a href="https://forge9x.co.uk" target="_blank" rel="noreferrer"
                className="font-semibold text-brand-600 hover:text-brand-700 transition-colors">
                Forge9x
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, FileText, LayoutDashboard, Plus, Shield, Package, BarChart2 } from 'lucide-react';
import toast from 'react-hot-toast';

const navByRole = {
  doctor: [
    { to: '/doctor', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/doctor/new-prescription', label: 'New Rx', icon: Plus },
  ],
  pharmacy: [
    { to: '/pharmacy/analytics', label: 'Analytics', icon: BarChart2 },
    { to: '/pharmacy', label: 'Dashboard', icon: Package },
  ],
  patient: [
    { to: '/patient', label: 'My Prescriptions', icon: FileText },
  ],
  admin: [
    { to: '/admin/analytics', label: 'Analytics', icon: BarChart2 },
    { to: '/admin', label: 'Dashboard', icon: Shield },
  ],
};

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Logged out');
    navigate('/login');
  };

  const navItems = navByRole[user?.role] || [];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top nav */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-14">
          <div className="flex items-center gap-6">
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

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-medium text-gray-800">{user?.full_name}</p>
              <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
            </div>
            <button onClick={handleLogout}
              className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              title="Logout">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="max-w-6xl mx-auto w-full flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-white" style={{ position: 'sticky', bottom: 0, zIndex: 10 }}>
        <div className="py-3 flex flex-col items-center gap-0.5 text-center">
          <div className="text-sm text-gray-400">
            Developed by{' '}
            <span className="font-medium text-gray-600">Niwethushan</span>
            {' '}·{' '}
            <a href="https://forge9x.co.uk" target="_blank" rel="noreferrer"
              className="font-semibold text-brand-600 hover:text-brand-700 transition-colors">
              Forge9x
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

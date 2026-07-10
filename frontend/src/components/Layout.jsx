import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSidebarExtras } from '../context/SidebarExtrasContext';
import { LogOut, FileText, LayoutDashboard, Plus, Shield, Package, BarChart2, Menu, X, UserCircle, ChevronDown } from 'lucide-react';
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

function NavList({ navItems, location, onNavigate, extraNav }) {
  const itemClass = active => `relative flex items-center gap-3 pl-4 pr-3 py-2.5 rounded-xl text-sm font-medium text-left transition-colors border-l-4 ${
    active
      ? 'bg-white/10 text-white border-brand-500'
      : 'text-gray-400 hover:bg-white/5 hover:text-white border-transparent'
  }`;

  // When a page (e.g. the patient dashboard) registers its own in-page tabs,
  // show those directly in the sidebar instead of the plain route list.
  if (extraNav) {
    return (
      <nav className="flex flex-col gap-1 px-3">
        {extraNav.items.map(item => (
          <button key={item.key} onClick={() => { item.onClick(); onNavigate?.(); }} className={itemClass(item.active)}>
            <item.icon className="w-[18px] h-[18px] shrink-0" />
            <span className="flex-1">{item.label}</span>
            {item.badge ? (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${item.active ? 'bg-white/25 text-white' : 'bg-red-500 text-white'}`}>
                {item.badge}
              </span>
            ) : null}
          </button>
        ))}
      </nav>
    );
  }

  return (
    <nav className="flex flex-col gap-1 px-3">
      {navItems.map(item => (
        <Link key={item.to} to={item.to} onClick={onNavigate} className={itemClass(location.pathname === item.to)}>
          <item.icon className="w-[18px] h-[18px] shrink-0" />
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

function ProfileCard({ user, onLogout }) {
  const [open, setOpen] = useState(false);
  const initials = (user?.full_name || '').split(' ').filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('');
  return (
    <div className="px-3 pb-3 pt-2 border-t border-white/10">
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2.5 px-2 py-2 rounded-xl hover:bg-white/5 transition-colors">
        <div className="w-9 h-9 rounded-full bg-brand-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
          {initials || <UserCircle className="w-5 h-5" />}
        </div>
        <div className="min-w-0 text-left flex-1">
          <p className="text-sm font-semibold text-white truncate">{user?.full_name}</p>
          <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <button onClick={onLogout}
          className="w-full flex items-center gap-2.5 mt-1 px-2 py-2 rounded-xl text-sm font-medium text-red-400 hover:bg-white/5 transition-colors">
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      )}
    </div>
  );
}

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const { extraNav } = useSidebarExtras() || {};

  const handleLogout = () => {
    logout();
    toast.success('Logged out');
    navigate('/login');
  };

  const navItems = navByRole[user?.role] || [];

  return (
    <div className="min-h-screen bg-gray-50 flex">

      {/* ══════════════ SIDEBAR — desktop, persistent ══════════════ */}
      <aside className="hidden lg:flex lg:flex-col w-64 shrink-0 bg-gray-900 sticky top-0 h-screen">
        <Link to="/" className="flex items-center px-5 py-5">
          <img src="/logo.png" alt="CareWeave eRx" className="h-8 object-contain" style={{ filter: 'brightness(0) invert(1)' }} />
        </Link>
        <div className="flex-1 overflow-y-auto py-2">
          <NavList navItems={navItems} location={location} extraNav={extraNav} />
        </div>
        <ProfileCard user={user} onLogout={handleLogout} />
      </aside>

      {/* ══════════════ SIDEBAR — mobile drawer ══════════════ */}
      {menuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="fixed inset-0 bg-black/40" onClick={() => setMenuOpen(false)} />
          <aside className="relative flex flex-col w-64 bg-gray-900 h-full">
            <div className="flex items-center justify-between px-5 py-5">
              <img src="/logo.png" alt="CareWeave eRx" className="h-8 object-contain" style={{ filter: 'brightness(0) invert(1)' }} />
              <button onClick={() => setMenuOpen(false)} className="text-gray-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto py-2">
              <NavList navItems={navItems} location={location} onNavigate={() => setMenuOpen(false)} extraNav={extraNav} />
            </div>
            <ProfileCard user={user} onLogout={handleLogout} />
          </aside>
        </div>
      )}

      {/* ══════════════ MAIN COLUMN ══════════════ */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Mobile top bar */}
        <div className="lg:hidden sticky top-0 z-20 bg-white border-b border-gray-100 flex items-center justify-between h-14 px-4">
          <Link to="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="CareWeave eRx" className="h-7 object-contain" />
          </Link>
          <button onClick={() => setMenuOpen(true)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600">
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {/* Main content */}
        <main className="flex-1 w-full">
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
                <a href="https://forge9x.co.uk" target="_blank" rel="noreferrer"
                  className="font-semibold text-brand-600 hover:text-brand-700 transition-colors">
                  Forge9x
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

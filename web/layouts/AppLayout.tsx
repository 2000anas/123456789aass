import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ArrowLeftRight,
  Users,
  CalendarCheck,
  Wallet,
  FileBarChart2,
  Settings,
  LogOut,
  Menu,
  ClipboardList,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { t } from '../i18n';

const adminLinks = [
  { to: '/dashboard', label: t('dashboard'), icon: LayoutDashboard },
  { to: '/transactions', label: t('transactions'), icon: ArrowLeftRight },
  { to: '/employees', label: t('employees'), icon: Users },
  { to: '/attendance', label: t('attendance'), icon: CalendarCheck },
  { to: '/salaries', label: t('salaries'), icon: Wallet },
  { to: '/reports', label: t('reports'), icon: FileBarChart2 },
  { to: '/settings', label: t('settings'), icon: Settings },
];

const employeeLinks = [
  { to: '/employee/dashboard', label: t('dashboard'), icon: LayoutDashboard },
  { to: '/employee/attendance', label: t('myAttendance'), icon: ClipboardList },
];

export function AppLayout() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const links = isAdmin ? adminLinks : employeeLinks;

  useEffect(() => {
    document.body.classList.toggle('drawer-open', open);
    return () => document.body.classList.remove('drawer-open');
  }, [open]);

  useEffect(() => {
    function onResize() {
      if (window.innerWidth > 900) setOpen(false);
    }
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="app-shell">
      <div
        className={`mobile-drawer-backdrop ${open ? 'open' : ''}`}
        onClick={() => setOpen(false)}
        aria-hidden={!open}
      />
      <aside className={`sidebar ${open ? 'open' : ''}`} aria-label="القائمة الجانبية">
        <div className="sidebar-brand">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <div className="logo">
              <span className="logo-mark" />
              ELYPTEK
            </div>
            <button
              className="menu-btn"
              onClick={() => setOpen(false)}
              aria-label="إغلاق القائمة"
              style={{ background: 'transparent', borderColor: 'rgba(255,255,255,0.2)', color: '#fff' }}
            >
              <X size={18} />
            </button>
          </div>
          <div className="subtitle">{t('appSubtitle')}</div>
        </div>
        <nav className="sidebar-nav">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={() => setOpen(false)}
            >
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <button
            className="btn btn-outline btn-block"
            style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.2)' }}
            onClick={handleLogout}
          >
            <LogOut size={16} />
            {t('logout')}
          </button>
        </div>
      </aside>

      <div className="main-area">
        <header className="topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
            <button className="menu-btn" onClick={() => setOpen(true)} aria-label="فتح القائمة">
              <Menu size={20} />
            </button>
            <div className="topbar-user">
              <strong>
                {t('welcome')}، {user?.name}
              </strong>
              <div style={{ color: 'var(--muted)', fontSize: 13 }}>
                {isAdmin ? 'مدير النظام' : 'موظف'}
              </div>
            </div>
          </div>
          <div className="user-chip">
            <div className="avatar">{user?.name?.charAt(0) || 'E'}</div>
          </div>
        </header>
        <main className="page">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

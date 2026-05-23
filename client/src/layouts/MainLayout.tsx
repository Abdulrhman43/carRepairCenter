import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import {
  LayoutDashboard,
  Users,
  Car,
  Wrench,
  Package,
  CreditCard,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Sun,
  Moon,
} from 'lucide-react';
import { useState, useEffect } from 'react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'لوحة التحكم' },
  { to: '/customers', icon: Users, label: 'العملاء' },
  { to: '/vehicles', icon: Car, label: 'المركبات' },
  { to: '/repair-orders', icon: Wrench, label: 'أوامر الصيانة' },
  { to: '/inventory', icon: Package, label: 'المخزون', adminOnly: true },
  { to: '/services', icon: Settings, label: 'الخدمات', adminOnly: true },
  { to: '/payments', icon: CreditCard, label: 'المدفوعات' },
  { to: '/reports', icon: BarChart3, label: 'التقارير', adminOnly: true },
];

export default function MainLayout() {
  const { user, isAdmin, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768);

  useEffect(() => {
    const handleResize = () => {
      setSidebarOpen(window.innerWidth >= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const filteredItems = navItems.filter((item) => !item.adminOnly || isAdmin);
  const initials = user?.fullName?.split(' ').map((w) => w[0]).join('').slice(0, 2) || '؟';

  return (
    <div className="min-h-screen relative overflow-x-hidden" style={{ background: 'var(--bg-primary)' }} dir="rtl">
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 md:hidden transition-opacity"
          style={{ background: 'var(--overlay-bg)', backdropFilter: 'blur(4px)' }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 right-0 h-full z-40 transition-all duration-300 no-print flex flex-col ${
          sidebarOpen ? 'w-64 translate-x-0' : 'w-64 translate-x-full md:w-[72px] md:translate-x-0'
        }`}
        style={{
          background: 'var(--bg-sidebar)',
          borderLeft: '1px solid var(--border-color)',
        }}
      >
        {/* Sidebar Header */}
        <div
          className="flex items-center justify-between px-4 h-16 shrink-0"
          style={{ borderBottom: '1px solid var(--border-color)' }}
        >
          <div className={`flex items-center gap-2.5 transition-opacity duration-300 ${!sidebarOpen ? 'md:hidden' : ''}`}>
            <div
              className="w-8 h-8 min-w-[32px] rounded-lg flex items-center justify-center"
              style={{ background: 'var(--color-accent)' }}
            >
              <Car size={17} className="text-white" />
            </div>
            <span className="text-base font-display font-bold whitespace-nowrap" style={{ color: 'var(--color-accent)' }}>
              مكانك سيرفس
            </span>
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${!sidebarOpen ? 'md:mx-auto' : ''}`}
            style={{ color: 'var(--text-muted)' }}
          >
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        {/* Theme Toggle */}
        <div className="px-3 pt-3 shrink-0">
          <button
            onClick={toggleTheme}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all cursor-pointer ${!sidebarOpen ? 'md:justify-center' : ''}`}
            style={{
              background: 'var(--color-accent-soft)',
              color: 'var(--color-accent)',
            }}
          >
            {theme === 'dark' ? <Sun size={18} className="min-w-[18px]" /> : <Moon size={18} className="min-w-[18px]" />}
            <span className={`text-sm font-medium whitespace-nowrap ${!sidebarOpen ? 'md:hidden' : ''}`}>
              {theme === 'dark' ? 'الوضع النهاري' : 'الوضع الليلي'}
            </span>
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-3 flex flex-col gap-0.5 mt-1 overflow-y-auto flex-1">
          {filteredItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={() => {
                if (window.innerWidth < 768) setSidebarOpen(false);
              }}
              className={() =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative ${
                  !sidebarOpen ? 'md:justify-center' : ''
                }`
              }
              style={({ isActive }) => ({
                background: isActive ? 'var(--color-accent-soft)' : 'transparent',
                color: isActive ? 'var(--color-accent)' : 'var(--text-secondary)',
                fontWeight: isActive ? 600 : 400,
              })}
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <div
                      className="absolute right-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-l-full"
                      style={{ background: 'var(--color-accent)' }}
                    />
                  )}
                  <item.icon size={19} className="min-w-[19px]" />
                  <span className={`text-sm whitespace-nowrap ${!sidebarOpen ? 'md:hidden' : ''}`}>
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User & Logout */}
        <div className="p-3 shrink-0" style={{ borderTop: '1px solid var(--border-color)' }}>
          <div className={`mb-3 px-2 flex items-center gap-3 ${!sidebarOpen ? 'md:hidden' : ''}`}>
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
              style={{
                background: 'var(--color-accent-soft)',
                color: 'var(--color-accent)',
                border: '2px solid var(--color-accent)',
              }}
            >
              {initials}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{user?.fullName}</p>
              <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                {user?.role === 'Admin' ? 'مدير النظام' : 'موظف استقبال'}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className={`w-full flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-medium transition-all cursor-pointer ${
              !sidebarOpen ? 'md:px-0' : ''
            }`}
            style={{
              background: 'rgba(244, 63, 94, 0.08)',
              color: 'var(--color-danger)',
            }}
          >
            <LogOut size={15} className="min-w-[15px]" />
            <span className={`whitespace-nowrap ${!sidebarOpen ? 'md:hidden' : ''}`}>تسجيل الخروج</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main
        className={`transition-all duration-300 print:mr-0 mr-0 ${
          sidebarOpen ? 'md:mr-64' : 'md:mr-[72px]'
        }`}
      >
        {/* Top Bar */}
        <header
          className="sticky top-0 z-20 h-14 flex items-center justify-between px-4 sm:px-6 no-print"
          style={{
            background: 'var(--bg-primary)',
            borderBottom: '1px solid var(--border-color)',
          }}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="-mr-2 p-1.5 rounded-lg md:hidden cursor-pointer"
              style={{ color: 'var(--text-muted)' }}
            >
              <Menu size={20} />
            </button>
            <h1 className="text-sm sm:text-base font-display font-bold truncate" style={{ color: 'var(--text-primary)' }}>
              نظام إدارة مركز مكانك سيرفس
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <span
              className="text-[10px] sm:text-xs px-2.5 py-1 rounded-full font-medium font-mono-code"
              style={{
                background: 'var(--color-accent-soft)',
                color: 'var(--color-accent)',
              }}
            >
              {user?.role === 'Admin' ? 'ADMIN' : 'STAFF'}
            </span>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-4 sm:p-6 print:p-0">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

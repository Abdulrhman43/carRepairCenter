import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { Car, Mail, Lock, Eye, EyeOff, Sun, Moon, Wrench, Shield, Gauge } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch {
      setError('البريد الإلكتروني أو كلمة المرور غير صحيحة');
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: Wrench, label: 'إدارة أوامر الصيانة' },
    { icon: Shield, label: 'تتبع المدفوعات والمخزون' },
    { icon: Gauge, label: 'تقارير يومية وإحصائيات' },
  ];

  return (
    <div className="min-h-screen flex" dir="rtl" style={{ background: 'var(--bg-primary)' }}>
      {/* Theme toggle - floating */}
      <button
        onClick={toggleTheme}
        className="fixed top-4 left-4 z-50 w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-all"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          color: 'var(--color-accent)',
          boxShadow: '0 4px 12px var(--shadow-color)',
        }}
      >
        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      {/* Left Panel — Branding */}
      <div
        className="hidden lg:flex lg:w-[45%] flex-col items-center justify-center p-12 relative overflow-hidden"
        style={{ background: 'var(--color-accent)' }}
      >
        {/* Decorative geometric shapes */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full opacity-10" style={{ background: 'white' }} />
          <div className="absolute -bottom-32 -left-16 w-80 h-80 rounded-full opacity-[0.07]" style={{ background: 'white' }} />
          <div className="absolute top-1/2 right-1/4 w-40 h-40 rotate-45 opacity-[0.05]" style={{ background: 'white' }} />
          {/* Diagonal lines pattern */}
          <svg className="absolute inset-0 w-full h-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="diag" width="40" height="40" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <line x1="0" y1="0" x2="0" y2="40" stroke="white" strokeWidth="2" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#diag)" />
          </svg>
        </div>

        <div className="relative z-10 text-center max-w-sm">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-6 animate-page-enter">
            <Car size={40} className="text-white" />
          </div>
          <h1 className="text-3xl font-display font-bold text-white mb-3 animate-page-enter" style={{ animationDelay: '80ms' }}>
            مكانك سيرفس
          </h1>
          <p className="text-white/70 text-sm leading-relaxed mb-10 animate-page-enter" style={{ animationDelay: '160ms' }}>
            نظام متكامل لإدارة مركز صيانة السيارات — تتبع الأوامر والمدفوعات والمخزون بكفاءة عالية
          </p>

          <div className="space-y-4">
            {features.map((f, i) => (
              <div
                key={f.label}
                className="flex items-center gap-3 text-right bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 animate-page-enter"
                style={{ animationDelay: `${240 + i * 80}ms` }}
              >
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                  <f.icon size={16} className="text-white" />
                </div>
                <span className="text-white/90 text-sm font-medium">{f.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel — Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md animate-page-enter">
          {/* Mobile logo */}
          <div className="text-center mb-8 lg:hidden">
            <div
              className="w-14 h-14 mx-auto rounded-xl flex items-center justify-center mb-3"
              style={{ background: 'var(--color-accent)' }}
            >
              <Car size={28} className="text-white" />
            </div>
            <h1 className="text-xl font-display font-bold" style={{ color: 'var(--color-accent)' }}>
              مكانك سيرفس
            </h1>
          </div>

          <div className="mk-card p-8" style={{ borderRadius: 'calc(var(--radius) * 2)' }}>
            <div className="mb-6">
              <h2 className="text-xl font-display font-bold" style={{ color: 'var(--text-primary)' }}>
                تسجيل الدخول
              </h2>
              <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                أدخل بياناتك للوصول إلى لوحة التحكم
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>البريد الإلكتروني</label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="name@example.com"
                    className="mk-input pr-10 pl-4"
                    style={{ direction: 'ltr', textAlign: 'right' }}
                  />
                  <Mail size={17} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>كلمة المرور</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="mk-input pr-10 pl-10"
                    style={{ direction: 'ltr', textAlign: 'right' }}
                  />
                  <Lock size={17} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 cursor-pointer"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              {error && (
                <div
                  className="text-sm rounded-lg px-4 py-2.5 text-center font-medium"
                  style={{
                    background: 'rgba(244, 63, 94, 0.08)',
                    color: 'var(--color-danger)',
                    border: '1px solid rgba(244, 63, 94, 0.15)',
                  }}
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="mk-btn mk-btn-primary w-full mt-2 py-3 text-base disabled:opacity-60"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    جاري التحميل...
                  </span>
                ) : (
                  'تسجيل الدخول'
                )}
              </button>
            </form>

            {/* Demo credentials */}
            <div
              className="mt-6 p-4 rounded-xl text-center"
              style={{
                background: 'var(--bg-input)',
                border: '1px solid var(--border-color)',
              }}
            >
              <p className="text-[11px] font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>بيانات تجريبية</p>
              <p className="text-xs font-mono-code" style={{ color: 'var(--text-secondary)' }}>
                مدير: admin@makanak.com | Admin@123
              </p>
              <p className="text-xs font-mono-code mt-1" style={{ color: 'var(--text-secondary)' }}>
                استقبال: reception@makanak.com | Reception@123
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

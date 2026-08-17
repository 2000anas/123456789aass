import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/Button';
import { Field, Input } from '../components/Field';
import { t } from '../i18n';
import { handleApiError } from '../services/api';

export default function LoginPage() {
  const { login, user, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@example.com');
  const [password, setPassword] = useState('change-me');
  const [submitting, setSubmitting] = useState(false);

  if (!loading && user) {
    return <Navigate to={user.role === 'admin' ? '/dashboard' : '/employee/dashboard'} replace />;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const loggedIn = await login(email, password);
      toast.success(t('successLogin'));
      navigate(loggedIn.role === 'admin' ? '/dashboard' : '/employee/dashboard');
    } catch (error) {
      handleApiError(error);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-page">
      <section className="login-visual">
        <h1>
          Marketing & Software <span>Solutions</span>
        </h1>
        <p>
          نظام إليبتك لإدارة التدفق النقدي وحضور الموظفين — بسيط، احترافي، وسهل الاستخدام.
        </p>
      </section>
      <section className="login-panel">
        <div className="login-box fade-up">
          <div className="brand-row">
            <span className="logo-mark" style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--brand)', display: 'inline-block' }} />
            ELYPTEK
          </div>
          <h2 style={{ margin: '0 0 8px' }}>{t('welcomeBack')}</h2>
          <p style={{ color: 'var(--muted)', marginTop: 0 }}>{t('loginHint')}</p>
          <form onSubmit={onSubmit}>
            <Field label={t('email')}>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="username"
              />
            </Field>
            <Field label={t('password')}>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </Field>
            <Button type="submit" block disabled={submitting} style={{ marginTop: 8 }}>
              {submitting ? t('loading') : t('login')}
            </Button>
          </form>
          <p style={{ marginTop: 18, fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>
            حساب التطوير: admin@example.com / change-me
            <br />
            يجب تغيير كلمة المرور في بيئة الإنتاج.
          </p>
        </div>
      </section>
    </div>
  );
}

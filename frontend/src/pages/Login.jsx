import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function Login() {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({
    fullName: '', email: '', password: '', phone: '', role: 'customer',
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const { login, register } = useAuth();
  const navigate = useNavigate();

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  async function submit() {
    setError('');
    setBusy(true);
    try {
      const user = mode === 'login'
        ? await login(form.email, form.password)
        : await register(form);
      navigate(user.role === 'owner' ? '/owner' : '/');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const field = 'w-full rounded-xl border border-line bg-page px-3.5 py-2.5 text-sm outline-none transition placeholder:text-muted/70 focus:border-sage-300 focus:bg-card';

  return (
    <div className="min-h-screen bg-page">
      <div className="mx-auto grid min-h-screen max-w-6xl lg:grid-cols-2">
        {/* Left — the pitch */}
        <div className="hidden flex-col justify-center bg-mist px-12 lg:flex">
          <div className="mb-8 inline-flex items-center gap-2.5">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-sage-500 font-display text-lg font-bold text-white">
              D
            </span>
            <span className="font-display text-2xl font-bold tracking-tight">DineHub</span>
          </div>

          <h1 className="font-display text-4xl font-bold leading-tight tracking-tight">
            Food from your
            <br />
            neighbourhood kitchens
          </h1>

          <p className="mt-4 max-w-sm leading-relaxed text-sage-700">
            Order from several restaurants at once, follow each order from the
            kitchen to your door, and pay when it arrives.
          </p>

          <ul className="mt-8 space-y-3 text-sm text-sage-700">
            {[
              'Mix dishes from different restaurants in one basket',
              'Track every order step by step',
              'Restaurant owners manage their own menu and queue',
            ].map((line) => (
              <li key={line} className="flex items-start gap-2.5">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sage-500" />
                {line}
              </li>
            ))}
          </ul>
        </div>

        {/* Right — the form */}
        <div className="flex items-center justify-center px-5 py-12">
          <div className="w-full max-w-sm">
            <div className="mb-8 lg:hidden">
              <div className="inline-flex items-center gap-2">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-sage-500 font-display font-bold text-white">
                  D
                </span>
                <span className="font-display text-xl font-bold tracking-tight">DineHub</span>
              </div>
            </div>

            <h2 className="font-display text-2xl font-bold tracking-tight">
              {mode === 'login' ? 'Welcome back' : 'Create your account'}
            </h2>
            <p className="mb-6 mt-1 text-sm text-muted">
              {mode === 'login'
                ? 'Log in to pick up where you left off.'
                : 'It takes about a minute.'}
            </p>

            <div className="mb-6 flex rounded-xl bg-mist p-1">
              {[
                { k: 'login', l: 'Log in' },
                { k: 'register', l: 'Sign up' },
              ].map((m) => (
                <button
                  key={m.k}
                  onClick={() => { setMode(m.k); setError(''); }}
                  className={`flex-1 rounded-lg py-2 text-sm transition ${
                    mode === m.k
                      ? 'bg-card font-semibold text-ink shadow-sm'
                      : 'text-sage-700 hover:text-ink'
                  }`}
                >
                  {m.l}
                </button>
              ))}
            </div>

            {error && (
              <div className="mb-4 rounded-xl bg-clay-bg px-3.5 py-2.5 text-sm text-clay-ink">
                {error}
              </div>
            )}

            <div className="space-y-4">
              {mode === 'register' && (
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">
                    Full name
                  </label>
                  <input
                    value={form.fullName}
                    onChange={(e) => set('fullName', e.target.value)}
                    className={field}
                    placeholder="Ayesha Khan"
                  />
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">
                  Email
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => set('email', e.target.value)}
                  className={field}
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">
                  Password
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => set('password', e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && submit()}
                  className={field}
                  placeholder={mode === 'register' ? 'At least 6 characters' : '••••••••'}
                />
              </div>

              {mode === 'register' && (
                <>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">
                      Phone <span className="font-normal normal-case">(optional)</span>
                    </label>
                    <input
                      value={form.phone}
                      onChange={(e) => set('phone', e.target.value)}
                      className={field}
                      placeholder="0300-1234567"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">
                      I'm here to
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { v: 'customer', l: 'Order food', hint: 'Browse and order' },
                        { v: 'owner', l: 'Run a restaurant', hint: 'Manage a menu' },
                      ].map((o) => (
                        <button
                          key={o.v}
                          onClick={() => set('role', o.v)}
                          className={`rounded-xl border px-3 py-3 text-left transition ${
                            form.role === o.v
                              ? 'border-sage-300 bg-sage-50'
                              : 'border-line hover:border-sage-200'
                          }`}
                        >
                          <span
                            className={`block text-sm font-semibold ${
                              form.role === o.v ? 'text-sage-700' : ''
                            }`}
                          >
                            {o.l}
                          </span>
                          <span className="mt-0.5 block text-xs text-muted">{o.hint}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={submit}
              disabled={busy}
              className="mt-6 w-full rounded-xl bg-sage-500 py-3 text-sm font-semibold text-white transition hover:bg-sage-600 disabled:opacity-50"
            >
              {busy
                ? 'One moment…'
                : mode === 'login'
                  ? 'Log in'
                  : 'Create account'}
            </button>

            <p className="mt-5 text-center text-sm text-muted">
              {mode === 'login' ? "Don't have an account? " : 'Already have one? '}
              <button
                onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
                className="font-semibold text-sage-700 hover:underline"
              >
                {mode === 'login' ? 'Sign up' : 'Log in'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
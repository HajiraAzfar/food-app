import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import Layout from '../components/Layout';
import Tile from '../components/Tile';

const EMPTY = { title: '', cuisine: '', address: '', about: '' };

export default function OwnerDashboard() {
  const [outlets, setOutlets] = useState(null);
  const [stats, setStats] = useState({});
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const list = await api.get('/outlets/mine');
      setOutlets(list);
      const entries = await Promise.all(
        list.map(async (o) => [o.id, await api.get(`/purchases/outlet/${o.id}/stats`)])
      );
      setStats(Object.fromEntries(entries));
    } catch (e) {
      setError(e.message);
      setOutlets([]);
    }
  }

  async function createOutlet() {
    setError('');
    if (!form.title.trim()) return setError('Enter a restaurant name.');
    setBusy(true);
    try {
      await api.post('/outlets', form);
      setForm(EMPTY);
      setCreating(false);
      load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function toggleOpen(outlet) {
    setError('');
    try {
      await api.put(`/outlets/${outlet.id}`, { ...outlet, is_open: !outlet.is_open });
      load();
    } catch (e) { setError(e.message); }
  }

  if (!outlets) {
    return (
      <Layout>
        <div className="mx-auto max-w-6xl space-y-4 px-5 py-8">
          <div className="h-8 w-52 animate-pulse rounded bg-line/60" />
          <div className="h-48 animate-pulse rounded-2xl bg-line/40" />
        </div>
      </Layout>
    );
  }

  // Roll every outlet's numbers into one line for the top of the page
  const totals = Object.values(stats).reduce(
    (a, s) => ({
      orders: a.orders + (s.orders_today || 0),
      revenue: a.revenue + Number(s.revenue_today || 0),
      pending: a.pending + (s.pending_orders || 0),
    }),
    { orders: 0, revenue: 0, pending: 0 }
  );

  const field = 'w-full rounded-xl border border-line bg-page px-3.5 py-2.5 text-sm outline-none transition placeholder:text-muted/70 focus:border-sage-300 focus:bg-card';

  return (
    <Layout>
      {/* Today band */}
      <section className="border-b border-line bg-mist">
        <div className="mx-auto max-w-6xl px-5 py-8">
          <h1 className="font-display text-3xl font-bold tracking-tight">Today</h1>
          <p className="mt-1 text-sage-700">
            {outlets.length === 0
              ? 'Set up your first restaurant to start taking orders.'
              : totals.pending > 0
                ? `${totals.pending} ${totals.pending === 1 ? 'order needs' : 'orders need'} your attention.`
                : 'All caught up — no orders waiting.'}
          </p>

          {outlets.length > 0 && (
            <div className="mt-6 grid max-w-2xl grid-cols-3 gap-3">
              {[
                { label: 'Orders today', value: totals.orders },
                { label: 'Revenue today', value: `Rs ${totals.revenue}` },
                { label: 'Awaiting you', value: totals.pending },
              ].map((m) => (
                <div key={m.label} className="rounded-xl bg-card px-4 py-3.5 shadow-card">
                  <p className="text-xs font-medium text-muted">{m.label}</p>
                  <p className="mt-1 font-display text-2xl font-bold text-sage-700">{m.value}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-5 py-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <h2 className="font-display text-xl font-bold">Your restaurants</h2>
          <button
            onClick={() => { setCreating(!creating); setError(''); }}
            className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition ${
              creating
                ? 'border border-line bg-card text-muted hover:text-ink'
                : 'bg-sage-500 text-white hover:bg-sage-600'
            }`}
          >
            {creating ? 'Cancel' : 'Add restaurant'}
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-xl bg-clay-bg px-4 py-3 text-sm text-clay-ink">{error}</div>
        )}

        {creating && (
          <div className="mb-6 rounded-2xl border border-sage-300 bg-card p-6 shadow-card">
            <h3 className="mb-4 font-display text-lg font-bold">New restaurant</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                className={field} placeholder="Restaurant name" />
              <input value={form.cuisine} onChange={(e) => setForm({ ...form, cuisine: e.target.value })}
                className={field} placeholder="Cuisine, e.g. Pakistani" />
              <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
                className={`${field} sm:col-span-2`} placeholder="Address" />
              <textarea value={form.about} onChange={(e) => setForm({ ...form, about: e.target.value })}
                rows={2} className={`${field} resize-none sm:col-span-2`}
                placeholder="One or two lines about the place" />
            </div>
            <button onClick={createOutlet} disabled={busy}
              className="mt-4 rounded-xl bg-sage-500 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-sage-600 disabled:opacity-50">
              {busy ? 'Creating…' : 'Create restaurant'}
            </button>
          </div>
        )}

        {outlets.length === 0 && !creating && (
          <div className="rounded-2xl border border-line bg-card py-20 text-center shadow-card">
            <p className="mb-1 font-semibold">No restaurants yet</p>
            <p className="text-sm text-muted">Use the button above to add your first one.</p>
          </div>
        )}

        <div className="grid gap-5 lg:grid-cols-2">
          {outlets.map((o) => {
            const s = stats[o.id] || {};
            return (
              <div key={o.id} className="overflow-hidden rounded-2xl border border-line bg-card shadow-card">
                <div className="flex gap-4 p-5">
                  <Tile name={o.title} className="h-14 w-14 shrink-0" rounded="rounded-xl" />

                  <div className="min-w-0 flex-1">
                    <h3 className="font-display text-lg font-bold leading-snug">{o.title}</h3>
                    <p className="mt-0.5 truncate text-sm text-muted">
                      {o.cuisine} · {o.address}
                    </p>
                  </div>

                  <button
                    onClick={() => toggleOpen(o)}
                    className={`h-fit shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                      o.is_open
                        ? 'bg-sage-100 text-sage-700 hover:bg-sage-200'
                        : 'border border-line text-muted hover:border-sage-300'
                    }`}
                  >
                    {o.is_open ? 'Open' : 'Closed'}
                  </button>
                </div>

                <div className="grid grid-cols-3 divide-x divide-line border-y border-line">
                  {[
                    { label: 'Orders', value: s.orders_today ?? '—' },
                    { label: 'Revenue', value: s.revenue_today != null ? `Rs ${s.revenue_today}` : '—' },
                    { label: 'Waiting', value: s.pending_orders ?? '—' },
                  ].map((m) => (
                    <div key={m.label} className="px-4 py-3 text-center">
                      <p className="text-xs text-muted">{m.label}</p>
                      <p className="mt-0.5 font-semibold text-sage-700">{m.value}</p>
                    </div>
                  ))}
                </div>

                {s.top_dishes?.length > 0 && (
                  <p className="border-b border-line px-5 py-3 text-xs text-muted">
                    Best sellers: {s.top_dishes.slice(0, 3).map((d) => d.dish_title).join(', ')}
                  </p>
                )}

                <div className="flex gap-2 p-4">
                  <Link
                    to={`/owner/${o.id}/orders`}
                    className="flex-1 rounded-xl bg-sage-500 px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-sage-600"
                  >
                    Orders
                    {s.pending_orders > 0 && (
                      <span className="ml-1.5 rounded-full bg-white/25 px-1.5 py-0.5 text-xs">
                        {s.pending_orders}
                      </span>
                    )}
                  </Link>
                  <Link
                    to={`/owner/${o.id}/menu`}
                    className="flex-1 rounded-xl border border-line px-4 py-2.5 text-center text-sm font-semibold transition hover:border-sage-300"
                  >
                    Menu
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Layout>
  );
}
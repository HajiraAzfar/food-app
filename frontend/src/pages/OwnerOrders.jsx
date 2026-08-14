import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api';
import Layout from '../components/Layout';
import StatusChip from '../components/StatusChip';

/* Which button appears next — mirrors the backend's allowed transitions,
   so the owner is never shown a move the server would reject. */
const NEXT = {
  pending:          [{ to: 'accepted', label: 'Accept', primary: true }, { to: 'rejected', label: 'Decline' }],
  accepted:         [{ to: 'preparing', label: 'Start cooking', primary: true }],
  preparing:        [{ to: 'out_for_delivery', label: 'Send out', primary: true }],
  out_for_delivery: [{ to: 'delivered', label: 'Mark delivered', primary: true }],
};

/* Three buckets, because they mean three different things to the owner:
   work to do, money earned, and orders that never happened. */
const LIVE    = ['pending', 'accepted', 'preparing', 'out_for_delivery'];
const DONE    = ['delivered'];
const DROPPED = ['rejected', 'cancelled'];

function timeAgo(iso) {
  const mins = Math.floor((Date.now() - new Date(iso)) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export default function OwnerOrders() {
  const { outletId } = useParams();
  const [orders, setOrders] = useState(null);
  const [tab, setTab] = useState('live');
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const timer = useRef(null);

  useEffect(() => { load(); }, [outletId]);

  // New orders should show up without the owner refreshing
  useEffect(() => {
    timer.current = setInterval(load, 20000);
    return () => clearInterval(timer.current);
  }, [outletId]);

  function load() {
    api.get(`/purchases/outlet/${outletId}`)
      .then(setOrders)
      .catch((e) => { setError(e.message); setOrders([]); });
  }

  async function move(orderId, status) {
    setError('');
    setBusyId(orderId);
    try {
      await api.put(`/purchases/${orderId}/status`, { status });
      load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusyId(null);
    }
  }

  if (!orders) {
    return (
      <Layout>
        <div className="mx-auto max-w-6xl space-y-3 px-5 py-8">
          <div className="h-8 w-40 animate-pulse rounded bg-line/60" />
          {[0, 1].map((i) => <div key={i} className="h-44 animate-pulse rounded-2xl bg-line/40" />)}
        </div>
      </Layout>
    );
  }

  const TABS = {
    live: {
      label: 'In progress',
      list: orders.filter((o) => LIVE.includes(o.status)),
      empty: 'No orders in progress',
      hint: 'New orders appear here automatically.',
    },
    done: {
      label: 'Completed',
      list: orders.filter((o) => DONE.includes(o.status)),
      empty: 'Nothing delivered yet',
      hint: 'Orders you deliver will be listed here.',
    },
    dropped: {
      label: 'Declined',
      list: orders.filter((o) => DROPPED.includes(o.status)),
      empty: 'Nothing declined',
      hint: 'Orders you decline, or customers cancel, land here.',
    },
  };

  const visible = TABS[tab].list;

  return (
    <Layout>
      <div className="mx-auto max-w-6xl px-5 py-8">
        <Link to="/owner" className="mb-6 inline-block text-sm text-muted hover:text-sage-600">
          ← Dashboard
        </Link>

        <h1 className="mb-6 font-display text-3xl font-bold tracking-tight">Orders</h1>

        <div className="mb-6 flex flex-wrap gap-2">
          {Object.entries(TABS).map(([key, t]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                tab === key
                  ? 'bg-sage-500 text-white'
                  : 'border border-line bg-card text-muted hover:border-sage-300'
              }`}
            >
              {t.label}
              <span className={`ml-1.5 ${tab === key ? 'opacity-75' : ''}`}>
                {t.list.length}
              </span>
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-6 rounded-xl bg-clay-bg px-4 py-3 text-sm text-clay-ink">{error}</div>
        )}

        {visible.length === 0 ? (
          <div className="rounded-2xl border border-line bg-card py-20 text-center shadow-card">
            <p className="mb-1 font-semibold">{TABS[tab].empty}</p>
            <p className="text-sm text-muted">{TABS[tab].hint}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {visible.map((o) => (
              <div
                key={o.id}
                className={`overflow-hidden rounded-2xl border bg-card shadow-card ${
                  o.status === 'pending' ? 'border-honey-ink/30' : 'border-line'
                } ${busyId === o.id ? 'opacity-60' : ''}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-4">
                  <div>
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <h2 className="font-display text-lg font-bold">Order #{o.id}</h2>
                      <StatusChip status={o.status} />
                      <span className="text-xs text-muted">{timeAgo(o.created_at)}</span>
                    </div>
                    <p className="text-sm text-muted">
                      {o.customer_name}
                      {o.customer_phone && ` · ${o.customer_phone}`}
                    </p>
                  </div>
                  <p className="font-display text-xl font-bold text-sage-700">
                    Rs {o.grand_total}
                  </p>
                </div>

                <div className="divide-y divide-line/70">
                  {o.items?.map((i) => (
                    <div key={i.id} className="flex justify-between gap-4 px-5 py-2.5 text-sm">
                      <span>
                        <span className="font-semibold text-sage-700">{i.quantity}×</span>{' '}
                        {i.dish_title}
                        {i.note && <span className="text-muted"> — {i.note}</span>}
                      </span>
                      <span className="shrink-0 text-muted">Rs {i.line_total}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-line bg-page px-5 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                    Deliver to
                  </p>
                  <p className="mt-0.5 text-sm">{o.delivery_address}</p>
                </div>

                <div className="flex flex-wrap gap-2 p-4">
                  {(NEXT[o.status] || []).map((action) => (
                    <button
                      key={action.to}
                      onClick={() => move(o.id, action.to)}
                      disabled={busyId === o.id}
                      className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition disabled:opacity-50 ${
                        action.primary
                          ? 'bg-sage-500 text-white hover:bg-sage-600'
                          : 'border border-line text-muted hover:border-clay-ink/30 hover:text-clay-ink'
                      }`}
                    >
                      {action.label}
                    </button>
                  ))}
                  {!NEXT[o.status] && (
                    <p className="px-1 py-2 text-sm text-muted">
                      {o.status === 'delivered'
                        ? 'Delivered — nothing left to do.'
                        : o.status === 'cancelled'
                          ? 'The customer cancelled this order.'
                          : 'You declined this order.'}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
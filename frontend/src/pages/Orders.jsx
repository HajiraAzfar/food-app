import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import Layout from '../components/Layout';
import Tile from '../components/Tile';
import StatusChip from '../components/StatusChip';

const LIVE = ['pending', 'accepted', 'preparing', 'out_for_delivery'];

function formatDate(iso) {
  return new Date(iso).toLocaleString('en-GB', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

export default function Orders() {
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/purchases/mine').then(setOrders).catch((e) => setError(e.message));
  }, []);

  if (!orders) {
    return (
      <Layout>
        <div className="mx-auto max-w-6xl space-y-3 px-5 py-8">
          <div className="mb-6 h-8 w-40 animate-pulse rounded bg-line/60" />
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-line/40" />
          ))}
        </div>
      </Layout>
    );
  }

  const active = orders.filter((o) => LIVE.includes(o.status));
  const past = orders.filter((o) => !LIVE.includes(o.status));

  function Card({ o }) {
    return (
      <Link
        to={`/orders/${o.id}`}
        className="flex items-center gap-4 rounded-2xl border border-line bg-card p-4 shadow-card transition hover:shadow-lift"
      >
        <Tile name={o.outlet_title} className="h-14 w-14 shrink-0" rounded="rounded-xl" />

        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <h3 className="font-display text-lg font-bold leading-snug">{o.outlet_title}</h3>
            <StatusChip status={o.status} />
          </div>
          <p className="text-sm text-muted">
            Order #{o.id} · {formatDate(o.created_at)}
          </p>
        </div>

        <div className="shrink-0 text-right">
          <p className="font-semibold text-sage-700">Rs {o.grand_total}</p>
          <p className="mt-0.5 text-xs text-muted">View →</p>
        </div>
      </Link>
    );
  }

  return (
    <Layout>
      <div className="mx-auto max-w-6xl px-5 py-8">
        <h1 className="mb-8 font-display text-3xl font-bold tracking-tight">Your orders</h1>

        {error && (
          <div className="mb-6 rounded-xl bg-clay-bg px-4 py-3 text-sm text-clay-ink">{error}</div>
        )}

        {orders.length === 0 ? (
          <div className="rounded-2xl border border-line bg-card py-20 text-center shadow-card">
            <p className="mb-1 font-semibold">No orders yet</p>
            <p className="mb-6 text-sm text-muted">
              Everything you order will show up here.
            </p>
            <Link
              to="/"
              className="inline-block rounded-xl bg-sage-500 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-sage-600"
            >
              Browse restaurants
            </Link>
          </div>
        ) : (
          <>
            {active.length > 0 && (
              <section className="mb-10">
                <h2 className="mb-4 flex items-center gap-2 font-display text-xl font-bold">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-sage-500" />
                  In progress
                </h2>
                <div className="space-y-3">
                  {active.map((o) => <Card key={o.id} o={o} />)}
                </div>
              </section>
            )}

            {past.length > 0 && (
              <section>
                <h2 className="mb-4 font-display text-xl font-bold">Past orders</h2>
                <div className="space-y-3">
                  {past.map((o) => <Card key={o.id} o={o} />)}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
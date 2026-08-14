import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../api';
import Layout from '../components/Layout';
import Tile from '../components/Tile';

export default function Basket() {
  const [basket, setBasket] = useState(null);
  const [address, setAddress] = useState('');
  const [payment, setPayment] = useState('cash');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [busyItem, setBusyItem] = useState(null);
  const navigate = useNavigate();

  useEffect(() => { load(); }, []);

  function load() {
    api.get('/basket').then(setBasket).catch((e) => setError(e.message));
  }

  async function changeQty(itemId, quantity) {
    setError('');
    setBusyItem(itemId);
    try {
      setBasket(await api.put(`/basket/items/${itemId}`, { quantity }));
    } catch (e) {
      setError(e.message);
    } finally {
      setBusyItem(null);
    }
  }

  async function removeItem(itemId) {
    setError('');
    setBusyItem(itemId);
    try {
      setBasket(await api.del(`/basket/items/${itemId}`));
    } catch (e) {
      setError(e.message);
    } finally {
      setBusyItem(null);
    }
  }

  async function placeOrders() {
    setError('');
    if (!address.trim()) {
      setError('Add a delivery address to place your order.');
      return;
    }
    setBusy(true);
    try {
      const { orders } = await api.post('/purchases/checkout', {
        deliveryAddress: address,
        paymentMethod: payment,
      });
      // One restaurant → straight to tracking. Several → the orders list,
      // because there's no single order to land on.
      navigate(orders.length === 1 ? `/orders/${orders[0].id}` : '/orders');
    } catch (e) {
      setError(e.message);
      load();
    } finally {
      setBusy(false);
    }
  }

  if (!basket) {
    return (
      <Layout>
        <div className="mx-auto max-w-6xl px-5 py-8">
          <div className="h-8 w-40 animate-pulse rounded bg-line/60" />
          <div className="mt-6 h-24 animate-pulse rounded-2xl bg-line/40" />
        </div>
      </Layout>
    );
  }

  const groups = basket.groups || [];

  if (groups.length === 0) {
    return (
      <Layout>
        <div className="mx-auto max-w-6xl px-5 py-8">
          <h1 className="mb-8 font-display text-3xl font-bold tracking-tight">Your basket</h1>
          <div className="rounded-2xl border border-line bg-card py-20 text-center shadow-card">
            <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-sage-50 font-display text-2xl text-sage-500">
              ○
            </div>
            <p className="mb-1 font-semibold">Your basket is empty</p>
            <p className="mb-6 text-sm text-muted">
              Open a restaurant's menu and add something you like.
            </p>
            <Link
              to="/"
              className="inline-block rounded-xl bg-sage-500 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-sage-600"
            >
              Browse restaurants
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  const unavailable = groups.flatMap((g) => g.items.filter((i) => !i.is_available));
  const closed = groups.filter((g) => !g.outletIsOpen);
  const blocked = unavailable.length > 0 || closed.length > 0;

  return (
    <Layout>
      <div className="mx-auto max-w-6xl px-5 py-8">
        <h1 className="font-display text-3xl font-bold tracking-tight">Your basket</h1>
        <p className="mb-8 mt-1 text-muted">
          {basket.itemCount} {basket.itemCount === 1 ? 'item' : 'items'} from{' '}
          {groups.length} {groups.length === 1 ? 'restaurant' : 'restaurants'}
        </p>

        {error && (
          <div className="mb-6 rounded-xl bg-clay-bg px-4 py-3 text-sm text-clay-ink">{error}</div>
        )}

        {unavailable.length > 0 && (
          <div className="mb-4 rounded-xl bg-honey-bg px-4 py-3 text-sm text-honey-ink">
            {unavailable.map((i) => i.title).join(', ')}{' '}
            {unavailable.length === 1 ? 'is' : 'are'} sold out. Remove{' '}
            {unavailable.length === 1 ? 'it' : 'them'} to continue.
          </div>
        )}

        {closed.length > 0 && (
          <div className="mb-4 rounded-xl bg-honey-bg px-4 py-3 text-sm text-honey-ink">
            {closed.map((g) => g.outletTitle).join(', ')}{' '}
            {closed.length === 1 ? 'is' : 'are'} closed right now.
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[1fr_22rem] lg:items-start">
          {/* One card per restaurant */}
          <div className="space-y-5">
            {groups.map((g) => (
              <div key={g.outletId} className="overflow-hidden rounded-2xl border border-line bg-card shadow-card">
                <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <Tile name={g.outletTitle} className="h-9 w-9" rounded="rounded-lg" />
                    <div>
                      <Link
                        to={`/outlets/${g.outletId}`}
                        className="font-display font-bold hover:text-sage-700"
                      >
                        {g.outletTitle}
                      </Link>
                      {!g.outletIsOpen && (
                        <p className="text-xs font-medium text-honey-ink">Closed right now</p>
                      )}
                    </div>
                  </div>
                  <p className="shrink-0 text-sm font-semibold text-sage-700">
                    Rs {g.subtotal}
                  </p>
                </div>

                <div className="divide-y divide-line">
                  {g.items.map((i) => (
                    <div
                      key={i.id}
                      className={`flex gap-4 p-4 ${busyItem === i.id ? 'opacity-60' : ''}`}
                    >
                      <Tile name={i.title} className="h-14 w-14 shrink-0" rounded="rounded-xl" />

                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold leading-snug">{i.title}</h3>
                        <p className="mt-0.5 text-sm text-muted">Rs {i.price} each</p>
                        {!i.is_available && (
                          <p className="mt-1 text-xs font-medium text-honey-ink">Sold out</p>
                        )}

                        <div className="mt-3 flex items-center gap-3">
                          <div className="flex items-center rounded-lg border border-line">
                            <button
                              onClick={() => changeQty(i.id, i.quantity - 1)}
                              disabled={busyItem === i.id}
                              className="h-8 w-8 rounded-l-lg text-muted transition hover:bg-sage-50 hover:text-sage-700 disabled:opacity-40"
                              aria-label="Decrease quantity"
                            >
                              −
                            </button>
                            <span className="w-9 text-center text-sm font-semibold">{i.quantity}</span>
                            <button
                              onClick={() => changeQty(i.id, i.quantity + 1)}
                              disabled={busyItem === i.id}
                              className="h-8 w-8 rounded-r-lg text-muted transition hover:bg-sage-50 hover:text-sage-700 disabled:opacity-40"
                              aria-label="Increase quantity"
                            >
                              +
                            </button>
                          </div>

                          <button
                            onClick={() => removeItem(i.id)}
                            disabled={busyItem === i.id}
                            className="text-sm text-muted transition hover:text-clay-ink disabled:opacity-40"
                          >
                            Remove
                          </button>
                        </div>
                      </div>

                      <p className="shrink-0 font-semibold text-sage-700">Rs {i.line_total}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="rounded-2xl border border-line bg-card p-6 shadow-card lg:sticky lg:top-24">
            <h2 className="mb-5 font-display text-lg font-bold">Order summary</h2>

            <div className="mb-5 space-y-2 border-b border-line pb-5 text-sm">
              {groups.map((g) => (
                <div key={g.outletId} className="flex justify-between gap-3 text-muted">
                  <span className="truncate">{g.outletTitle}</span>
                  <span className="shrink-0">Rs {g.subtotal}</span>
                </div>
              ))}
              <div className="flex justify-between text-muted">
                <span>Delivery</span>
                <span className="text-sage-700">Free</span>
              </div>
            </div>

            <div className="mb-5 flex items-baseline justify-between">
              <span className="font-semibold">Total</span>
              <span className="font-display text-2xl font-bold text-sage-700">
                Rs {basket.total}
              </span>
            </div>

            {groups.length > 1 && (
              <p className="mb-5 rounded-xl bg-sage-50 px-3.5 py-2.5 text-xs leading-relaxed text-sage-700">
                This will place {groups.length} separate orders — one per restaurant.
                Each is cooked and delivered on its own, so they may arrive at
                different times.
              </p>
            )}

            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">
              Delivery address
            </label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={3}
              placeholder="House number, street, area"
              className="mb-5 w-full resize-none rounded-xl border border-line bg-page px-3.5 py-2.5 text-sm outline-none transition placeholder:text-muted/70 focus:border-sage-300 focus:bg-card"
            />

            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">
              Payment
            </label>
            <div className="mb-6 space-y-2">
              {[
                { v: 'cash', l: 'Cash on delivery' },
                { v: 'card', l: 'Card on delivery' },
              ].map((p) => (
                <button
                  key={p.v}
                  onClick={() => setPayment(p.v)}
                  className={`flex w-full items-center gap-3 rounded-xl border px-3.5 py-2.5 text-sm transition ${
                    payment === p.v
                      ? 'border-sage-300 bg-sage-50 font-medium text-sage-700'
                      : 'border-line text-muted hover:border-sage-200'
                  }`}
                >
                  <span
                    className={`h-4 w-4 shrink-0 rounded-full border-2 ${
                      payment === p.v ? 'border-sage-500 bg-sage-500' : 'border-line'
                    }`}
                  />
                  {p.l}
                </button>
              ))}
            </div>

            <button
              onClick={placeOrders}
              disabled={busy || blocked}
              className="w-full rounded-xl bg-sage-500 py-3 text-sm font-semibold text-white transition hover:bg-sage-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy
                ? 'Placing orders…'
                : groups.length > 1
                  ? `Place ${groups.length} orders · Rs ${basket.total}`
                  : `Place order · Rs ${basket.total}`}
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
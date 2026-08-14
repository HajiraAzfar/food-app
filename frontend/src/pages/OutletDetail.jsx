import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api';
import Layout from '../components/Layout';
import Tile from '../components/Tile';

export default function OutletDetail() {
  const { id } = useParams();
  const [outlet, setOutlet] = useState(null);
  const [dishes, setDishes] = useState([]);
  const [basket, setBasket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [addingId, setAddingId] = useState(null);
  const [activeCategory, setActiveCategory] = useState('');
  const sectionRefs = useRef({});

  useEffect(() => {
    Promise.all([
      api.get(`/outlets/${id}`),
      api.get(`/dishes/outlet/${id}`),
      api.get('/basket').catch(() => null),
    ])
      .then(([o, d, b]) => { setOutlet(o); setDishes(d); setBasket(b); })
      .catch((err) => setToast({ kind: 'error', text: err.message }))
      .finally(() => setLoading(false));
  }, [id]);

  // Auto-dismiss the toast so it doesn't linger over the menu
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  async function addToBasket(dish) {
    setAddingId(dish.id);
    try {
      const result = await api.post('/basket/items', { dishId: dish.id, quantity: 1 });
      setBasket(result);
      setToast({
        kind: 'ok',
        text: result.cleared
          ? `Added ${dish.title}. Your basket had items from another restaurant, so we cleared it.`
          : `Added ${dish.title}`,
      });
    } catch (err) {
      setToast({ kind: 'error', text: err.message });
    } finally {
      setAddingId(null);
    }
  }

  function scrollTo(category) {
    setActiveCategory(category);
    sectionRefs.current[category]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  if (loading) {
    return (
      <Layout>
        <div className="mx-auto max-w-6xl px-5 py-8">
          <div className="mb-6 h-44 animate-pulse rounded-2xl bg-line/50" />
          <div className="space-y-3">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-2xl bg-line/40" />
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  if (!outlet) {
    return (
      <Layout>
        <div className="mx-auto max-w-6xl px-5 py-20 text-center">
          <p className="mb-4">We couldn't find that restaurant.</p>
          <Link to="/" className="rounded-lg bg-sage-500 px-5 py-2.5 text-sm font-semibold text-white">
            Back to restaurants
          </Link>
        </div>
      </Layout>
    );
  }

  const grouped = dishes.reduce((acc, d) => {
    const key = d.category || 'Other';
    (acc[key] = acc[key] || []).push(d);
    return acc;
  }, {});
  const categories = Object.keys(grouped);
  const basketCount = basket?.items?.reduce((n, i) => n + i.quantity, 0) || 0;

  return (
    <Layout>
      {/* Banner */}
      <div className="relative">
        <Tile name={outlet.title} className="h-44 sm:h-52" rounded="" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/70 to-transparent" />
        <div className="absolute inset-x-0 bottom-0">
          <div className="mx-auto max-w-6xl px-5 pb-5">
            <Link to="/" className="mb-3 inline-block text-sm text-white/80 hover:text-white">
              ← All restaurants
            </Link>
            <h1 className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
              {outlet.title}
            </h1>
          </div>
        </div>
      </div>

      <div className="border-b border-line bg-card">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-5 py-4 text-sm">
          {outlet.is_open ? (
            <span className="flex items-center gap-1.5 font-medium text-sage-700">
              <span className="h-2 w-2 rounded-full bg-sage-500" /> Open now
            </span>
          ) : (
            <span className="font-medium text-clay-ink">Closed right now</span>
          )}
          {outlet.cuisine && (
            <span className="rounded-md bg-sage-50 px-2 py-1 text-xs font-medium text-sage-700">
              {outlet.cuisine}
            </span>
          )}
          <span className="text-muted">{outlet.address}</span>
          <span className="text-muted">· {dishes.length} dishes</span>
        </div>
      </div>

      {outlet.about && (
        <div className="mx-auto max-w-6xl px-5 pt-6">
          <p className="max-w-2xl leading-relaxed text-muted">{outlet.about}</p>
        </div>
      )}

      {/* Sticky category nav — sits under the header */}
      {categories.length > 1 && (
        <div className="sticky top-[61px] z-10 border-b border-line bg-page/95 backdrop-blur">
          <div className="mx-auto flex max-w-6xl gap-2 overflow-x-auto px-5 py-3">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => scrollTo(c)}
                className={`shrink-0 rounded-full px-4 py-1.5 text-sm transition ${
                  activeCategory === c
                    ? 'bg-sage-500 font-medium text-white'
                    : 'border border-line bg-card text-muted hover:border-sage-300'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mx-auto max-w-6xl px-5 py-8 pb-28">
        {dishes.length === 0 && (
          <p className="py-12 text-center text-muted">
            This restaurant hasn't added any dishes yet.
          </p>
        )}

        {categories.map((category) => (
          <section
            key={category}
            ref={(el) => (sectionRefs.current[category] = el)}
            className="mb-10 scroll-mt-32"
          >
            <h2 className="mb-4 font-display text-xl font-bold">{category}</h2>

            <div className="grid gap-3 lg:grid-cols-2">
              {grouped[category].map((d) => (
                <div
                  key={d.id}
                  className="flex gap-4 rounded-2xl border border-line bg-card p-4 shadow-card transition hover:shadow-lift"
                >
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold leading-snug">{d.title}</h3>
                    {d.about && (
                      <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted">
                        {d.about}
                      </p>
                    )}
                    <p className="mt-2 font-semibold text-sage-700">Rs {d.price}</p>
                  </div>

                  <div className="flex flex-col items-end justify-between">
                    <Tile name={d.title} className="h-16 w-16 rounded-xl" rounded="rounded-xl" />
                    <button
                      onClick={() => addToBasket(d)}
                      disabled={!outlet.is_open || addingId === d.id}
                      className="mt-2 rounded-lg bg-sage-500 px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-sage-600 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {addingId === d.id ? '…' : 'Add'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed inset-x-0 bottom-24 z-30 flex justify-center px-5">
          <div
            className={`flex max-w-md items-center gap-3 rounded-xl px-4 py-3 text-sm shadow-lift ${
              toast.kind === 'ok' ? 'bg-ink text-white' : 'bg-clay-bg text-clay-ink'
            }`}
          >
            <span>{toast.text}</span>
            <button onClick={() => setToast(null)} className="shrink-0 opacity-60 hover:opacity-100">
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Floating basket bar — the delivery-app signature */}
      {basketCount > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-card/95 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3.5">
            <div>
              <p className="text-sm font-semibold">
                {basketCount} {basketCount === 1 ? 'item' : 'items'} in your basket
              </p>
              <p className="text-sm text-muted">Rs {basket.subtotal}</p>
            </div>
            <Link
              to="/basket"
              className="rounded-xl bg-sage-500 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-sage-600"
            >
              View basket
            </Link>
          </div>
        </div>
      )}
    </Layout>
  );
}
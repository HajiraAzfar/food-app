import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import Layout from '../components/Layout';
import Tile from '../components/Tile';

function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-card">
      <div className="h-32 animate-pulse bg-line/60" />
      <div className="space-y-2 p-4">
        <div className="h-4 w-2/3 animate-pulse rounded bg-line/60" />
        <div className="h-3 w-full animate-pulse rounded bg-line/40" />
      </div>
    </div>
  );
}

export default function Outlets() {
  const [outlets, setOutlets] = useState([]);
  const [search, setSearch] = useState('');
  const [cuisine, setCuisine] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    api.get(`/outlets?search=${encodeURIComponent(search)}`)
      .then(setOutlets)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [search]);

  // Build the cuisine filter from whatever restaurants actually exist,
  // so it never shows a category with nothing behind it.
  const cuisines = useMemo(
    () => [...new Set(outlets.map((o) => o.cuisine).filter(Boolean))],
    [outlets]
  );

  const visible = cuisine ? outlets.filter((o) => o.cuisine === cuisine) : outlets;

  return (
    <Layout search={search} onSearch={setSearch}>
      {/* Hero band — the one place the olive runs full width */}
      <section className="border-b border-line bg-mist">
        <div className="mx-auto max-w-6xl px-5 py-12">
          <h1 className="font-display text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
            Food from your
            <br />
            neighbourhood kitchens
          </h1>
          <p className="mt-3 max-w-md text-sage-700">
            Browse {outlets.length} restaurants, order in a few taps, and follow
            your food from the kitchen to your door.
          </p>

          <div className="relative mt-6 max-w-md md:hidden">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search restaurants or cuisines"
              className="w-full rounded-xl border border-sage-300 bg-card px-4 py-3 text-sm outline-none placeholder:text-muted/70 focus:border-sage-500"
            />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-5 py-8">
        {/* Cuisine chips */}
        {cuisines.length > 0 && (
          <div className="mb-7 flex gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setCuisine('')}
              className={`shrink-0 rounded-full px-4 py-2 text-sm transition ${
                cuisine === ''
                  ? 'bg-sage-500 font-medium text-white'
                  : 'border border-line bg-card text-muted hover:border-sage-300'
              }`}
            >
              All
            </button>
            {cuisines.map((c) => (
              <button
                key={c}
                onClick={() => setCuisine(cuisine === c ? '' : c)}
                className={`shrink-0 rounded-full px-4 py-2 text-sm transition ${
                  cuisine === c
                    ? 'bg-sage-500 font-medium text-white'
                    : 'border border-line bg-card text-muted hover:border-sage-300'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-xl bg-clay-bg px-4 py-3 text-sm text-clay-ink">{error}</div>
        )}

        <div className="mb-5 flex items-baseline justify-between">
          <h2 className="font-display text-xl font-bold">
            {cuisine || 'All restaurants'}
          </h2>
          {!loading && (
            <span className="text-sm text-muted">
              {visible.length} {visible.length === 1 ? 'place' : 'places'}
            </span>
          )}
        </div>

        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map((i) => <SkeletonCard key={i} />)}
          </div>
        ) : visible.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line py-16 text-center">
            <p className="mb-1 font-medium">Nothing matches that yet.</p>
            <p className="mb-5 text-sm text-muted">Try a different name or cuisine.</p>
            <button
              onClick={() => { setSearch(''); setCuisine(''); }}
              className="rounded-lg bg-sage-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-sage-600"
            >
              Show everything
            </button>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((o) => (
              <Link
                key={o.id}
                to={`/outlets/${o.id}`}
                className="group overflow-hidden rounded-2xl border border-line bg-card shadow-card transition hover:-translate-y-0.5 hover:shadow-lift"
              >
                <div className="relative">
                  <Tile name={o.title} className="h-32" />
                  {!o.is_open && (
                    <div className="absolute inset-0 grid place-items-center rounded-t-2xl bg-ink/55">
                      <span className="rounded-full bg-card px-3 py-1 text-xs font-semibold">
                        Closed right now
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <div className="mb-1.5 flex items-start justify-between gap-2">
                    <h3 className="font-display text-lg font-bold leading-snug">
                      {o.title}
                    </h3>
                    {o.is_open && (
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-sage-500" />
                    )}
                  </div>

                  <p className="mb-3 line-clamp-2 text-sm leading-relaxed text-muted">
                    {o.about}
                  </p>

                  <div className="flex items-center gap-2 text-xs">
                    {o.cuisine && (
                      <span className="rounded-md bg-sage-50 px-2 py-1 font-medium text-sage-700">
                        {o.cuisine}
                      </span>
                    )}
                    <span className="truncate text-muted">{o.address}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
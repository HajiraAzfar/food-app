import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api';
import Layout from '../components/Layout';
import Tile from '../components/Tile';

const EMPTY = { title: '', about: '', category: '', price: '' };

export default function OwnerMenu() {
  const { outletId } = useParams();
  const [dishes, setDishes] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);   // null = adding a new dish
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirmId, setConfirmId] = useState(null);
  const formRef = useRef(null);

  useEffect(() => { load(); }, [outletId]);

  function load() {
    // ?all=true — the owner needs to see sold-out dishes too
    api.get(`/dishes/outlet/${outletId}?all=true`)
      .then(setDishes)
      .catch((e) => { setError(e.message); setDishes([]); });
  }

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  function startEdit(dish) {
    setEditingId(dish.id);
    setError('');
    setForm({
      title: dish.title,
      about: dish.about || '',
      category: dish.category || '',
      price: String(dish.price),
    });
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(EMPTY);
    setError('');
  }

  async function save() {
    setError('');
    if (!form.title.trim()) return setError('Enter a dish name.');
    if (form.price === '' || Number(form.price) < 0) return setError('Enter a valid price.');

    setBusy(true);
    try {
      const payload = { ...form, price: Number(form.price) };
      if (editingId) {
        await api.put(`/dishes/${editingId}`, payload);
      } else {
        await api.post(`/dishes/outlet/${outletId}`, payload);
      }
      cancelEdit();
      load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function toggleAvailable(dish) {
    setError('');
    try {
      await api.put(`/dishes/${dish.id}`, { ...dish, is_available: !dish.is_available });
      load();
    } catch (e) { setError(e.message); }
  }

  async function remove(dish) {
    setError('');
    try {
      await api.del(`/dishes/${dish.id}`);
      if (editingId === dish.id) cancelEdit();
      setConfirmId(null);
      load();
    } catch (e) { setError(e.message); }
  }

  if (!dishes) {
    return (
      <Layout>
        <div className="mx-auto max-w-6xl space-y-4 px-5 py-8">
          <div className="h-8 w-32 animate-pulse rounded bg-line/60" />
          <div className="h-40 animate-pulse rounded-2xl bg-line/40" />
        </div>
      </Layout>
    );
  }

  const grouped = dishes.reduce((acc, d) => {
    const key = d.category || 'Other';
    (acc[key] = acc[key] || []).push(d);
    return acc;
  }, {});

  const soldOut = dishes.filter((d) => !d.is_available).length;
  const field = 'w-full rounded-xl border border-line bg-page px-3.5 py-2.5 text-sm outline-none transition placeholder:text-muted/70 focus:border-sage-300 focus:bg-card';

  return (
    <Layout>
      <div className="mx-auto max-w-6xl px-5 py-8">
        <Link to="/owner" className="mb-6 inline-block text-sm text-muted hover:text-sage-600">
          ← Dashboard
        </Link>

        <div className="mb-6 flex flex-wrap items-baseline justify-between gap-3">
          <h1 className="font-display text-3xl font-bold tracking-tight">Menu</h1>
          <p className="text-sm text-muted">
            {dishes.length} {dishes.length === 1 ? 'dish' : 'dishes'}
            {soldOut > 0 && ` · ${soldOut} sold out`}
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-xl bg-clay-bg px-4 py-3 text-sm text-clay-ink">{error}</div>
        )}

        {/* One form does both jobs — editingId decides which */}
        <div
          ref={formRef}
          className={`mb-8 rounded-2xl border bg-card p-6 shadow-card ${
            editingId ? 'border-sage-300' : 'border-line'
          }`}
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-bold">
              {editingId ? 'Edit dish' : 'Add a dish'}
            </h2>
            {editingId && (
              <button onClick={cancelEdit} className="text-sm text-muted transition hover:text-ink">
                Cancel
              </button>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">
                Dish name
              </label>
              <input value={form.title} onChange={(e) => set('title', e.target.value)}
                className={field} placeholder="Chicken Karahi" />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">
                Price (Rs)
              </label>
              <input value={form.price} onChange={(e) => set('price', e.target.value)}
                type="number" min="0" className={field} placeholder="450" />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">
                Category
              </label>
              <input value={form.category} onChange={(e) => set('category', e.target.value)}
                className={field} placeholder="Main Course" list="menu-categories" />
              {/* Suggest categories already in use, so the menu stays tidy */}
              <datalist id="menu-categories">
                {Object.keys(grouped).map((c) => <option key={c} value={c} />)}
              </datalist>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">
                Description
              </label>
              <input value={form.about} onChange={(e) => set('about', e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && save()}
                className={field} placeholder="What's in it, in one line" />
            </div>
          </div>

          <button onClick={save} disabled={busy}
            className="mt-5 rounded-xl bg-sage-500 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-sage-600 disabled:opacity-50">
            {busy ? 'Saving…' : editingId ? 'Save changes' : 'Add dish'}
          </button>
        </div>

        {dishes.length === 0 ? (
          <div className="rounded-2xl border border-line bg-card py-20 text-center shadow-card">
            <p className="mb-1 font-semibold">Your menu is empty</p>
            <p className="text-sm text-muted">Add your first dish using the form above.</p>
          </div>
        ) : (
          Object.entries(grouped).map(([category, items]) => (
            <section key={category} className="mb-8">
              <h2 className="mb-3 font-display text-xl font-bold">{category}</h2>

              <div className="space-y-3">
                {items.map((d) => (
                  <div
                    key={d.id}
                    className={`rounded-2xl border bg-card shadow-card transition ${
                      d.is_available ? 'border-line' : 'border-honey-ink/25'
                    } ${editingId === d.id ? 'ring-2 ring-sage-300' : ''}`}
                  >
                    <div className="flex gap-4 p-4">
                      <Tile name={d.title} className="h-14 w-14 shrink-0" rounded="rounded-xl" />

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className={`font-semibold ${d.is_available ? '' : 'text-muted'}`}>
                            {d.title}
                          </h3>
                          {!d.is_available && (
                            <span className="rounded-md bg-honey-bg px-2 py-0.5 text-xs font-semibold text-honey-ink">
                              Sold out
                            </span>
                          )}
                        </div>
                        {d.about && (
                          <p className="mt-0.5 line-clamp-1 text-sm text-muted">{d.about}</p>
                        )}
                      </div>

                      <p className="shrink-0 font-semibold text-sage-700">Rs {d.price}</p>
                    </div>

                    {confirmId === d.id ? (
                      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line bg-clay-bg/50 px-4 py-3">
                        <p className="text-sm text-clay-ink">
                          Delete "{d.title}"? Past orders keep their own copy, so they won't change.
                        </p>
                        <div className="flex gap-2">
                          <button onClick={() => setConfirmId(null)}
                            className="rounded-lg border border-line bg-card px-3.5 py-1.5 text-sm">
                            Keep it
                          </button>
                          <button onClick={() => remove(d)}
                            className="rounded-lg bg-clay-ink px-3.5 py-1.5 text-sm font-semibold text-white">
                            Delete
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2 border-t border-line px-4 py-3">
                        <button onClick={() => toggleAvailable(d)}
                          className="rounded-lg border border-line px-3.5 py-1.5 text-sm text-muted transition hover:border-sage-300 hover:text-sage-700">
                          {d.is_available ? 'Mark sold out' : 'Back in stock'}
                        </button>
                        <button onClick={() => startEdit(d)}
                          className="rounded-lg border border-line px-3.5 py-1.5 text-sm transition hover:border-sage-300">
                          Edit
                        </button>
                        <button onClick={() => setConfirmId(d.id)}
                          className="ml-auto rounded-lg px-3.5 py-1.5 text-sm text-muted transition hover:text-clay-ink">
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          ))
        )}
      </div>
    </Layout>
  );
}
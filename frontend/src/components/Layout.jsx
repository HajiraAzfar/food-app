import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function Layout({ children, search, onSearch }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <div className="min-h-screen bg-page">
      <header className="sticky top-0 z-20 border-b border-line bg-card">
        <div className="mx-auto flex max-w-6xl items-center gap-6 px-5 py-3.5">
          <Link to="/" className="flex shrink-0 items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-sage-500 font-display text-base font-bold text-white">
              D
            </span>
            <span className="font-display text-lg font-bold tracking-tight">DineHub</span>
          </Link>

          {/* Search lives in the header on the browse page, like every
              delivery app — it's the primary action, not a page detail. */}
          {onSearch && (
            <div className="relative hidden flex-1 md:block">
              <input
                value={search}
                onChange={(e) => onSearch(e.target.value)}
                placeholder="Search restaurants or cuisines"
                className="w-full rounded-xl border border-line bg-page py-2.5 pl-10 pr-4 text-sm outline-none transition placeholder:text-muted/70 focus:border-sage-300 focus:bg-card"
              />
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted">
                ⌕
              </span>
            </div>
          )}

          <nav className="ml-auto flex items-center gap-1.5">
            {user?.role === 'customer' && (
              <>
                <Link
                  to="/orders"
                  className={`rounded-lg px-3 py-2 text-sm transition ${
                    pathname.startsWith('/orders')
                      ? 'bg-sage-50 font-medium text-sage-700'
                      : 'text-muted hover:bg-page hover:text-ink'
                  }`}
                >
                  Orders
                </Link>
                <Link
                  to="/basket"
                  className="rounded-lg bg-sage-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sage-600"
                >
                  Basket
                </Link>
              </>
            )}

            {user?.role === 'owner' && (
              <Link
                to="/owner"
                className="rounded-lg px-3 py-2 text-sm text-muted transition hover:bg-page hover:text-ink"
              >
                Dashboard
              </Link>
            )}

            <div className="ml-2 flex items-center gap-2 border-l border-line pl-3">
              <span className="hidden text-sm text-muted lg:inline">{user?.full_name}</span>
              <button
                onClick={() => { logout(); navigate('/login'); }}
                className="rounded-lg px-2.5 py-2 text-sm text-muted transition hover:text-ink"
              >
                Log out
              </button>
            </div>
          </nav>
        </div>
      </header>

      <main>{children}</main>
    </div>
  );
}
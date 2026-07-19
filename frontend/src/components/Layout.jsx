import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const tabClass = ({ isActive }) =>
  `px-3 py-1.5 text-sm font-mono uppercase tracking-wide border-b-2 transition-colors ${
    isActive
      ? "border-ledger-600 text-ledger-700"
      : "border-transparent text-ink/50 hover:text-ink"
  }`;

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen">
      <header className="border-b border-ink/15 bg-paper/90 backdrop-blur">
        <div className="mx-auto max-w-5xl px-6 py-5">
          <div className="flex items-baseline justify-between">
            <div>
              <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-rupee">
                Ledger No. 001
              </div>
              <h1 className="font-display text-2xl font-semibold text-ink">
                Payout Ledger
              </h1>
            </div>

            {user && (
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-sm font-medium text-ink">
                    {user.name}
                  </div>
                  <div className="font-mono text-[11px] uppercase tracking-wide text-ink/40">
                    {user.userId} · {user.role}
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="border border-ink/20 px-3 py-1.5 text-xs font-mono uppercase text-ink/60 hover:border-alert hover:text-alert"
                >
                  Log out
                </button>
              </div>
            )}
          </div>

          <nav className="mt-4 flex gap-6 border-t border-ink/10 pt-2">
            {user?.role === "user" && (
              <NavLink to="/" end className={tabClass}>
                Dashboard
              </NavLink>
            )}

            {user?.role === "admin" && (
              <NavLink to="/admin" className={tabClass}>
                Admin Console
              </NavLink>
            )}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>

      <footer className="mx-auto max-w-5xl px-6 pb-10 pt-4 text-xs text-ink/40">
        Advance payout = 10% of pending earnings · One withdrawal every 24h ·
        MERN reference implementation
      </footer>
    </div>
  );
}
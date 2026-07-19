import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AuthLayout from "../components/AuthLayout";
import Banner from "../components/Banner";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ userId: "", name: "", password: "", role: "user" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const user = await register({
        userId: form.userId.trim(),
        name: form.name.trim(),
        password: form.password,
        role: form.role,
      });
      navigate(user.role === "admin" ? "/admin" : "/", { replace: true });
    } catch (err) {
      setError(err.message || "Registration failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout title="Create an account" subtitle="Set up access to the payout ledger">
      {error && (
        <div className="mb-4">
          <Banner tone="error" message={error} onClose={() => setError("")} />
        </div>
      )}
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-[11px] font-mono uppercase text-ink/50">User ID</label>
          <input
            required
            autoFocus
            value={form.userId}
            onChange={(e) => setForm({ ...form, userId: e.target.value })}
            placeholder="jane_doe"
            className="mt-1 w-full border border-ink/20 bg-white px-3 py-2 text-sm font-mono focus:border-ledger-600 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-[11px] font-mono uppercase text-ink/50">Full name</label>
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Jane Doe"
            className="mt-1 w-full border border-ink/20 bg-white px-3 py-2 text-sm focus:border-ledger-600 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-[11px] font-mono uppercase text-ink/50">Password</label>
          <input
            required
            minLength={6}
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="At least 6 characters"
            className="mt-1 w-full border border-ink/20 bg-white px-3 py-2 text-sm font-mono focus:border-ledger-600 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-[11px] font-mono uppercase text-ink/50">Account type</label>
          <div className="mt-1 flex gap-2">
            {[
              { value: "user", label: "Affiliate" },
              { value: "admin", label: "Admin" },
            ].map((opt) => (
              <button
                type="button"
                key={opt.value}
                onClick={() => setForm({ ...form, role: opt.value })}
                className={`flex-1 border px-3 py-2 text-sm font-medium transition-colors ${
                  form.role === opt.value
                    ? "border-ledger-600 bg-ledger-50 text-ledger-700"
                    : "border-ink/20 text-ink/60 hover:border-ink/40"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <p className="mt-1 text-xs text-ink/40">
            Affiliates track their own sales and payouts. Admins reconcile sales and run payout
            jobs for everyone.
          </p>
        </div>
        <button
          disabled={busy}
          className="w-full bg-ledger-600 py-2 text-sm font-medium text-white transition-colors hover:bg-ledger-700 disabled:opacity-50"
        >
          {busy ? "Creating account…" : "Create account"}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-ink/50">
        Already have an account?{" "}
        <Link to="/login" className="font-medium text-ledger-700 hover:underline">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}

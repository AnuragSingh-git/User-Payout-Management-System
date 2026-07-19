import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AuthLayout from "../components/AuthLayout";
import Banner from "../components/Banner";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    userId: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [wakeMessage, setWakeMessage] = useState("");

  const submit = async (e) => {
    e.preventDefault();

    setError("");
    setWakeMessage(
      "Server is waking up. Since the backend is hosted on Render's free plan, the first request may take up to 60 seconds."
    );

    setBusy(true);

    try {
      const user = await login(form.userId.trim(), form.password);

      navigate(user.role === "admin" ? "/admin" : "/", {
        replace: true,
      });
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setBusy(false);
      setWakeMessage("");
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Log in to view your payouts"
    >
      {error && (
        <div className="mb-4">
          <Banner
            tone="error"
            message={error}
            onClose={() => setError("")}
          />
        </div>
      )}

      {wakeMessage && (
        <div className="mb-4 border border-ledger-200 bg-ledger-50 px-3 py-2 text-sm text-ledger-700">
          {wakeMessage}
        </div>
      )}

      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-[11px] font-mono uppercase text-ink/50">
            User ID
          </label>

          <input
            required
            autoFocus
            value={form.userId}
            onChange={(e) =>
              setForm({
                ...form,
                userId: e.target.value,
              })
            }
            placeholder="john_doe"
            className="mt-1 w-full border border-ink/20 bg-white px-3 py-2 text-sm font-mono focus:border-ledger-600 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-[11px] font-mono uppercase text-ink/50">
            Password
          </label>

          <input
            required
            type="password"
            value={form.password}
            onChange={(e) =>
              setForm({
                ...form,
                password: e.target.value,
              })
            }
            placeholder="••••••••"
            className="mt-1 w-full border border-ink/20 bg-white px-3 py-2 text-sm font-mono focus:border-ledger-600 focus:outline-none"
          />
        </div>

        <button
          disabled={busy}
          className="w-full bg-ledger-600 py-2 text-sm font-medium text-white transition-colors hover:bg-ledger-700 disabled:opacity-50"
        >
          {busy ? "Waking server…" : "Sign in"}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-ink/50">
        New here?{" "}
        <Link
          to="/register"
          className="font-medium text-ledger-700 hover:underline"
        >
          Create an account
        </Link>
      </p>
    </AuthLayout>
  );
}
import { useEffect, useState, useCallback } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import StatCard from "../components/StatCard";
import Badge from "../components/Badge";
import Banner from "../components/Banner";

export default function Dashboard() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  // Regular affiliates always see their own data. Admins can additionally
  // look up any userId to inspect their ledger.
  const [viewUserId, setViewUserId] = useState(user?.userId || "");
  const [lookupInput, setLookupInput] = useState(user?.userId || "");

  const [account, setAccount] = useState(null);
  const [sales, setSales] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  const isOwnAccount = viewUserId === user?.userId;

  const load = useCallback(async () => {
    if (!viewUserId) return;
    try {
      const [u, s, w, t] = await Promise.all([
        api.get(`/users/${viewUserId}`),
        api.get(`/sales`, { params: { userId: viewUserId } }),
        api.get(`/withdrawals/${viewUserId}`),
        api.get(`/payouts/transactions/${viewUserId}`),
      ]);
      setAccount(u.data);
      setSales(s.data);
      setWithdrawals(w.data);
      setTransactions(t.data);
    } catch (e) {
      setError(e.message);
    }
  }, [viewUserId]);

  useEffect(() => {
    load();
  }, [load]);

  const lookup = (e) => {
    e.preventDefault();
    setError("");
    setNotice("");
    setViewUserId(lookupInput.trim());
  };

  const requestWithdrawal = async (e) => {
    e.preventDefault();
    setError("");
    setNotice("");
    setBusy(true);
    try {
      await api.post("/withdrawals", { amount: Number(amount) });
      setNotice(`Withdrawal of ₹${amount} initiated.`);
      setAmount("");
      await load();
    } catch (e) {
      if (e.nextAllowedAt) {
        const t = new Date(e.nextAllowedAt).toLocaleString();
        setError(`${e.message}. Next withdrawal allowed at ${t}.`);
      } else {
        setError(e.message);
      }
    } finally {
      setBusy(false);
    }
  };

  // Admin-only: simulate the payout processor reporting a withdrawal as
  // failed/cancelled/rejected, and watch the recovery flow (Question 2).
  const simulateFailure = async (withdrawalId, status) => {
    setError("");
    setNotice("");
    try {
      await api.patch(`/withdrawals/${withdrawalId}/status`, { status });
      setNotice(`Withdrawal marked ${status} — amount credited back to withdrawable balance.`);
      await load();
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="space-y-8">
      {error && <Banner tone="error" message={error} onClose={() => setError("")} />}
      {notice && <Banner tone="notice" message={notice} onClose={() => setNotice("")} />}

      {isAdmin && (
        <form onSubmit={lookup} className="flex items-end gap-3 border border-ink/15 bg-white/50 p-4">
          <div>
            <label className="block text-[11px] font-mono uppercase text-ink/50">
              Inspect account
            </label>
            <input
              value={lookupInput}
              onChange={(e) => setLookupInput(e.target.value)}
              placeholder="userId"
              className="mt-1 w-48 border border-ink/20 bg-white px-3 py-2 text-sm font-mono focus:border-ledger-600 focus:outline-none"
            />
          </div>
          <button className="border border-ink/20 px-3 py-2 text-sm font-mono uppercase text-ink/60 hover:border-ink/40">
            Load
          </button>
          {!isOwnAccount && (
            <span className="pb-2 text-xs text-ink/40">
              Viewing {viewUserId} — not your own account
            </span>
          )}
        </form>
      )}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Withdrawable balance" value={account?.withdrawableBalance} accent />
        <StatCard label="Total advance paid" value={account?.totalAdvancePaid} />
        <StatCard label="Total final payout" value={account?.totalFinalPayout} />
      </section>

      {isOwnAccount && (
        <section className="border border-ink/15 bg-white/50 p-5">
          <h2 className="font-display text-lg font-semibold">Request a withdrawal</h2>
          <p className="mt-1 text-xs text-ink/50">Limited to one successful withdrawal every 24 hours.</p>
          <form onSubmit={requestWithdrawal} className="mt-3 flex gap-3">
            <input
              type="number"
              min="0.01"
              step="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Amount (₹)"
              className="w-48 border border-ink/20 bg-white px-3 py-2 font-mono text-sm focus:border-ledger-600 focus:outline-none"
            />
            <button
              disabled={busy}
              className="bg-ledger-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-ledger-700 disabled:opacity-50"
            >
              Withdraw
            </button>
          </form>
        </section>
      )}

      <section>
        <h2 className="font-display text-lg font-semibold">Sales</h2>
        <div className="mt-3 overflow-hidden border border-ink/15">
          <table className="w-full text-sm">
            <thead className="bg-ink/5 text-left font-mono text-[11px] uppercase tracking-wide text-ink/50">
              <tr>
                <th className="px-3 py-2">Brand</th>
                <th className="px-3 py-2">Earning</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Advance paid</th>
                <th className="px-3 py-2">Final amount</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((s) => (
                <tr key={s._id} className="border-t border-ink/10 tabular">
                  <td className="px-3 py-2">{s.brand}</td>
                  <td className="px-3 py-2">₹{s.earning.toFixed(2)}</td>
                  <td className="px-3 py-2">
                    <Badge status={s.status} />
                  </td>
                  <td className="px-3 py-2">
                    {s.advancePaid ? `₹${s.advanceAmount.toFixed(2)}` : "—"}
                  </td>
                  <td className="px-3 py-2">
                    {s.reconciled ? (
                      <span className={s.finalAmount < 0 ? "text-alert" : "text-ledger-700"}>
                        {s.finalAmount < 0 ? "-" : ""}₹{Math.abs(s.finalAmount).toFixed(2)}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}
              {sales.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-ink/40">
                    No sales for this user yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="font-display text-lg font-semibold">Withdrawals</h2>
        {isAdmin && (
          <p className="mt-1 text-xs text-ink/50">
            The status buttons simulate the payout processor reporting an outcome (failed payout recovery).
          </p>
        )}
        <div className="mt-3 overflow-hidden border border-ink/15">
          <table className="w-full text-sm">
            <thead className="bg-ink/5 text-left font-mono text-[11px] uppercase tracking-wide text-ink/50">
              <tr>
                <th className="px-3 py-2">Amount</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Requested</th>
                {isAdmin && <th className="px-3 py-2">Simulate outcome</th>}
              </tr>
            </thead>
            <tbody>
              {withdrawals.map((w) => (
                <tr key={w._id} className="border-t border-ink/10 tabular">
                  <td className="px-3 py-2">₹{w.amount.toFixed(2)}</td>
                  <td className="px-3 py-2">
                    <Badge status={w.status} />
                  </td>
                  <td className="px-3 py-2 text-ink/60">
                    {new Date(w.createdAt).toLocaleString()}
                  </td>
                  {isAdmin && (
                    <td className="px-3 py-2">
                      {w.status === "completed" && !w.reversed ? (
                        <div className="flex gap-2">
                          {["failed", "cancelled", "rejected"].map((s) => (
                            <button
                              key={s}
                              onClick={() => simulateFailure(w._id, s)}
                              className="border border-ink/20 px-2 py-1 text-[11px] font-mono uppercase text-ink/60 hover:border-alert hover:text-alert"
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <span className="text-ink/30">—</span>
                      )}
                    </td>
                  )}
                </tr>
              ))}
              {withdrawals.length === 0 && (
                <tr>
                  <td colSpan={isAdmin ? 4 : 3} className="px-3 py-6 text-center text-ink/40">
                    No withdrawals yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="font-display text-lg font-semibold">Ledger (audit trail)</h2>
        <div className="mt-3 overflow-hidden border border-ink/15">
          <table className="w-full text-sm">
            <thead className="bg-ink/5 text-left font-mono text-[11px] uppercase tracking-wide text-ink/50">
              <tr>
                <th className="px-3 py-2">Type</th>
                <th className="px-3 py-2">Amount</th>
                <th className="px-3 py-2">Balance after</th>
                <th className="px-3 py-2">Note</th>
                <th className="px-3 py-2">When</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t) => (
                <tr key={t._id} className="border-t border-ink/10 tabular">
                  <td className="px-3 py-2 font-mono text-xs uppercase text-ink/60">
                    {t.type.replaceAll("_", " ")}
                  </td>
                  <td className={`px-3 py-2 ${t.amount < 0 ? "text-alert" : "text-ledger-700"}`}>
                    {t.amount < 0 ? "-" : "+"}₹{Math.abs(t.amount).toFixed(2)}
                  </td>
                  <td className="px-3 py-2">₹{t.balanceAfter.toFixed(2)}</td>
                  <td className="px-3 py-2 text-ink/60">{t.note}</td>
                  <td className="px-3 py-2 text-ink/40">{new Date(t.createdAt).toLocaleString()}</td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-ink/40">
                    No ledger entries yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

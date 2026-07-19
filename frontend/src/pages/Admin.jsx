import { useEffect, useState, useCallback } from "react";
import api from "../api/axios";
import Badge from "../components/Badge";
import Banner from "../components/Banner";

const BRANDS = ["brand_1", "brand_2", "brand_3"];

export default function Admin() {
  const [sales, setSales] = useState([]);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [form, setForm] = useState({ userId: "", brand: BRANDS[0], earning: "" });
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const params = statusFilter === "all" ? {} : { status: statusFilter };
      const { data } = await api.get("/sales", { params });
      setSales(data);
    } catch (e) {
      setError(e.message);
    }
  }, [statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const createSale = async (e) => {
    e.preventDefault();
    setError("");
    setNotice("");
    try {
      await api.post("/sales", { ...form, earning: Number(form.earning) });
      setNotice(`Sale created for ${form.userId}.`);
      setForm({ userId: form.userId, brand: BRANDS[0], earning: "" });
      await load();
    } catch (e) {
      setError(e.message);
    }
  };

  const runAdvanceJob = async () => {
    setError("");
    setNotice("");
    setBusy(true);
    try {
      const { data } = await api.post("/payouts/advance/run", {});
      setNotice(
        data.processedCount === 0
          ? "Advance payout job ran — no eligible sales found (already advanced or none pending)."
          : `Advance payout job processed ${data.processedCount} sale(s).`
      );
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const reconcile = async (saleId, status) => {
    setError("");
    setNotice("");
    try {
      await api.post(`/sales/${saleId}/reconcile`, { status });
      setNotice(`Sale ${status}.`);
      await load();
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="space-y-8">
      {error && <Banner tone="error" message={error} onClose={() => setError("")} />}
      {notice && <Banner tone="notice" message={notice} onClose={() => setNotice("")} />}

      <section className="border border-ink/15 bg-white/50 p-5">
        <h2 className="font-display text-lg font-semibold">Record a sale</h2>
        <form onSubmit={createSale} className="mt-3 flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-[11px] font-mono uppercase text-ink/50">User ID</label>
            <input
              required
              value={form.userId}
              onChange={(e) => setForm({ ...form, userId: e.target.value.trim() })}
              placeholder="john_doe"
              className="w-40 border border-ink/20 bg-white px-3 py-2 text-sm font-mono focus:border-ledger-600 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-[11px] font-mono uppercase text-ink/50">Brand</label>
            <select
              value={form.brand}
              onChange={(e) => setForm({ ...form, brand: e.target.value })}
              className="w-32 border border-ink/20 bg-white px-3 py-2 text-sm font-mono focus:border-ledger-600 focus:outline-none"
            >
              {BRANDS.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-mono uppercase text-ink/50">Earning (₹)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              required
              value={form.earning}
              onChange={(e) => setForm({ ...form, earning: e.target.value })}
              placeholder="40"
              className="w-32 border border-ink/20 bg-white px-3 py-2 text-sm font-mono focus:border-ledger-600 focus:outline-none"
            />
          </div>
          <button className="bg-ink px-4 py-2 text-sm font-medium text-white hover:bg-ink/80">
            Add sale
          </button>
        </form>
      </section>

      <section className="border border-ink/15 bg-white/50 p-5">
        <h2 className="font-display text-lg font-semibold">Advance payout job</h2>
        <p className="mt-1 text-xs text-ink/50">
          Pays 10% of earnings on every pending sale that hasn't received an advance yet. Safe to run repeatedly —
          already-advanced sales are skipped.
        </p>
        <button
          onClick={runAdvanceJob}
          disabled={busy}
          className="mt-3 bg-rupee px-4 py-2 text-sm font-medium text-white hover:bg-rupee/90 disabled:opacity-50"
        >
          Run advance payout job
        </button>
      </section>

      <section>
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">Sales &amp; reconciliation</h2>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-ink/20 bg-white px-2 py-1 text-xs font-mono uppercase focus:border-ledger-600 focus:outline-none"
          >
            <option value="pending">Pending only</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="all">All</option>
          </select>
        </div>
        <div className="mt-3 overflow-hidden border border-ink/15">
          <table className="w-full text-sm">
            <thead className="bg-ink/5 text-left font-mono text-[11px] uppercase tracking-wide text-ink/50">
              <tr>
                <th className="px-3 py-2">User</th>
                <th className="px-3 py-2">Brand</th>
                <th className="px-3 py-2">Earning</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Advance</th>
                <th className="px-3 py-2">Reconcile</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((s) => (
                <tr key={s._id} className="border-t border-ink/10 tabular">
                  <td className="px-3 py-2 font-mono text-xs">{s.userId}</td>
                  <td className="px-3 py-2">{s.brand}</td>
                  <td className="px-3 py-2">₹{s.earning.toFixed(2)}</td>
                  <td className="px-3 py-2">
                    <Badge status={s.status} />
                  </td>
                  <td className="px-3 py-2">
                    {s.advancePaid ? `₹${s.advanceAmount.toFixed(2)}` : "—"}
                  </td>
                  <td className="px-3 py-2">
                    {s.status === "pending" && !s.reconciled ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => reconcile(s._id, "approved")}
                          className="border border-ledger-600 px-2 py-1 text-[11px] font-mono uppercase text-ledger-700 hover:bg-ledger-50"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => reconcile(s._id, "rejected")}
                          className="border border-alert px-2 py-1 text-[11px] font-mono uppercase text-alert hover:bg-red-50"
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      <span className="text-ink/30">
                        {s.reconciled ? `settled ₹${s.finalAmount.toFixed(2)}` : "—"}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {sales.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-6 text-center text-ink/40">
                    No sales match this filter.
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

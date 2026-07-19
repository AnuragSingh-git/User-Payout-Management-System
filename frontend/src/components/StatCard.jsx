export default function StatCard({ label, value, accent = false, sub }) {
  return (
    <div className="border border-ink/15 bg-white/60 p-4">
      <div className="text-[11px] font-mono uppercase tracking-widest text-ink/50">{label}</div>
      <div
        className={`mt-1 font-display text-3xl tabular ${
          accent ? "text-ledger-700" : "text-ink"
        }`}
      >
        ₹{Number(value ?? 0).toFixed(2)}
      </div>
      {sub && <div className="mt-1 text-xs text-ink/50">{sub}</div>}
    </div>
  );
}

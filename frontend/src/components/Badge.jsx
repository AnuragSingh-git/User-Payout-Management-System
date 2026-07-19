const STYLES = {
  pending: "bg-amber-100 text-amber-800 border-amber-300",
  approved: "bg-ledger-100 text-ledger-700 border-ledger-200",
  rejected: "bg-red-100 text-alert border-red-300",
  completed: "bg-ledger-100 text-ledger-700 border-ledger-200",
  failed: "bg-red-100 text-alert border-red-300",
  cancelled: "bg-stone-200 text-stone-700 border-stone-300",
};

export default function Badge({ status }) {
  const cls = STYLES[status] || "bg-stone-200 text-stone-700 border-stone-300";
  return (
    <span
      className={`inline-block rounded-sm border px-2 py-0.5 text-[11px] font-mono uppercase tracking-wide ${cls}`}
    >
      {status}
    </span>
  );
}

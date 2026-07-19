export default function Banner({ tone = "error", message, onClose }) {
  if (!message) return null;
  const styles =
    tone === "error"
      ? "bg-red-50 border-alert/40 text-alert"
      : "bg-ledger-50 border-ledger-200 text-ledger-700";
  return (
    <div className={`flex items-start justify-between gap-4 border px-4 py-3 text-sm ${styles}`}>
      <span>{message}</span>
      {onClose && (
        <button onClick={onClose} className="font-mono text-xs opacity-60 hover:opacity-100">
          dismiss
        </button>
      )}
    </div>
  );
}

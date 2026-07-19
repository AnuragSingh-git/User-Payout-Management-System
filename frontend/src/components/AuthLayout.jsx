export default function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-rupee">
            Payout Ledger
          </div>
          <h1 className="mt-1 font-display text-2xl font-semibold text-ink">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-ink/50">{subtitle}</p>}
        </div>
        <div className="border border-ink/15 bg-white/70 p-6 shadow-sm">{children}</div>
      </div>
    </div>
  );
}

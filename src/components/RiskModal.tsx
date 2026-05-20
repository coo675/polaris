import type { RiskReport } from "../lib/polaris";

export function RiskModal({
  report,
  onClose,
  onConfirm,
}: {
  report: RiskReport;
  onClose: () => void;
  onConfirm?: () => void;
}) {
  const cls =
    report.level === "safe"
      ? "pl-risk-safe"
      : report.level === "warn"
        ? "pl-risk-warn"
        : "pl-risk-danger";

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-ink/40 p-4 sm:items-center">
      <article className="w-full max-w-md rounded-2xl bg-white p-5 shadow-card">
        <p className={`text-xs font-semibold uppercase tracking-wider ${cls}`}>安全预检</p>
        <h2 className={`mt-2 text-lg font-bold ${cls}`}>{report.title}</h2>
        <ul className="mt-3 space-y-1.5 text-sm text-muted">
          {report.reasons.map((r) => (
            <li key={r}>• {r}</li>
          ))}
        </ul>
        <div className="mt-4 flex gap-2">
          <button type="button" className="pl-btn-outline flex-1" onClick={onClose}>
            取消
          </button>
          {!report.blocked && onConfirm && (
            <button type="button" className="pl-btn flex-1" onClick={onConfirm}>
              仍要发送
            </button>
          )}
        </div>
      </article>
    </div>
  );
}

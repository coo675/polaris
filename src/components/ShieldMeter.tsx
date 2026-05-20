import type { RiskReport } from "../lib/polaris";
import { computeShieldScore } from "../lib/polaris";

export function ShieldMeter({ report }: { report: RiskReport }) {
  const score = computeShieldScore(report);
  const ring =
    report.level === "safe" ? "text-ok" : report.level === "warn" ? "text-warn" : "text-danger";

  return (
    <div className="flex items-center gap-4">
      <div
        className={`relative flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-4 border-current ${ring}`}
        style={{
          background: `conic-gradient(currentColor ${score * 3.6}deg, #e2e8f0 0deg)`,
        }}
      >
        <div className="flex h-14 w-14 flex-col items-center justify-center rounded-full bg-white">
          <span className={`text-xl font-bold ${ring}`}>{score}</span>
          <span className="text-[9px] text-muted">蓝盾</span>
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <p className={`text-sm font-bold ${ring}`}>{report.title}</p>
        <ul className="mt-1 space-y-0.5 text-xs text-muted">
          {report.reasons.map((r) => (
            <li key={r}>· {r}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

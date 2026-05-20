import { NavLink, Outlet } from "react-router-dom";
import { shortAddr } from "../lib/utils";
import { useWalletStore } from "../store/walletStore";

const NAV = [
  ["home", "首页"],
  ["copilot", "智伴"],
  ["send", "航线"],
  ["security", "安全"],
  ["settings", "设置"],
] as const;

export function Layout() {
  const session = useWalletStore((s) => s.session);
  if (!session) return <Outlet />;
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-line/80 bg-white/90 px-4 py-3 backdrop-blur-md">
        <div className="mx-auto flex max-w-lg items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue text-sm font-bold text-white shadow-btn">
              ★
            </div>
            <div>
              <p className="text-sm font-bold text-ink">Polaris 极蓝</p>
              <p className="text-[10px] text-muted">AI 安全自托管</p>
            </div>
          </div>
          <p className="rounded-lg bg-soft px-2 py-1 font-mono text-[10px] text-blue">
            {shortAddr(session.address)}
          </p>
        </div>
      </header>
      <main className="pl-shell">
        <Outlet />
      </main>
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-line bg-white/95 shadow-[0_-4px_24px_rgba(37,99,235,0.08)] backdrop-blur-md">
        <div className="mx-auto flex max-w-lg justify-around py-2">
          {NAV.map(([to, label]) => (
            <NavLink
              key={to}
              to={`/${to}`}
              className={({ isActive }) =>
                `px-2 py-1 text-xs font-medium transition ${isActive ? "text-blue" : "text-muted"}`
              }
            >
              {label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}

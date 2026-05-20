import { useEffect } from "react";
import { Link } from "react-router-dom";
import { fetchBalance } from "../lib/rpc";
import { getChain } from "../lib/chains";
import { suggestGasPlan } from "../lib/polaris";
import { demoBalanceEth, shortAddr } from "../lib/utils";
import { useWalletStore } from "../store/walletStore";

export function HomePage() {
  const session = useWalletStore((s) => s.session)!;
  const chainId = useWalletStore((s) => s.chainId);
  const balance = useWalletStore((s) => s.balance);
  const setBalance = useWalletStore((s) => s.setBalance);
  const stablecoinGas = useWalletStore((s) => s.stablecoinGas);
  const toggleStablecoinGas = useWalletStore((s) => s.toggleStablecoinGas);
  const chain = getChain(chainId);
  const gasPlan = suggestGasPlan(chainId);
  const balNum = parseFloat(balance);
  const scenario =
    Number.isNaN(balNum) || balNum < 0.00001 ? "empty" : balNum < 0.05 ? "low" : "healthy";

  useEffect(() => {
    void fetchBalance(chain, session.address)
      .then((b) => {
        const n = parseFloat(b);
        setBalance(n > 0 ? `${b} ${chain.symbol}` : `${demoBalanceEth(session.address)} ${chain.symbol} (演示)`);
      })
      .catch(() => setBalance(`${demoBalanceEth(session.address)} ${chain.symbol} (演示)`));
  }, [chain, session.address, setBalance, chainId]);

  return (
    <div className="mt-2 space-y-4">
      <article className="pl-card-hero">
        <p className="pl-label">资产总览</p>
        {scenario === "empty" && (
          <p className="text-sm text-muted">欢迎使用极蓝。可向智伴询问「查余额」或「转 0.001 到地址」。</p>
        )}
        {scenario === "low" && (
          <p className="text-sm text-warn">余额偏低，建议领取测试网水龙头后再试转账。</p>
        )}
        {scenario === "healthy" && (
          <p className="text-sm text-blue">资产状态良好，可体验自然语言转账与安全预检。</p>
        )}
        <p className="mt-4 text-4xl font-bold text-blue">{balance}</p>
        <p className="mt-1 font-mono text-xs text-muted">
          {shortAddr(session.address, 8, 6)} · {chain.label}
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Link to="/send" className="pl-btn text-center">
            开航线
          </Link>
          <Link to="/copilot" className="pl-btn-outline text-center">
            问智伴
          </Link>
        </div>
      </article>

      <article className="pl-card">
        <p className="pl-label">智能 Gas 推荐</p>
        <p className="text-sm text-ink">{gasPlan.timing}</p>
        <p className="mt-1 text-xs text-muted">
          推荐 {gasPlan.label} · 约省 {gasPlan.savingsPct}% · {gasPlan.note}
        </p>
        <label className="mt-3 flex cursor-pointer items-center gap-2 text-sm text-ink">
          <input type="checkbox" checked={stablecoinGas} onChange={toggleStablecoinGas} className="accent-blue" />
          稳定币代付 Gas（演示）
        </label>
      </article>

      <div className="grid grid-cols-2 gap-3">
        <Link to="/copilot" className="pl-card block text-center transition hover:border-blue/40">
          <p className="text-2xl">✦</p>
          <p className="mt-1 text-sm font-semibold text-blue">极蓝智伴</p>
          <p className="text-[10px] text-muted">自然语言操作</p>
        </Link>
        <Link to="/security" className="pl-card block text-center transition hover:border-blue/40">
          <p className="text-2xl">🛡</p>
          <p className="mt-1 text-sm font-semibold text-blue">安全中心</p>
          <p className="text-[10px] text-muted">预检与手册</p>
        </Link>
      </div>
    </div>
  );
}

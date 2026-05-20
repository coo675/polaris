import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getChain } from "../lib/chains";
import { fetchGasPrice, formatGwei } from "../lib/rpc";
import { scanTransactionRisk, suggestGasPlan } from "../lib/polaris";
import { signTransfer } from "../lib/walletCore";
import { loadDocks, rememberDock, type DockEntry } from "../lib/transferBook";
import { normalizeAddr, shortAddr } from "../lib/utils";
import { ShieldMeter } from "../components/ShieldMeter";
import { useWalletStore } from "../store/walletStore";

const PAYLOAD_PRESETS = ["0.001", "0.01", "0.05", "0.1"];
const STEPS = ["停靠点", "载荷", "蓝盾", "签发"] as const;

export function SendPage() {
  const [params] = useSearchParams();
  const session = useWalletStore((s) => s.session)!;
  const chainId = useWalletStore((s) => s.chainId);
  const setChain = useWalletStore((s) => s.setChain);
  const toastOk = useWalletStore((s) => s.toastOk);
  const toastErr = useWalletStore((s) => s.toastErr);

  const [step, setStep] = useState(0);
  const [docks, setDocks] = useState<DockEntry[]>([]);
  const [dockLabel, setDockLabel] = useState("");
  const [to, setTo] = useState(params.get("to") || "");
  const [amount, setAmount] = useState(params.get("amount") || "0.001");
  const [memo, setMemo] = useState("");
  const [checked, setChecked] = useState(false);
  const [password, setPassword] = useState("");
  const [slide, setSlide] = useState(0);
  const [gas, setGas] = useState<bigint | null>(null);
  const [busy, setBusy] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);

  useEffect(() => {
    setDocks(loadDocks());
    const c = params.get("chain");
    if (c) setChain(c);
    const s = params.get("step");
    if (s === "1" || s === "2" || s === "3") setStep(Number(s));
    else if (params.get("to")) setStep(1);
  }, [params, setChain]);

  const chain = getChain(chainId);
  const gasPlan = suggestGasPlan(chainId);

  useEffect(() => {
    void fetchGasPrice(chain).then(setGas).catch(() => setGas(null));
  }, [chain]);

  const risk = useMemo(() => {
    try {
      return scanTransactionRisk(to, amount || "0", session.address, memo);
    } catch {
      return null;
    }
  }, [to, amount, session.address, memo]);

  async function pasteDock() {
    try {
      const t = await navigator.clipboard.readText();
      setTo(t.trim());
      toastOk("已粘贴地址");
    } catch {
      toastErr("无法读取剪贴板");
    }
  }

  function nextFromDock() {
    try {
      normalizeAddr(to);
      setStep(1);
    } catch {
      toastErr("停靠点地址无效");
    }
  }

  function nextFromPayload() {
    const n = parseFloat(amount);
    if (Number.isNaN(n) || n <= 0) return toastErr("请填写有效载荷");
    setStep(2);
    setChecked(false);
  }

  function nextFromShield() {
    if (!risk) return toastErr("请先填写有效停靠点");
    if (risk.blocked) return toastErr("蓝盾已拦截，请更换停靠点或附言");
    if (!checked) return toastErr("请勾选复核清单");
    setStep(3);
    setSlide(0);
  }

  async function issue() {
    if (slide < 88) return toastErr("请向右滑满签发条");
    if (!password) return toastErr("请输入钱包密码");
    if (!gas || !risk || risk.blocked) return;
    setBusy(true);
    try {
      const { txHash: hash } = await signTransfer(
        session,
        password,
        chain,
        to,
        amount,
        gas.toString(),
        true
      );
      rememberDock(to, dockLabel);
      setDocks(loadDocks());
      setTxHash(hash || "ok");
      toastOk(hash ? `航线已签发 ${hash.slice(0, 10)}…` : "已广播");
    } catch (e) {
      toastErr(e instanceof Error ? e.message : "签发失败");
    } finally {
      setBusy(false);
    }
  }

  if (txHash) {
    const explorer = chain.explorer && txHash !== "ok" ? `${chain.explorer}/tx/${txHash}` : null;
    return (
      <div className="mt-2 space-y-4">
        <article className="pl-card-hero text-center">
          <p className="text-4xl">✓</p>
          <h2 className="mt-2 text-lg font-bold text-blue">航线签发成功</h2>
          <p className="mt-2 text-sm text-muted">
            {amount} {chain.symbol} → {shortAddr(to)}
          </p>
          {explorer && (
            <a href={explorer} target="_blank" rel="noreferrer" className="mt-4 inline-block text-sm text-blue underline">
              在浏览器查看交易
            </a>
          )}
          <button
            type="button"
            className="pl-btn mt-6 w-full"
            onClick={() => {
              setTxHash(null);
              setStep(0);
              setTo("");
              setAmount("0.001");
              setMemo("");
              setPassword("");
              setSlide(0);
            }}
          >
            规划新航线
          </button>
        </article>
      </div>
    );
  }

  return (
    <div className="mt-2 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="pl-label">蓝盾航线</p>
          <p className="text-xs text-muted">分步规划 · 非传统转账表单</p>
        </div>
        <Link to="/copilot" className="pl-chip text-blue">
          智伴带入
        </Link>
      </div>

      <div className="flex gap-1">
        {STEPS.map((label, i) => (
          <div
            key={label}
            className={`flex-1 rounded-lg py-2 text-center text-[10px] font-semibold transition ${
              i === step ? "bg-blue text-white shadow-btn" : i < step ? "bg-soft text-blue" : "bg-white text-muted"
            }`}
          >
            {i + 1}. {label}
          </div>
        ))}
      </div>

      {step === 0 && (
        <article className="pl-card space-y-3">
          <p className="text-sm font-semibold text-ink">① 选定停靠点</p>
          {docks.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {docks.map((d) => (
                <button
                  key={d.address}
                  type="button"
                  className="rounded-xl border border-line bg-soft px-3 py-2 text-left text-xs transition hover:border-blue"
                  onClick={() => {
                    setTo(d.address);
                    setDockLabel(d.label);
                  }}
                >
                  <span className="font-medium text-blue">{d.label}</span>
                  <span className="mt-0.5 block font-mono text-muted">{shortAddr(d.address)}</span>
                </button>
              ))}
            </div>
          )}
          <input
            className="pl-input font-mono text-xs"
            placeholder="0x 收款地址"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
          <input
            className="pl-input text-sm"
            placeholder="停靠点备注（可选）"
            value={dockLabel}
            onChange={(e) => setDockLabel(e.target.value)}
          />
          <div className="flex gap-2">
            <button type="button" className="pl-btn-outline flex-1" onClick={() => void pasteDock()}>
              粘贴地址
            </button>
            <button type="button" className="pl-btn flex-1" onClick={nextFromDock}>
              下一步
            </button>
          </div>
        </article>
      )}

      {step === 1 && (
        <article className="pl-card space-y-3">
          <p className="text-sm font-semibold text-ink">② 配置载荷</p>
          <p className="rounded-xl bg-soft px-3 py-2 font-mono text-xs text-blue">
            至 {shortAddr(to, 8, 6)}
          </p>
          <p className="text-center text-3xl font-bold text-blue">
            {amount || "0"} <span className="text-lg text-muted">{chain.symbol}</span>
          </p>
          <div className="grid grid-cols-4 gap-2">
            {PAYLOAD_PRESETS.map((p) => (
              <button
                key={p}
                type="button"
                className={`rounded-xl py-2 text-xs font-medium ${amount === p ? "bg-blue text-white" : "bg-soft text-blue"}`}
                onClick={() => setAmount(p)}
              >
                {p}
              </button>
            ))}
          </div>
          <input
            className="pl-input"
            inputMode="decimal"
            placeholder="自定义数量"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <input
            className="pl-input text-sm"
            placeholder="附言（蓝盾会扫描钓鱼词）"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
          />
          <p className="text-xs text-muted">
            Gas ≈ {gas ? `${formatGwei(gas)} Gwei` : "…"} · 可切换 {gasPlan.label} 约省 {gasPlan.savingsPct}%
          </p>
          <div className="flex gap-2">
            <button type="button" className="pl-btn-outline flex-1" onClick={() => setStep(0)}>
              上一步
            </button>
            <button type="button" className="pl-btn flex-1" onClick={nextFromPayload}>
              蓝盾复核
            </button>
          </div>
        </article>
      )}

      {step === 2 && risk && (
        <article className="pl-card space-y-4">
          <p className="text-sm font-semibold text-ink">③ 蓝盾复核</p>
          <ShieldMeter report={risk} />
          <label className="flex cursor-pointer items-start gap-2 text-sm text-ink">
            <input type="checkbox" checked={checked} onChange={(e) => setChecked(e.target.checked)} className="mt-1 accent-blue" />
            我已核对停靠点、载荷与网络（{chain.label}），理解签名后不可撤销
          </label>
          <div className="flex gap-2">
            <button type="button" className="pl-btn-outline flex-1" onClick={() => setStep(1)}>
              上一步
            </button>
            <button
              type="button"
              className="pl-btn flex-1"
              disabled={risk.blocked}
              onClick={nextFromShield}
            >
              进入签发台
            </button>
          </div>
        </article>
      )}

      {step === 3 && risk && (
        <article className="pl-card space-y-4">
          <p className="text-sm font-semibold text-ink">④ 签发台</p>
          <dl className="space-y-2 rounded-xl border border-blue/20 bg-soft/50 p-4 text-sm">
            <div className="flex justify-between gap-2">
              <dt className="text-muted">网络</dt>
              <dd className="font-medium text-ink">{chain.label}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted">停靠点</dt>
              <dd className="break-all font-mono text-xs text-blue">{shortAddr(to, 10, 8)}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted">载荷</dt>
              <dd className="font-bold text-blue">
                {amount} {chain.symbol}
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted">蓝盾</dt>
              <dd className={risk.level === "safe" ? "text-ok" : risk.level === "warn" ? "text-warn" : "text-danger"}>
                {risk.title}
              </dd>
            </div>
          </dl>

          <div>
            <p className="mb-2 text-xs text-muted">向右滑满以解锁本地签名</p>
            <div className="relative h-12 overflow-hidden rounded-xl bg-line">
              <div
                className="absolute inset-y-0 left-0 bg-blue/20 transition-all"
                style={{ width: `${slide}%` }}
              />
              <input
                type="range"
                min={0}
                max={100}
                value={slide}
                onChange={(e) => setSlide(Number(e.target.value))}
                className="relative z-10 h-12 w-full cursor-pointer appearance-none bg-transparent accent-blue"
              />
              <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-xs font-medium text-muted">
                {slide >= 88 ? "已解锁 · 输入密码后签发" : "滑动签发条 →"}
              </span>
            </div>
          </div>

          <input
            type="password"
            className="pl-input"
            placeholder="钱包密码"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={slide < 88}
          />

          <div className="flex gap-2">
            <button type="button" className="pl-btn-outline flex-1" onClick={() => setStep(2)}>
              上一步
            </button>
            <button
              type="button"
              className="pl-btn flex-1"
              disabled={busy || slide < 88 || !password}
              onClick={() => void issue()}
            >
              {busy ? "签发中…" : "本地签名并广播"}
            </button>
          </div>
        </article>
      )}
    </div>
  );
}

import { CHAIN_LIST } from "../lib/chains";
import { shortAddr } from "../lib/utils";
import { useWalletStore } from "../store/walletStore";

export function SettingsPage() {
  const session = useWalletStore((s) => s.session)!;
  const chainId = useWalletStore((s) => s.chainId);
  const setChain = useWalletStore((s) => s.setChain);
  const lock = useWalletStore((s) => s.lock);
  const toastOk = useWalletStore((s) => s.toastOk);

  return (
    <div className="mt-2 space-y-4">
      <article className="pl-card">
        <p className="pl-label">钱包</p>
        <p className="break-all font-mono text-xs text-muted">{session.address}</p>
        <p className="mt-2 text-sm text-ink">{shortAddr(session.address)} · {session.label}</p>
      </article>

      <article className="pl-card space-y-3">
        <p className="pl-label">网络</p>
        <select
          className="pl-input"
          value={chainId}
          onChange={(e) => {
            setChain(e.target.value);
            toastOk("已切换网络");
          }}
        >
          {CHAIN_LIST.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label} {c.testnet ? "(测试网)" : ""}
            </option>
          ))}
        </select>
      </article>

      <button
        type="button"
        className="pl-btn-outline w-full border-danger/30 text-danger hover:border-danger"
        onClick={() => {
          lock();
          toastOk("已锁定钱包");
        }}
      >
        锁定并退出
      </button>

      <p className="text-center text-xs text-muted">Polaris 极蓝 v1.0</p>
    </div>
  );
}

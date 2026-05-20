import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DEFAULT_CHAIN, getChain } from "../lib/chains";
import {
  createFromMnemonic,
  generateMnemonicPhrase,
  importKeystoreJson,
  importPrivateKey,
} from "../lib/walletCore";
import { useWalletStore } from "../store/walletStore";

type Tab = "new" | "mnemonic" | "key" | "json";

export function GatePage() {
  const nav = useNavigate();
  const setSession = useWalletStore((s) => s.setSession);
  const toastOk = useWalletStore((s) => s.toastOk);
  const toastErr = useWalletStore((s) => s.toastErr);
  const [tab, setTab] = useState<Tab>("new");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [mnemonic, setMnemonic] = useState("");
  const [generating, setGenerating] = useState(false);
  const [pk, setPk] = useState("");
  const [json, setJson] = useState("");
  const [busy, setBusy] = useState(false);
  const chain = getChain(DEFAULT_CHAIN);

  async function randomMnemonic() {
    setGenerating(true);
    try {
      setMnemonic(await generateMnemonicPhrase());
    } catch (e) {
      toastErr(e instanceof Error ? e.message : "生成失败");
    } finally {
      setGenerating(false);
    }
  }

  async function submit() {
    if (password.length < 8) return toastErr("密码至少 8 位");
    if (password !== confirm) return toastErr("两次密码不一致");
    if ((tab === "new" || tab === "mnemonic") && !mnemonic.trim()) {
      return toastErr("请先随机生成助记词");
    }
    setBusy(true);
    try {
      if (tab === "new" || tab === "mnemonic") {
        setSession(await createFromMnemonic(password, mnemonic, chain));
      } else if (tab === "key") {
        setSession(await importPrivateKey(password, pk, chain));
      } else {
        setSession(await importKeystoreJson(json, password, chain));
      }
      toastOk("钱包已就绪");
      nav("/home");
    } catch (e) {
      toastErr(e instanceof Error ? e.message : "失败");
    } finally {
      setBusy(false);
    }
  }

  const tabs = [
    ["new", "新建"],
    ["mnemonic", "导入助记词"],
    ["key", "私钥"],
    ["json", "JSON"],
  ] as const;

  return (
    <div className="pl-shell max-w-md py-8">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue text-2xl text-white shadow-btn">
          ★
        </div>
        <h1 className="text-3xl font-bold text-ink">极蓝</h1>
        <p className="mt-2 text-sm text-muted">Polaris · 蓝白 AI 自托管钱包</p>
        <p className="mt-3 inline-block rounded-full bg-soft px-3 py-1 text-xs font-medium text-blue">
          端侧智伴 · 私钥不离机
        </p>
      </div>

      <article className="pl-card mt-8">
        <p className="text-xs leading-relaxed text-muted">
          助记词与密码仅保存在本机。极蓝智伴不读取、不上传密钥材料。
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {tabs.map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={`pl-tab ${tab === id ? "pl-tab-on" : "bg-soft text-muted"}`}
              onClick={() => setTab(id)}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="mt-4 space-y-3">
          {(tab === "new" || tab === "mnemonic") && (
            <>
              <textarea
                className="pl-input min-h-[80px] font-mono text-xs"
                placeholder={tab === "new" ? "点击下方随机生成助记词" : "粘贴已有助记词"}
                value={mnemonic}
                onChange={(e) => setMnemonic(e.target.value)}
              />
              {tab === "new" && (
                <button type="button" className="pl-btn w-full" disabled={generating} onClick={() => void randomMnemonic()}>
                  {generating ? "生成中…" : "随机生成助记词"}
                </button>
              )}
            </>
          )}
          {tab === "key" && (
            <input className="pl-input font-mono text-xs" placeholder="0x 私钥" value={pk} onChange={(e) => setPk(e.target.value)} />
          )}
          {tab === "json" && (
            <textarea className="pl-input min-h-[80px] font-mono text-xs" placeholder="Keystore JSON" value={json} onChange={(e) => setJson(e.target.value)} />
          )}
          <input type="password" className="pl-input" placeholder="钱包密码" value={password} onChange={(e) => setPassword(e.target.value)} />
          <input type="password" className="pl-input" placeholder="确认密码" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          <button type="button" className="pl-btn w-full" disabled={busy} onClick={() => void submit()}>
            {busy ? "处理中…" : "进入钱包"}
          </button>
        </div>
      </article>
    </div>
  );
}

import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getChain } from "../lib/chains";
import { parseNaturalLanguage, polarisReply } from "../lib/polaris";
import { useWalletStore } from "../store/walletStore";

const CHIPS = ["查余额", "优化 Gas", "转 0.001 到 0x0000000000000000000000000000000000000001", "蓝盾航线怎么用"];

export function CopilotPage() {
  const nav = useNavigate();
  const session = useWalletStore((s) => s.session)!;
  const chainId = useWalletStore((s) => s.chainId);
  const balance = useWalletStore((s) => s.balance);
  const messages = useWalletStore((s) => s.messages);
  const addMessage = useWalletStore((s) => s.addMessage);
  const [input, setInput] = useState("");
  const bottom = useRef<HTMLDivElement>(null);
  const chain = getChain(chainId);

  function send(text?: string) {
    const q = (text ?? input).trim();
    if (!q) return;
    setInput("");
    addMessage({ id: `u-${Date.now()}`, role: "user", text: q, ts: Date.now() });
    const reply = polarisReply(q, {
      balance,
      symbol: chain.symbol,
      address: session.address,
      chainLabel: chain.label,
      chainId,
    });
    addMessage({ id: `p-${Date.now()}`, role: "polaris", text: reply, ts: Date.now() });
    const intent = parseNaturalLanguage(q);
    if (intent.kind === "transfer" && intent.to) {
      const params = new URLSearchParams({
        to: intent.to,
        amount: intent.amount || "0.001",
        step: "1",
      });
      if (intent.chainId) params.set("chain", intent.chainId);
      setTimeout(() => nav(`/send?${params}`), 500);
    }
    setTimeout(() => bottom.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }

  return (
    <div className="flex min-h-[70vh] flex-col">
      <article className="pl-card shrink-0">
        <p className="pl-label">极蓝智伴</p>
        <p className="text-sm text-muted">端侧理解意图 · 不调用外部大模型 · 不读取密码</p>
      </article>

      <div className="mt-3 flex-1 space-y-3 overflow-y-auto pb-2">
        {messages.length === 0 && (
          <p className="rounded-xl bg-soft px-4 py-6 text-center text-sm text-muted">
            你好，我是极蓝。可以帮你查余额、优化 Gas、解析转账指令。
          </p>
        )}
        {messages.map((m) => (
          <div key={m.id} className={m.role === "user" ? "pl-bubble-user" : "pl-bubble-ai"}>
            {m.role === "polaris" && <span className="mb-1 block text-[10px] font-semibold text-blue">极蓝</span>}
            {m.text}
          </div>
        ))}
        <div ref={bottom} />
      </div>

      <div className="mt-2 flex flex-wrap gap-2">
        {CHIPS.map((c) => (
          <button key={c} type="button" className="pl-chip" onClick={() => send(c)}>
            {c.length > 14 ? `${c.slice(0, 12)}…` : c}
          </button>
        ))}
      </div>

      <div className="mt-3 flex gap-2">
        <input
          className="pl-input flex-1"
          placeholder="用自然语言描述你想做的事…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
        />
        <button type="button" className="pl-btn shrink-0" onClick={() => send()}>
          发送
        </button>
      </div>
    </div>
  );
}

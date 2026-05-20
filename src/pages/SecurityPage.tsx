const LINKS = [
  {
    label: "钱包安全手册",
    href: "https://github.com/consenlabs/token-ui/tree/main/security",
    desc: "攻击场景、设计原则与开发自检",
  },
  {
    label: "链上签名内核",
    href: "https://github.com/consenlabs/token-core-monorepo",
    desc: "本钱包 WASM 签名能力来源",
  },
  {
    label: "CLI 交易理解 Demo",
    href: "https://github.com/consenlabs/token-core-monorepo/tree/demo/token-core-cli/token-core/tcx-examples/cli",
    desc: "分析 / 策略 / 模拟参考",
  },
];

const RULES = [
  "助记词与密码仅存本机，勿截图上传",
  "签发前走完蓝盾四步，大额务必勾选复核",
  "拒绝不明合约无限授权",
  "智伴不荐币、不预测行情，仅安全导航",
];

export function SecurityPage() {
  return (
    <div className="mt-2 space-y-4">
      <article className="pl-card-hero">
        <p className="pl-label">AI 安全防火墙</p>
        <h2 className="text-lg font-bold text-ink">端侧预检 + 开源手册</h2>
        <p className="mt-2 text-sm text-muted">
          签名在浏览器完成，密钥不上传。预检规则在本地运行，不依赖云端 AI。
        </p>
      </article>

      <ul className="space-y-2">
        {RULES.map((r) => (
          <li key={r} className="pl-card text-sm text-ink">
            <span className="font-semibold text-blue">✓</span> {r}
          </li>
        ))}
      </ul>

      <div className="space-y-2">
        {LINKS.map((l) => (
          <a
            key={l.href}
            href={l.href}
            target="_blank"
            rel="noreferrer"
            className="pl-card block transition hover:border-blue/40"
          >
            <p className="font-semibold text-blue">{l.label}</p>
            <p className="mt-1 text-xs text-muted">{l.desc}</p>
          </a>
        ))}
      </div>
    </div>
  );
}

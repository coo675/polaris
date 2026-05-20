import { CHAIN_LIST, getChain } from "./chains";
import { shortAddr } from "./utils";

export type IntentKind = "transfer" | "balance" | "gas" | "risk" | "help" | "unknown";

export interface PolarisIntent {
  kind: IntentKind;
  to?: string;
  amount?: string;
  chainId?: string;
}

export type RiskLevel = "safe" | "warn" | "danger";

export interface RiskReport {
  level: RiskLevel;
  title: string;
  reasons: string[];
  blocked: boolean;
}

export interface GasPlan {
  recommendedChainId: string;
  label: string;
  savingsPct: number;
  timing: string;
  note: string;
}

const PHISH = ["claim", "airdrop", "verify", "reward", "free"];

export function parseNaturalLanguage(text: string): PolarisIntent {
  const t = text.trim().toLowerCase();
  const addr = text.match(/0x[a-fA-F0-9]{40}/)?.[0];
  const amount = text.match(/(\d+(?:\.\d+)?)\s*(eth)?/i)?.[1];

  if (/余额|资产|多少钱|查询/.test(t)) return { kind: "balance" };
  if (/gas|手续费|矿工费|优化|网络费/.test(t)) return { kind: "gas" };
  if (/风险|安全|扫描|防火墙|钓鱼/.test(t)) return { kind: "risk" };
  if (/帮助|教程|怎么用/.test(t)) return { kind: "help" };

  if (/转|发送|打款|send|transfer/.test(t) && addr) {
    let chainId: string | undefined;
    if (/base/.test(t)) chainId = "base";
    else if (/主网|ethereum/.test(t)) chainId = "ethereum";
    else if (/测试|sepolia/.test(t)) chainId = "sepolia";
    return { kind: "transfer", to: addr, amount: amount || "0.001", chainId };
  }
  return { kind: "unknown" };
}

export function scanTransactionRisk(
  to: string,
  amount: string,
  from: string,
  memo?: string
): RiskReport {
  const reasons: string[] = [];
  let level: RiskLevel = "safe";
  let blocked = false;

  if (!/^0x[a-fA-F0-9]{40}$/.test(to.trim())) {
    reasons.push("收款地址格式异常");
    level = "danger";
    blocked = true;
  }
  if (to.toLowerCase() === from.toLowerCase()) {
    reasons.push("收款地址与发送地址相同");
    level = "warn";
  }
  const n = parseFloat(amount);
  if (!Number.isNaN(n) && n > 0.5) {
    reasons.push("单笔金额较大，请再次确认");
    level = "warn";
  }
  const m = (memo || "").toLowerCase();
  if (PHISH.some((w) => m.includes(w))) {
    reasons.push("备注含常见钓鱼关键词");
    level = "danger";
    blocked = true;
  }
  if (reasons.length === 0) reasons.push("端侧规则未发现已知高危特征");

  const title = level === "safe" ? "风险较低" : level === "warn" ? "请谨慎确认" : "已拦截高危操作";
  return { level, title, reasons, blocked };
}

/** 蓝盾指数 0–100，用于航线页可视化（非链上评分） */
export function computeShieldScore(report: RiskReport): number {
  if (report.blocked) return 12;
  if (report.level === "warn") return 58;
  return 92;
}

export function suggestGasPlan(currentChainId: string): GasPlan {
  const current = getChain(currentChainId);
  const alt = CHAIN_LIST.filter((c) => c.id !== currentChainId).sort(
    (a, b) => a.gasFactor - b.gasFactor
  )[0];
  if (!alt) {
    return {
      recommendedChainId: currentChainId,
      label: current.label,
      savingsPct: 0,
      timing: "当前网络",
      note: "保持当前链路",
    };
  }
  const savings = Math.round((1 - alt.gasFactor / current.gasFactor) * 100);
  return {
    recommendedChainId: alt.id,
    label: alt.label,
    savingsPct: Math.max(0, savings),
    timing: alt.testnet ? "测试网时段 Gas 通常更低" : "Layer2 推荐时段",
    note: "基于演示系数估算，实际以链上为准",
  };
}

export function polarisReply(
  input: string,
  ctx: { balance: string; symbol: string; address: string; chainLabel: string; chainId: string }
): string {
  const intent = parseNaturalLanguage(input);

  if (intent.kind === "balance") {
    return `当前 ${ctx.chainLabel} 可读余额约 ${ctx.balance} ${ctx.symbol}（地址 ${shortAddr(ctx.address)}）。链上为 0 时首页可能显示演示数值，请以 RPC 为准。`;
  }
  if (intent.kind === "gas") {
    const plan = suggestGasPlan(ctx.chainId);
    return `智能 Gas 建议：优先 ${plan.label}，约可省 ${plan.savingsPct}% 手续费（演示估算）。${plan.timing}。可在设置中切换网络。`;
  }
  if (intent.kind === "risk") {
    return "请打开「航线」页，按停靠点→载荷→蓝盾→签发四步完成。附言中的钓鱼词会被蓝盾拦截。";
  }
  if (intent.kind === "help") {
    return "流程：创建钱包 → 首页资产 → 智伴解析意图 → 航线四步签发。私钥与助记词仅存本机。";
  }
  if (intent.kind === "transfer" && intent.to) {
    return `已解析航线：${intent.amount} ${ctx.symbol} → ${shortAddr(intent.to)}。请前往「航线」页，从②载荷步继续。`;
  }
  if (/助记词|备份|seed/.test(input)) {
    return "助记词是恢复钱包的唯一凭证，请离线抄写，勿截图、勿发给任何人。";
  }
  if (/授权|approve|合约/.test(input)) {
    return "合约授权等于给对方钥匙。无限额度授权风险极高，不明合约请拒绝。";
  }
  return "你好，我是极蓝智伴。可以问：查余额、优化 Gas、转到 0x 地址、安全预检说明。我只做安全科普与操作引导。";
}

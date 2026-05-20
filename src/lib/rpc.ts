import type { ChainNode } from "./chains";

export function parseAmount(amount: string, decimals = 18): bigint {
  const t = amount.trim();
  if (!t || Number.isNaN(Number(t)) || Number(t) <= 0) throw new Error("金额无效");
  const [w, f = ""] = t.split(".");
  const pad = (f + "0".repeat(decimals)).slice(0, decimals);
  return BigInt(w) * 10n ** BigInt(decimals) + BigInt(pad || "0");
}

export async function fetchBalance(chain: ChainNode, address: string): Promise<string> {
  const res = await fetch(chain.rpcUrl!, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "eth_getBalance",
      params: [address, "latest"],
    }),
  });
  const j = (await res.json()) as { result?: string };
  const wei = BigInt(j.result || "0");
  const eth = Number(wei) / 1e18;
  return eth < 0.000001 ? "0" : eth.toFixed(6).replace(/\.?0+$/, "");
}

export async function fetchGasPrice(chain: ChainNode): Promise<bigint> {
  const res = await fetch(chain.rpcUrl!, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_gasPrice", params: [] }),
  });
  const j = (await res.json()) as { result?: string };
  return BigInt(j.result || "0");
}

export async function broadcastRaw(chain: ChainNode, raw: string): Promise<string> {
  const tx = raw.startsWith("0x") ? raw : `0x${raw}`;
  const res = await fetch(chain.rpcUrl!, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "eth_sendRawTransaction",
      params: [tx],
    }),
  });
  const j = (await res.json()) as { result?: string; error?: { message: string } };
  if (j.error) throw new Error(j.error.message);
  return j.result || "";
}

export function formatGwei(wei: bigint): string {
  const g = Number(wei) / 1e9;
  return g < 0.01 ? g.toExponential(2) : g.toFixed(2);
}

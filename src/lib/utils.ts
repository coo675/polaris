export function shortAddr(a: string, h = 6, t = 4): string {
  if (a.length < h + t + 2) return a;
  const head = h + (a.startsWith("0x") ? 2 : 0);
  return `${a.slice(0, head)}…${a.slice(-t)}`;
}

export function normalizeAddr(addr: string): string {
  const a = addr.trim();
  if (!/^0x[a-fA-F0-9]{40}$/.test(a)) throw new Error("地址格式无效");
  return a;
}

export function normalizePk(pk: string): string {
  const p = pk.trim().replace(/^0x/i, "");
  if (!/^[a-fA-F0-9]{64}$/.test(p)) throw new Error("私钥格式无效");
  return `0x${p}`;
}

export function demoBalanceEth(address: string): string {
  let h = 0;
  for (let i = 0; i < address.length; i++) h = (h * 31 + address.charCodeAt(i)) >>> 0;
  return (0.05 + (h % 3000) / 100000).toFixed(4);
}

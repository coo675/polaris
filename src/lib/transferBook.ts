const KEY = "polaris-docks";

export interface DockEntry {
  address: string;
  label: string;
  lastAt: number;
}

export function loadDocks(): DockEntry[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as DockEntry[]) : [];
  } catch {
    return [];
  }
}

export function rememberDock(address: string, label?: string): void {
  const addr = address.trim();
  if (!/^0x[a-fA-F0-9]{40}$/.test(addr)) return;
  const list = loadDocks().filter((d) => d.address.toLowerCase() !== addr.toLowerCase());
  list.unshift({
    address: addr,
    label: label?.trim() || `停靠 ${shortDock(addr)}`,
    lastAt: Date.now(),
  });
  localStorage.setItem(KEY, JSON.stringify(list.slice(0, 8)));
}

function shortDock(a: string): string {
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}

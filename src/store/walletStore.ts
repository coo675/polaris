import { create } from "zustand";
import { CHAINS, DEFAULT_CHAIN } from "../lib/chains";
import {
  clearSession,
  loadChainId,
  loadChatHistory,
  loadSession,
  saveChainId,
  saveChatHistory,
} from "../lib/walletCore";
import type { PolarisMessage, WalletSession } from "../types";

interface State {
  hydrated: boolean;
  session: WalletSession | null;
  chainId: string;
  balance: string;
  messages: PolarisMessage[];
  stablecoinGas: boolean;
  toast: { kind: "ok" | "err"; msg: string } | null;
  hydrate: () => void;
  setSession: (s: WalletSession | null) => void;
  setChain: (id: string) => void;
  setBalance: (v: string) => void;
  addMessage: (m: PolarisMessage) => void;
  toggleStablecoinGas: () => void;
  lock: () => void;
  toastOk: (m: string) => void;
  toastErr: (m: string) => void;
  clearToast: () => void;
}

export const useWalletStore = create<State>((set, get) => ({
  hydrated: false,
  session: null,
  chainId: DEFAULT_CHAIN,
  balance: "—",
  messages: [],
  stablecoinGas: true,
  toast: null,
  hydrate: () => {
    const session = loadSession();
    const cid = loadChainId() || DEFAULT_CHAIN;
    let messages: PolarisMessage[] = [];
    try {
      const raw = loadChatHistory();
      if (raw) messages = JSON.parse(raw) as PolarisMessage[];
    } catch {
      messages = [];
    }
    set({
      session,
      chainId: CHAINS[cid] ? cid : DEFAULT_CHAIN,
      messages,
      hydrated: true,
    });
  },
  setSession: (s) => set({ session: s }),
  setChain: (id) => {
    saveChainId(id);
    set({ chainId: id });
  },
  setBalance: (v) => set({ balance: v }),
  addMessage: (m) => {
    const next = [...get().messages, m];
    saveChatHistory(JSON.stringify(next));
    set({ messages: next });
  },
  toggleStablecoinGas: () => set((s) => ({ stablecoinGas: !s.stablecoinGas })),
  lock: () => {
    clearSession();
    set({ session: null, balance: "—", messages: [] });
    saveChatHistory("[]");
  },
  toastOk: (msg) => set({ toast: { kind: "ok", msg } }),
  toastErr: (msg) => set({ toast: { kind: "err", msg } }),
  clearToast: () => set({ toast: null }),
}));

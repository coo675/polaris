import { useEffect } from "react";
import { useWalletStore } from "../store/walletStore";

export function Toast() {
  const toast = useWalletStore((s) => s.toast);
  const clear = useWalletStore((s) => s.clearToast);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(clear, 3200);
    return () => clearTimeout(t);
  }, [toast, clear]);
  if (!toast) return null;
  return (
    <div
      className={`fixed left-1/2 top-4 z-[100] max-w-sm -translate-x-1/2 rounded-xl px-4 py-2.5 text-sm font-medium shadow-card ${
        toast.kind === "ok" ? "bg-ok text-white" : "bg-danger text-white"
      }`}
    >
      {toast.msg}
    </div>
  );
}

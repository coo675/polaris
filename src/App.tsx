import { useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { AiFab } from "./components/AiFab";
import { Toast } from "./components/Toast";
import { GatePage } from "./pages/GatePage";
import { HomePage } from "./pages/HomePage";
import { CopilotPage } from "./pages/CopilotPage";
import { SendPage } from "./pages/SendPage";
import { SecurityPage } from "./pages/SecurityPage";
import { SettingsPage } from "./pages/SettingsPage";
import { useWalletStore } from "./store/walletStore";

function Guard({ children }: { children: React.ReactNode }) {
  const session = useWalletStore((s) => s.session);
  if (!session) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  const hydrate = useWalletStore((s) => s.hydrate);
  const hydrated = useWalletStore((s) => s.hydrated);
  const session = useWalletStore((s) => s.session);
  useEffect(() => {
    hydrate();
  }, [hydrate]);
  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-panel text-sm text-muted">
        极蓝加载中…
      </div>
    );
  }
  const basename = import.meta.env.BASE_URL.replace(/\/$/, "") || undefined;
  return (
    <BrowserRouter basename={basename}>
      <Toast />
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<GatePage />} />
          <Route path="/home" element={<Guard><HomePage /></Guard>} />
          <Route path="/copilot" element={<Guard><CopilotPage /></Guard>} />
          <Route path="/send" element={<Guard><SendPage /></Guard>} />
          <Route path="/security" element={<Guard><SecurityPage /></Guard>} />
          <Route path="/settings" element={<Guard><SettingsPage /></Guard>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
      {session && <AiFab />}
    </BrowserRouter>
  );
}

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["system-ui", "Segoe UI", "PingFang SC", "Microsoft YaHei", "sans-serif"],
        mono: ["ui-monospace", "Consolas", "monospace"],
      },
      colors: {
        sky: "#f0f7ff",
        panel: "#ffffff",
        line: "#dbeafe",
        ink: "#0f172a",
        muted: "#64748b",
        blue: "#2563eb",
        blueDark: "#1d4ed8",
        blueLight: "#3b82f6",
        soft: "#eff6ff",
        warn: "#d97706",
        danger: "#dc2626",
        ok: "#059669",
      },
      boxShadow: {
        card: "0 4px 24px -4px rgba(37, 99, 235, 0.12)",
        btn: "0 8px 20px -6px rgba(37, 99, 235, 0.35)",
      },
    },
  },
  plugins: [],
};

import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#08392f",
        panel: "#f3f8f5",
        line: "#d7e7df",
        money: "#059669",
        labor: "#16a34a",
        reserve: "#0f766e",
        loan: "#ea580c",
        risk: "#dc2626",
      },
      boxShadow: {
        soft: "0 10px 30px rgba(8, 57, 47, 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;

import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: { DEFAULT: "#0f172a", soft: "#475569", mute: "#94a3b8" },
        surface: { DEFAULT: "#ffffff", alt: "#f6f7fb", line: "#e6e8ef" },
        brand: { DEFAULT: "#5b3df5", soft: "#efecff", dark: "#3f27c9" },
      },
      fontFamily: { sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"] },
      boxShadow: { card: "0 1px 2px rgba(15,23,42,.04), 0 4px 16px rgba(15,23,42,.04)" },
    },
  },
  plugins: [],
};
export default config;

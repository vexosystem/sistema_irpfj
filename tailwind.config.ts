import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        border: "#d4d4d8",
        background: "#f4f4f5",
        foreground: "#18181b",
        primary: "#0f172a",
        secondary: "#334155",
        muted: "#71717a",
        success: "#166534",
        warning: "#b45309",
        danger: "#b91c1c",
      },
    },
  },
  plugins: [],
};

export default config;

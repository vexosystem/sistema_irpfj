import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        border: "rgb(var(--border) / <alpha-value>)",
        background: "rgb(var(--background) / <alpha-value>)",
        foreground: "rgb(var(--foreground) / <alpha-value>)",
        primary: "rgb(var(--primary) / <alpha-value>)",
        secondary: "rgb(var(--secondary) / <alpha-value>)",
        muted: "rgb(var(--muted) / <alpha-value>)",
        success: "rgb(var(--success) / <alpha-value>)",
        warning: "rgb(var(--warning) / <alpha-value>)",
        danger: "rgb(var(--danger) / <alpha-value>)",
        surface: "rgb(var(--surface) / <alpha-value>)",
        "surface-strong": "rgb(var(--surface-strong) / <alpha-value>)",
      },
      boxShadow: {
        soft: "0 20px 60px -28px rgba(15, 23, 42, 0.35)",
      },
      backgroundImage: {
        "app-gradient":
          "radial-gradient(circle at top, rgba(59, 130, 246, 0.22), transparent 32%), radial-gradient(circle at 85% 20%, rgba(20, 184, 166, 0.18), transparent 24%)",
      },
    },
  },
  plugins: [],
};

export default config;

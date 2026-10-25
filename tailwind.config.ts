import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "#0B0F19",
        card: {
          DEFAULT: "#161F30",
          hover: "#1E293B",
          secondary: "#1E293B",
        },
        border: {
          DEFAULT: "#1E293B",
          subtle: "#2A374A",
          accent: "#06B6D4",
        },
        accent: {
          DEFAULT: "#06B6D4",
          hover: "#0891B2",
          light: "#00F5D4",
          glow: "rgba(6, 182, 212, 0.15)",
        },
        foreground: "#F8FAFC",
        muted: {
          DEFAULT: "#94A3B8",
          foreground: "#64748B",
        },
        success: {
          DEFAULT: "#10B981",
          foreground: "#ECFDF5",
        },
        warning: {
          DEFAULT: "#F59E0B",
          foreground: "#FFFBEB",
        },
        danger: {
          DEFAULT: "#EF4444",
          foreground: "#FEF2F2",
        },
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      boxShadow: {
        subtle: "0 1px 3px 0 rgba(0, 0, 0, 0.37), 0 1px 2px -1px rgba(0, 0, 0, 0.37)",
        card: "0 4px 20px -2px rgba(0, 0, 0, 0.5)",
        glow: "0 0 25px -5px rgba(6, 182, 212, 0.25)",
        glowCyan: "0 0 25px -5px rgba(0, 245, 212, 0.25)",
      },
    },
  },
  plugins: [],
};

export default config;

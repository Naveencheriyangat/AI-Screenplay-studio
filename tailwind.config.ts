import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#08090b",
          900: "#0c0e12",
          850: "#111318",
          800: "#15181e",
          700: "#1d212a",
          600: "#272c37",
        },
        accent: {
          DEFAULT: "#e0a458",
          soft: "#f0c489",
          dim: "#8a5f2c",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
        script: ["\"Courier Prime\"", "\"Courier New\"", "Courier", "monospace"],
      },
      boxShadow: {
        panel: "0 1px 0 rgba(255,255,255,0.04) inset, 0 20px 40px -30px rgba(0,0,0,0.9)",
      },
    },
  },
  plugins: [],
};

export default config;

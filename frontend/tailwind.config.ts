import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        aqua: {
          50: "#effcfa",
          100: "#c8f7f0",
          200: "#92eee2",
          300: "#5cded2",
          400: "#2fc5bc",
          500: "#16a9a3",
          600: "#0e8784",
          700: "#0f6c6a",
          800: "#115655",
          900: "#124747",
          950: "#03302f",
        },
        surface: {
          light: "#f6f9f9",
          dark: "#0b1220",
        },
        slate2: "#1e293b",
      },
      borderRadius: {
        xl2: "20px",
        xl3: "24px",
      },
      boxShadow: {
        soft: "0 2px 12px -2px rgba(15, 40, 40, 0.08), 0 8px 32px -8px rgba(15, 40, 40, 0.10)",
        lift: "0 4px 20px -4px rgba(15, 40, 40, 0.14), 0 16px 48px -12px rgba(15, 40, 40, 0.18)",
        glow: "0 0 0 1px rgba(22, 169, 163, 0.15), 0 8px 32px -8px rgba(22, 169, 163, 0.25)",
      },
      backgroundImage: {
        "aqua-gradient": "linear-gradient(135deg, #2fc5bc 0%, #16a9a3 50%, #0e8784 100%)",
        "soft-radial": "radial-gradient(1200px 600px at 10% -10%, rgba(47,197,188,0.12), transparent), radial-gradient(1000px 500px at 110% 10%, rgba(92,222,210,0.10), transparent)",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-400px 0" },
          "100%": { backgroundPosition: "400px 0" },
        },
      },
      animation: {
        shimmer: "shimmer 1.4s linear infinite",
      },
    },
  },
  plugins: [],
};
export default config;

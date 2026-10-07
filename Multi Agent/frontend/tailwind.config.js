/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        grid: {
          bg: "#080c14",
          card: "rgba(15, 23, 42, 0.45)",
          border: "rgba(255, 255, 255, 0.08)",
          glow: "rgba(6, 182, 212, 0.15)"
        },
        brand: {
          cyan: "#06b6d4",
          purple: "#a855f7",
          amber: "#f59e0b",
          emerald: "#10b981",
          rose: "#f43f5e"
        }
      },
      backdropBlur: {
        xs: "2px",
      },
      boxShadow: {
        glass: "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
        "glass-glow": "0 8px 32px 0 rgba(6, 182, 212, 0.12)",
      }
    },
  },
  plugins: [],
}

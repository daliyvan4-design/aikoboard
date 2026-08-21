import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#0A0A0A",
        ink2: "#141414",
        ink3: "#1F1F1F",
        gold: "#C8A951",
        gold2: "#B59530",
        cream: "#FFFFFF",
        cream2: "#F5F5F5",
        line: "#E5E5E5",
        mute: "#888888",
        ok: "#2E7D52",
        err: "#C0392B",
        mining: "#C8A951",
        oil: "#050505",
        energy: "#C8A951",
      },
      fontFamily: {
        serif: ['"Playfair Display"', "serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "none",
        float: "0 12px 36px -22px rgba(10,10,10,.18)",
        inner1: "inset 0 0 0 1px rgba(10,10,10,.06)",
      },
      keyframes: {
        fadeUp: {
          from: { opacity: "0", transform: "translateY(6px)" },
          to: { opacity: "1", transform: "none" },
        },
        draw: {
          to: { strokeDashoffset: "0" },
        },
        slowZoom: {
          from: { transform: "scale(1.08)" },
          to: { transform: "scale(1)" },
        },
        riseIn: {
          from: { opacity: "0", transform: "translateY(14px)" },
          to: { opacity: "1", transform: "none" },
        },
      },
      animation: {
        "fade-up": "fadeUp .35s ease both",
        draw: "draw 700ms .25s ease forwards",
        "draw-circle": "draw 900ms ease forwards",
        "slow-zoom": "slowZoom 24s cubic-bezier(.16,.84,.44,1) both",
        "rise-in": "riseIn .7s cubic-bezier(.16,.84,.44,1) both",
      },
    },
  },
  plugins: [],
};
export default config;

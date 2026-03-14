import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
    "./modules/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#172033",
        shell: "#f4f1e8",
        signal: "#c1ff72",
        copper: "#cb7d4f",
        mist: "#d9d3c4"
      },
      boxShadow: {
        panel: "0 18px 60px rgba(23, 32, 51, 0.12)"
      },
      backgroundImage: {
        "radial-shell":
          "radial-gradient(circle at top left, rgba(193, 255, 114, 0.32), transparent 34%), radial-gradient(circle at bottom right, rgba(203, 125, 79, 0.18), transparent 30%)"
      }
    }
  },
  plugins: []
};

export default config;


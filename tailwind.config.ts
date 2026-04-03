import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Dark navy theme from wireframes
        navy: {
          950: "#070e1a",
          900: "#0b1628",
          800: "#0f1e35",
          700: "#152540",
          600: "#1a2d4e",
          500: "#1e3560",
        },
        clinical: {
          blue: "#3b82f6",
          "blue-bright": "#60a5fa",
          "blue-dim": "#1d4ed8",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "card-gradient":
          "linear-gradient(135deg, rgba(59,130,246,0.1) 0%, rgba(11,22,40,0) 100%)",
      },
    },
  },
  plugins: [],
};
export default config;

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
        brand: {
          50: "#faf8f5",
          100: "#f3ede3",
          200: "#e6d7c2",
          300: "#d7bd9c",
          400: "#c7a075",
          500: "#ba8958",
          600: "#a97349",
          700: "#8a5a3c",
          800: "#704935",
          900: "#5c3d2e",
          950: "#321e17",
          gold: "#cda052",
          champagne: "#dfc08a",
        },
        surface: {
          50: "#f8fafc",
          100: "#f1f5f9",
          800: "#14171f",
          850: "#10131a",
          900: "#0b0d13",
          950: "#07080c",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Outfit", "sans-serif"],
        serif: ["var(--font-serif)", "Cinzel", "Playfair Display", "serif"],
      },
      boxShadow: {
        glow: "0 0 25px -5px rgba(205, 160, 82, 0.25)",
        glass: "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [],
};
export default config;

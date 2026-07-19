/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#12181B",
        paper: "#F7F5F0",
        ledger: {
          50: "#F1F7F4",
          100: "#DCEEE4",
          200: "#B4DBC6",
          500: "#1F7A4D",
          600: "#186339",
          700: "#124B2B",
        },
        rupee: "#B5581F",
        alert: "#B4232C",
      },
      fontFamily: {
        display: ["'Spectral'", "serif"],
        mono: ["'IBM Plex Mono'", "monospace"],
        body: ["'Inter'", "sans-serif"],
      },
    },
  },
  plugins: [],
};

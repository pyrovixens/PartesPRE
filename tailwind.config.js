/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        bomberos: {
          red: "#C91414",
          darkred: "#8F0D0D",
          lightred: "#FEE2E2",
          gold: "#D4AF37",
          yellow: "#FBBF24",
          blue: "#1E3A8A",
          darkblue: "#0F172A",
          cuartel: "#111827",
        },
      },
    },
  },
  plugins: [],
};

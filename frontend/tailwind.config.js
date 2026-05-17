/** @type {import('tailwindcss').Config} */
module.exports = {
  // Light-only design: darkMode disabled (Concept 2)
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      colors: {
        // Brand palette (Concept 2)
        brand: {
          DEFAULT: "#185FA5",
          light:   "#E6F1FB",
          hover:   "#145090",
        },
        // Status colours
        positive: {
          DEFAULT: "#0F6E56",
          bg:      "#E1F5EE",
        },
        negative: {
          DEFAULT: "#993C1D",
          bg:      "#FAECE7",
        },
        neutral: {
          DEFAULT: "#854F0B",
          bg:      "#FAEEDA",
        },
        // Chart line colours (for reference in JS)
        chart: {
          historical: "#378ADD",
          forecast:   "#1D9E75",
        },
      },
      borderColor: {
        DEFAULT: "#E2E8F0",
      },
    },
  },
  plugins: [],
};

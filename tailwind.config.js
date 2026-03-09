/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#f7e1e8",
        "background-light": "#f8f6f7",
        "background-dark": "#1f1317",
        "card-light": "#ffffff",
        "card-dark": "#261933",
        "border-light": "#e5e7eb",
        "border-dark": "#4d3267",
        "text-primary-light": "#1f2937",
        "text-primary-dark": "#ffffff",
        "text-secondary-light": "#6b7280",
        "text-secondary-dark": "#ad92c9"
      },
      fontFamily: {
        display: "Manrope"
      },
      borderRadius: {
        DEFAULT: "1rem",
        lg: "2rem",
        xl: "3rem",
        full: "9999px"
      }
    },
  },
  plugins: [],
}

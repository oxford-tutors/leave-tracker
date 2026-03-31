/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        oxford: "#202641",
        gold:   "#d1b378",
        cambridge: "#a4d3d1",
      },
      fontFamily: {
        display: ["Montserrat", "sans-serif"],
        body:    ["Open Sans", "sans-serif"],
      },
    },
  },
  plugins: [],
}

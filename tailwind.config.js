/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx}", "./components/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0E1117",
        bgElevado: "#161A22",
        texto: "#E6EDF3",
        textoFraco: "#7D8590",
        destaque: "#2F81F7",
        borda: "#30363D",
      },
    },
  },
  plugins: [],
};

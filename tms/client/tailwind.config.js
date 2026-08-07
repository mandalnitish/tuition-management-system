/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        ink: "#1F2A44",
        inkLight: "#2E3B5C",
        paper: "#FBF9F4",
        marigold: "#E8A33D",
        marigoldDark: "#C97F1E",
        sage: "#4C7A5E",
        rust: "#B4483A",
        slate: "#5B6472",
        borderc: "#E4DFD3",
      },
      fontFamily: {
        display: ["'Zilla Slab'", "Georgia", "serif"],
        body: ["Inter", "system-ui", "sans-serif"],
        mono: ["'IBM Plex Mono'", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};

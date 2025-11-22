/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Habilita modo escuro via classe CSS
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['Roboto Slab', 'serif'],
      },
      colors: {
        cmurb: {
          laranja: '#F78645',
          vinho: '#893232',
          vinhoDark: '#6d2828', // Um tom mais escuro para hovers/dark mode
        }
      }
    },
  },
  plugins: [],
}


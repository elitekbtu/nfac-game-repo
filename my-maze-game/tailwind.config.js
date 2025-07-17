/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        su: {
          blue: '#0077C8',
          turquoise: '#00B2A9',
          light: '#F2F2F2',
          dark: '#222E3A',
        }
      },
      fontFamily: {
        su: ['Montserrat', 'Roboto', 'Open Sans', 'Arial', 'sans-serif'],
      },
      borderRadius: {
        su: '14px',
      },
      boxShadow: {
        su: '0 2px 12px 0 rgba(0, 119, 200, 0.08)',
      }
    }
  },
  plugins: [],
}


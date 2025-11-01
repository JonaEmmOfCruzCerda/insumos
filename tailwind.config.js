/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  // Agregar safelist para permitir cualquier color
  safelist: [
    {
      pattern: /(bg|text|border|ring)-(red|green|blue|yellow|indigo|purple|pink|gray|orange|teal|cyan|emerald|lime|amber|rose|violet|fuchsia|sky|slate|zinc|neutral|stone)-(50|100|200|300|400|500|600|700|800|900)/,
    },
    {
      pattern: /(bg|text|border|ring)-(black|white|transparent|current)/,
    },
  ],
  theme: {
    extend: {
      colors: {
        primary: '#3498db',
        secondary: '#2c3e50',
        success: '#2ecc71',
        warning: '#f39c12',
        danger: '#e74c3c',
      },
      // Extender max-width para incluir 8xl
      maxWidth: {
        '8xl': '88rem',
        '9xl': '96rem',
      }
    },
  },
  plugins: [],
}
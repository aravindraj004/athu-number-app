/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#08080a',
        charcoal: '#0e0e11',
        panel: '#141418',
        panel2: '#1b1b21',
        line: '#26262e',
        gold: {
          DEFAULT: '#e7b73c',
          soft: 'rgba(231,183,60,0.14)',
          dim: 'rgba(231,183,60,0.45)',
        },
        blue: {
          DEFAULT: '#4f8cff',
          soft: 'rgba(79,140,255,0.14)',
          dim: 'rgba(79,140,255,0.45)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        card: '0 10px 30px rgba(0,0,0,0.35)',
      },
    },
  },
  plugins: [],
}

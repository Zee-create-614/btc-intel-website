/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bitcoin: {
          50: '#fefaf5',
          100: '#fef3e2',
          200: '#fde4c4',
          300: '#fbd0a1',
          400: '#f8b871',
          500: '#ff8c00',
          600: '#e6751a',
          700: '#cc5e14',
          800: '#b34d16',
          900: '#8b3a15',
          950: '#2c1810',
        },
        mstr: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49',
        },
      },
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'Consolas', 'Monaco', 'monospace'],
      },
    },
  },
  plugins: [],
}
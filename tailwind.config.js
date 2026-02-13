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
          50: '#fefbf3',
          100: '#fdf4e1',
          200: '#fae6c4',
          300: '#f6d49c',
          400: '#f0b968',
          500: '#eb9d42',
          600: '#dc7f2a',
          700: '#b66426',
          800: '#924e27',
          900: '#764124',
          950: '#402010',
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
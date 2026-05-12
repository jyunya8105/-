/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fef7ee',
          100: '#fdedd3',
          200: '#fad7a6',
          300: '#f6ba70',
          400: '#f19437',
          500: '#ed7615',
          600: '#de5d0b',
          700: '#b8450b',
          800: '#933810',
          900: '#772f10',
          950: '#401506',
        }
      }
    }
  },
  plugins: [],
}

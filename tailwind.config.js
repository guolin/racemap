/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          100: 'var(--primary-100)',
          200: 'var(--primary-200)',
          300: 'var(--primary-300)',
        },
        accent: {
          100: 'var(--accent-100)',
          200: 'var(--accent-200)',
        },
        text: {
          100: 'var(--text-100)',
          200: 'var(--text-200)',
        },
        bg: {
          100: 'var(--bg-100)',
          200: 'var(--bg-200)',
          300: 'var(--bg-300)',
        },
        gray: {
          900: 'var(--text-100)',
          800: 'var(--text-200)',
          700: 'var(--bg-300)',
          600: 'var(--bg-300)',
          500: 'var(--bg-300)',
          200: 'var(--bg-200)',
        },
      },
    },
  },
  plugins: [require('tailwindcss-safe-area')],
}


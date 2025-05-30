/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/**/*.{html,ts}'
  ],
  theme: {
    extend: {
      colors: {
        cardBg: 'var(--card-bg)',
        cardBorder: 'var(--card-border)',
        inputBg: 'var(--input-bg)',
        inputBorder: 'var(--input-border)',
        inputText: 'var(--input-text)',
      }
    }
  },
  plugins: [],
}

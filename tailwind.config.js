/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx}','./components/**/*.{js,jsx}'],
  theme: { extend: { colors: { brand: { red: '#B91C1C', dark: '#111827', ink: '#0A0A0A' } } } },
  plugins: [],
}

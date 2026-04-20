/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        brand: { 50:'#e8f4f8',100:'#c5e2ee',200:'#9fcfe3',300:'#72bcd7',400:'#4daecf',500:'#1A9EC6',600:'#1A5F7A',700:'#134d63',800:'#0d3b4c',900:'#072936' },
        gold:  { 400:'#E8C547', 500:'#C9A84C', 600:'#a8893c' },
      },
      fontFamily: { sans: ['Inter','system-ui','sans-serif'], arabic: ['Noto Sans Arabic','sans-serif'] },
    },
  },
  plugins: [],
};

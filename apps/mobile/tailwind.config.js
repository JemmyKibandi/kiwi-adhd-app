/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        kiwi: {
          primary: '#7CB518',
          dark: '#4A7A0A',
          light: '#C8E6A0',
          pale: '#F0F7E6',
          brown: '#8B5E3C',
          cream: '#FDF6EC',
          text: '#2D2D2D',
          muted: '#7A7A7A',
        },
      },
      fontFamily: {
        sans: ['System'],
      },
    },
  },
  plugins: [],
}

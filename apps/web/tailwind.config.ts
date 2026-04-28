import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
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
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config

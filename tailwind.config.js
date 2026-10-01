/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        void: '#1B1530',
        deck: '#2E2847',
        chalk: '#FFF8EA',
        fog: '#B5AECB',
        cream: '#F2E8D5',
        ink: '#120E20',
        chips: '#1FA2FF',
        mult: '#FF4B4B',
        gold: '#FFB21E',
        mint: '#3FCB8A',
        builders: '#FFD400',
        speedrunners: '#4BE38A',
        nightcrawlers: '#B26BFF',
        looters: '#FF7A1A',
      },
      fontFamily: {
        display: ['"Jersey 10"', 'monospace'],
        ui: ['"Jersey 10"', 'monospace'],
      },
      fontSize: {
        xs: ['16px', '1'],
        sm: ['18px', '1.05'],
        base: ['20px', '1.1'],
        lg: ['24px', '1.05'],
        xl: ['28px', '1'],
      },
    },
  },
  plugins: [],
}

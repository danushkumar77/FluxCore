/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gridDark: '#081018',
        gridLightDark: '#0e1b29',
        gridProfit: '#00E676',
        gridEnergy: '#00C8FF',
        gridWarning: '#FF9800',
        gridCritical: '#F44336',
        gridAI: '#7C4DFF',
        borderMuted: '#1a2e40'
      },
      fontFamily: {
        mono: ['Courier New', 'Courier', 'monospace'],
      }
    },
  },
  plugins: [],
}

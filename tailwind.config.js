/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        pitch: {
          bg: '#0D1117',
          card: 'rgba(22, 27, 34, 0.7)',
          border: 'rgba(255, 255, 255, 0.08)',
          emerald: '#10B981',
          gold: '#F59E0B',
          cyan: '#06B6D4',
          error: '#EF4444',
          gray: {
            100: '#F3F4F6',
            200: '#E5E7EB',
            300: '#D1D5DB',
            400: '#9CA3AF',
            500: '#6B7280',
            600: '#4B5563',
            700: '#374151',
            800: '#1F2937',
            900: '#111827',
          }
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        sporty: ['Outfit', 'sans-serif'],
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
}

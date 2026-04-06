/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        peak: {
          bg: '#0a0a0a',
          accent: '#38bdf8',
          high: '#ef4444',
          medium: '#eab308',
          optional: '#22c55e',
          surface: '#111111',
          border: '#1e293b',
          'accent-dim': '#0c1a2e',
        },
      },
      animation: {
        'xp-float': 'xpFloat 1.4s ease-out forwards',
        'fade-in': 'fadeIn 0.15s ease-out',
        'level-up': 'levelUp 2.2s ease-out forwards',
        'form-dip': 'fadeIn 0.3s ease-out',
      },
      keyframes: {
        xpFloat: {
          '0%':   { opacity: '1', transform: 'translateY(0px)' },
          '100%': { opacity: '0', transform: 'translateY(-56px)' },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        levelUp: {
          '0%':   { opacity: '0', transform: 'scale(0.7)' },
          '20%':  { opacity: '1', transform: 'scale(1.15)' },
          '70%':  { opacity: '1', transform: 'scale(1)' },
          '100%': { opacity: '0', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
}

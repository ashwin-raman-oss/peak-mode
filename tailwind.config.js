/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        peak: {
          sidebar:          '#18181B',
          'sidebar-hover':  '#27272A',
          'sidebar-active': '#27272A',
          'sidebar-text':   '#71717A',
          'sidebar-border': '#27272A',
          bg:               '#F8F9FA',
          surface:          '#FFFFFF',
          border:           '#E4E4E7',
          text:             '#09090B',
          muted:            '#71717A',
          accent:           '#F59E0B',
          'accent-light':   '#FEF3C7',
          success:          '#22C55E',
          'success-light':  '#F0FDF4',
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

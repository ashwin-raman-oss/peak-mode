/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        peak: {
          bg:           '#F8F9FA',
          surface:      '#FFFFFF',
          elevated:     '#F1F3F5',
          border:       '#E5E7EB',
          muted:        '#9CA3AF',
          text:         '#374151',
          primary:      '#111827',
          accent:       '#2D5BE3',
          'accent-light': '#EEF2FF',
          xp:           '#D97706',
          success:      '#059669',
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

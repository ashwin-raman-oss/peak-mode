/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        peak: {
          bg:         '#080808',
          surface:    '#111111',
          elevated:   '#1A1A1A',
          border:     '#222222',
          muted:      '#555555',
          text:       '#999999',
          primary:    '#F0EDE8',
          accent:     '#E8E0D0',   // warm off-white — primary accent
          xp:         '#C9A84C',   // muted gold — XP/level only
          'accent-dim': '#1C1A17',
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

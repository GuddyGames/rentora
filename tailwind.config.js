/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        midnight: '#0F172A',
        midnightdeep: '#0B1220',
        gold: '#F5B400',
        royal: '#3B82F6',
        emerald: '#10B981',
        ruby: '#EF4444',
        mist: '#F8FAFC',
        muted: '#94A3B8',
        card: '#FFFFFF',
      },
      fontFamily: {
        display: ['"Fraunces"', 'serif'],
        body: ['"Inter"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      backgroundImage: {
        hero: 'radial-gradient(circle at 20% 20%, #16213D 0%, #0F172A 45%, #0B1220 100%)',
      },
      keyframes: {
        'confetti-fall': {
          '0%': { transform: 'translateY(-10vh) rotate(0deg)', opacity: '1' },
          '100%': { transform: 'translateY(110vh) rotate(540deg)', opacity: '0.9' },
        },
        'pop-in': {
          '0%': { transform: 'scale(0.85)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      animation: {
        'confetti-fall': 'confetti-fall linear forwards',
        'pop-in': 'pop-in 0.35s ease-out forwards',
      },
    },
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        jerry: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde047',
          300: '#facc15',
          400: '#eab308',
          500: '#ffc83b', // Jerry Cheese Main Yellow
          600: '#ff9f1c', // Warm Cheese Orange
          700: '#e07a5f',
          800: '#9e2a2b',
          900: '#3d0c11',
          accent: '#ff477e', // Vibrant Pink Accent
          purple: '#6c5ce7',
          soop: '#00c73c', // SOOP Green Brand color
          naver: '#03cf5d', // Naver Green
          youtube: '#ff0000', // Youtube Red
        },
        card: {
          light: '#ffffff',
          dark: '#1e1e2d',
        },
        bg: {
          light: '#faf8f5',
          dark: '#14141f',
        }
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'Pretendard', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        bounceSlow: {
          '0%, 100%': { transform: 'translateY(-3%)' },
          '50%': { transform: 'translateY(0)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '1', filter: 'drop-shadow(0 0 8px rgba(255, 200, 59, 0.6))' },
          '50%': { opacity: '0.8', filter: 'drop-shadow(0 0 16px rgba(255, 159, 28, 0.9))' },
        },
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
      animation: {
        'bounce-slow': 'bounceSlow 3s infinite ease-in-out',
        'pulse-glow': 'pulseGlow 2s infinite ease-in-out',
        'marquee': 'marquee 20s linear infinite',
      }
    },
  },
  plugins: [],
}

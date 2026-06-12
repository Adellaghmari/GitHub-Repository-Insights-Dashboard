/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        graphite: {
          50: '#f6f6f7',
          100: '#e8e8ea',
          200: '#d1d1d6',
          300: '#a8a8b0',
          400: '#7a7a85',
          500: '#5c5c66',
          600: '#4a4a53',
          700: '#3d3d45',
          800: '#2a2a30',
          900: '#1a1a1f',
          950: '#0f0f12',
        },
        emerald: {
          accent: '#10b981',
          glow: '#34d399',
        },
        cyan: {
          accent: '#06b6d4',
        },
        amber: {
          risk: '#f59e0b',
        },
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', '"Fira Code"', 'Consolas', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px 0 rgb(15 15 18 / 0.04), 0 1px 3px 0 rgb(15 15 18 / 0.06)',
        'card-md': '0 4px 12px -2px rgb(15 15 18 / 0.06), 0 2px 6px -2px rgb(15 15 18 / 0.04)',
        'card-lg': '0 8px 24px -4px rgb(15 15 18 / 0.08), 0 4px 12px -4px rgb(15 15 18 / 0.04)',
        'card-hover': '0 12px 32px -8px rgb(15 15 18 / 0.12), 0 4px 16px -4px rgb(15 15 18 / 0.06)',
        rail: 'inset -1px 0 0 0 rgb(42 42 48 / 0.5)',
        'glow-emerald': '0 0 24px -6px rgba(16, 185, 129, 0.4)',
        'glow-emerald-sm': '0 0 16px -4px rgba(16, 185, 129, 0.3)',
      },
      animation: {
        'pulse-soft': 'pulse-soft 2.5s ease-in-out infinite',
      },
      keyframes: {
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.45' },
        },
      },
    },
  },
  plugins: [],
};

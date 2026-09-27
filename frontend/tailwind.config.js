/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        cosmic: {
          950: '#05070e',
          900: '#0a0e1a',
          850: '#0f1526',
          800: '#141d33',
          700: '#1e2b4c',
          600: '#2a3b68',
        },
        quantum: {
          cyan: '#00f0ff',
          neon: '#0df',
          plasma: '#a855f7',
          thrust: '#06b6d4',
          amber: '#f59e0b',
          emerald: '#10b981',
          danger: '#f43f5e',
        },
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'levitate': '0 12px 32px -4px rgba(0, 240, 255, 0.18), 0 4px 16px -2px rgba(139, 92, 246, 0.12)',
        'levitate-hover': '0 20px 40px -4px rgba(0, 240, 255, 0.3), 0 8px 24px -2px rgba(139, 92, 246, 0.25)',
        'quantum-glow': '0 0 20px rgba(0, 240, 255, 0.35)',
        'plasma-glow': '0 0 25px rgba(168, 85, 247, 0.35)',
      },
      animation: {
        'float-slow': 'float 6s ease-in-out infinite',
        'float-medium': 'float 4s ease-in-out infinite',
        'pulse-subtle': 'pulseSubtle 3s ease-in-out infinite',
        'scanline': 'scanline 8s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
      },
    },
  },
  plugins: [],
};

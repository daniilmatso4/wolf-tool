/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/renderer/src/**/*.{js,ts,jsx,tsx}', './src/renderer/index.html'],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#050816',
          900: '#0a0e27',
          800: '#111640',
          700: '#1a2050',
          600: '#252d6b'
        },
        gold: {
          DEFAULT: '#d4a843',
          light: '#e8c96a',
          dark: '#b08a2e'
        },
        status: {
          new: '#3b82f6',
          contacted: '#f59e0b',
          interested: '#f97316',
          client: '#22c55e',
          'not-interested': '#6b7280'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif']
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
        'ping-slow': 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
        'progress': 'progress 2s ease-in-out infinite'
      },
      keyframes: {
        progress: {
          '0%': { width: '0%', marginLeft: '0%' },
          '50%': { width: '60%', marginLeft: '20%' },
          '100%': { width: '0%', marginLeft: '100%' }
        }
      }
    }
  },
  plugins: []
}

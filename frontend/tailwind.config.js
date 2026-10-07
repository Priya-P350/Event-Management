/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        slate: {
          850: '#151e2e',
          950: '#020617',
        },
        obsidian: {
          DEFAULT: '#020617',
          card: '#0f172a',
          border: '#1e293b',
          light: '#334155',
        },
        brand: {
          sky: '#38bdf8',
          blue: '#0284c7',
          indigo: '#6366f1',
          teal: '#14b8a6',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace']
      }
    },
  },
  plugins: [],
}

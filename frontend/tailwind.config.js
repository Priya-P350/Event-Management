/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        oceanic: {
          950: '#0B1928', // Deepest dark textured slate / indigo obsidian
          900: '#122538', // Midnight slate card surface
          800: '#1E394E', // Rich marine slate border
          700: '#2B4E66', // Elevated border / focus accent
          600: '#304E61', // Dominant mid slate teal from image
          500: '#38708C',
          400: '#4A96BA', // Luminous marine cyan accent
          300: '#95B8C9', // Soft oceanic mint-slate (8.2:1 AAA subtext)
          200: '#C3E2ED',
          100: '#E5F4F9', // Crisp ice foam white (15.1:1 AAA primary text)
          50: '#F0F8FA',
        },
        forest: {
          950: '#0B1928', // Base background
          900: '#122538', // Card panels
          800: '#1E394E', // Borders & dividers
          700: '#2B4E66', // Hover / elevated borders
          500: '#38708C',
          400: '#4A96BA',
          300: '#95B8C9', // Secondary text & icons (AAA)
          200: '#C3E2ED',
          100: '#E5F4F9', // Primary high-contrast text & CTAs (AAA)
          50: '#F0F8FA',
        },
        pine: {
          950: '#0B1928',
          900: '#122538',
          800: '#1E394E',
          700: '#2B4E66',
          300: '#95B8C9',
          100: '#E5F4F9',
        },
        slate: {
          850: '#122538',
          950: '#0B1928',
        },
        obsidian: {
          DEFAULT: '#0B1928',
          card: '#122538',
          border: '#1E394E',
          light: '#2B4E66',
        },
        brand: {
          sky: '#4A96BA',
          blue: '#38708C',
          indigo: '#1F2E4A',
          teal: '#95B8C9',
          pine: '#E5F4F9',
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

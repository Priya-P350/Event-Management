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
          950: '#020817', // Deepest midnight abyssal ocean
          900: '#041124', // Deep trench card / panel background
          850: '#061730', // Elevated deep sea glass
          800: '#071d38', // Ocean shelf border / elevated container
          700: '#0c2c52', // Twilight ocean border / accent border
          600: '#0f3a69', // Sunlit marine blue
          500: '#0284c7', // Ocean blue accent
          400: '#38bdf8', // Bioluminescent sky aqua
          300: '#67e8f9', // Bioluminescent electric cyan
          200: '#bae6fd', // Glacial foam
          100: '#e0f2fe', // Crisp ice foam white (primary text)
          50: '#f0fdfa',  // Pearl highlights
        },
        forest: {
          // Backward compatibility mapped to deep ocean
          950: '#020817',
          900: '#041124',
          800: '#071d38',
          700: '#0c2c52',
          500: '#0284c7',
          400: '#38bdf8',
          300: '#7dd3fc',
          200: '#bae6fd',
          100: '#e0f2fe',
          50: '#f0fdfa',
        },
        pine: {
          950: '#020817',
          900: '#041124',
          800: '#071d38',
          700: '#0c2c52',
          300: '#7dd3fc',
          100: '#e0f2fe',
        },
        slate: {
          850: '#041124',
          950: '#020817',
        },
        obsidian: {
          DEFAULT: '#020817',
          card: '#041124',
          border: '#071d38',
          light: '#0c2c52',
        },
        brand: {
          sky: '#38bdf8',
          blue: '#0284c7',
          indigo: '#071d38',
          teal: '#2dd4bf',
          pine: '#e0f2fe',
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

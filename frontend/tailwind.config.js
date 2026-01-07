/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#06b6d4', // Türkis (cyan-500)
          50: '#ecfeff',
          100: '#cffafe',
          200: '#a5f3fc',
          300: '#67e8f9',
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
          700: '#0e7490',
          800: '#155e75',
          900: '#164e63',
        },
        secondary: {
          DEFAULT: '#a7f3d0', // Grün (emerald-200)
        },
        destructive: {
          DEFAULT: '#f87171', // Rot (red-400)
        },
        card: '#f0fdfa', // sehr helles Türkis
        border: '#bae6fd', // helles Blau
        background: '#f0fdfa', // sehr helles Türkis
        foreground: '#0f172a', // fast schwarz
        'muted-foreground': '#64748b', // blau-grau
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.5rem',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}


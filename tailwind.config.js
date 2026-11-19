/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  // NOTE: Update this to include the paths to all of your component files.
  content: [
    "./src/app/**/*.{js,jsx,ts,tsx}",
    "./src/components/**/*.{js,jsx,ts,tsx}",
    "./src/features/**/*.{js,jsx,ts,tsx}"
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'Plus Jakarta Sans', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        oil: {
          light: '#FFFBEB', // amber-50
          DEFAULT: '#F59E0B', // amber-500
          dark: '#B45309', // amber-700
          deep: '#78350F', // amber-900
        },
        brand: {
          primary: '#0F172A',
          dark: '#0F172A',
          accent: '#10B981',
        }
      },
    },
  },
  plugins: [],
}

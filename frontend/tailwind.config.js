/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}"
  ],
  theme: {
    extend: {
      colors: {
        // Brand Color: Amber
        primary: {
          DEFAULT: '#ffba16', // Main (Amber)
          hover: '#e6a814',   // Hover
          text: '#1f1f1f',    // Text on primary button
        },
        // Base Grayscale (Supabase Surface)
        surface: {
          100: '#1C1C1C', // App Background
          200: '#232323', // Card/Panel Background
          300: '#2E2E2E', // Borders
          400: '#3E3E3E', // Input Background / Hover
          500: '#858585', // Muted Text
          600: '#EDEDED', // Main Text
        },
        // Semantic
        success: '#3ECF8E', // Supabase Green
        danger: '#FF4D4D',  // Red
        warning: '#F1C40F', // Yellow
        // Alert Tier Colors
        tier: {
          s: '#ffba16',  // Amber (최고 등급 - 글로우 효과와 함께 사용)
          a: '#F1C40F',  // Yellow (중요)
          b: '#EDEDED',  // White (주의)
          c: '#858585',  // Gray (일반)
        },
        // Legacy color names (for backward compatibility)
        mist: '#858585',  // Same as surface-500
        brand: {
          DEFAULT: '#ffba16',  // Same as primary
          hover: '#e6a814',    // Same as primary-hover
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Inter', 'sans-serif'],
        mono: ['SF Mono', 'Monaco', 'Cascadia Code', 'Roboto Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}

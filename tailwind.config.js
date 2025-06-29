/** @type {import('tailwindcss').Config} */
import defaultTheme from 'tailwindcss/defaultTheme'

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Use defaultTheme.colors to ensure proper color resolution
      colors: {
        ...defaultTheme.colors,
        // Explicitly define basic colors for theme() function compatibility
        white: '#ffffff',
        black: '#000000',
        transparent: 'transparent',
        current: 'currentColor',
      },
      // Include default theme values for other properties that might be used with theme()
      fontFamily: defaultTheme.fontFamily,
      fontSize: defaultTheme.fontSize,
      fontWeight: defaultTheme.fontWeight,
      spacing: defaultTheme.spacing,
      borderRadius: defaultTheme.borderRadius,
      boxShadow: defaultTheme.boxShadow,
      transitionDuration: defaultTheme.transitionDuration,
      transitionTimingFunction: defaultTheme.transitionTimingFunction,
      screens: defaultTheme.screens,
      lineHeight: defaultTheme.lineHeight,
    },
  },
  plugins: [],
}
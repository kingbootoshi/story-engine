/** @type {import('tailwindcss').Config} */
import { colors } from 'tailwindcss/colors'
import defaultTheme from 'tailwindcss/defaultTheme'

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Include all default Tailwind colors to make them available to theme() function
      colors: {
        ...colors,
        // Ensure basic colors are available
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
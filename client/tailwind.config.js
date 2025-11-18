/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'notion-bg': '#ffffff',
        'notion-bg-secondary': '#f7f6f3',
        'notion-text': '#37352f',
        'notion-text-secondary': '#787774',
        'notion-border': '#e9e9e7',
        'notion-hover': '#f1f1ef',
        'notion-blue': '#2383e2',
        'notion-blue-hover': '#1f7ed4',
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Helvetica',
          'Apple Color Emoji',
          'Arial',
          'sans-serif',
        ],
      },
      spacing: {
        'notion-sidebar': '240px',
      },
    },
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'editor-bg': '#1e1e1e',
        'sidebar-bg': '#252526',
        'panel-bg': '#2d2d30',
        'border': '#3e3e42',
        'text-primary': '#cccccc',
        'text-secondary': '#969696',
        'accent': '#007acc',
        'accent-hover': '#1177bb'
      },
      fontFamily: {
        'mono': ['JetBrains Mono', 'Fira Code', 'Monaco', 'Consolas', 'monospace']
      }
    },
  },
  plugins: [],
}
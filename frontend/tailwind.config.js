/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        saas: {
          bg: '#FFFFFF',
          body: '#F8FAFC',
          card: '#FFFFFF',
          sidebar: '#F1F5F9',
          navbar: '#FFFFFF',
          border: '#E2E8F0',
          divider: '#CBD5E1',
          primary: '#2563EB',
          'primary-hover': '#1D4ED8',
          secondary: '#38BDF8',
          success: '#22C55E',
          warning: '#F59E0B',
          error: '#EF4444',
          info: '#06B6D4',
          'text-primary': '#0F172A',
          'text-secondary': '#475569',
          'text-muted': '#94A3B8'
        }
      },
      fontFamily: {
        sans: ['Inter', 'Outfit', 'sans-serif'],
      },
      boxShadow: {
        'saas-card': '0 1px 3px 0 rgba(15, 23, 42, 0.08), 0 1px 2px -1px rgba(15, 23, 42, 0.04)',
        'saas-hover': '0 10px 15px -3px rgba(37, 99, 235, 0.1), 0 4px 6px -4px rgba(37, 99, 235, 0.05)',
        'saas-glow': '0 0 15px rgba(37, 99, 235, 0.2)'
      }
    },
  },
  plugins: [],
}

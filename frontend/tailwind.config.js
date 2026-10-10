/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        marino: { DEFAULT: '#0F1E45', claro: '#1A2C5E', oscuro: '#0A1533' },
        primario: { DEFAULT: '#2563EB', oscuro: '#1D4ED8', suave: '#EFF4FF' },
        fondo: '#F6F8FC',
      },
      fontFamily: {
        sans: ['"Inter Variable"', 'Inter', 'system-ui', 'Segoe UI', 'sans-serif'],
      },
      boxShadow: {
        tarjeta: '0 1px 2px rgba(15, 30, 69, 0.04)',
      },
    },
  },
  plugins: [],
};

// La escala de grises sale de variables CSS para que el modo oscuro la invierta sin tocar cada pantalla
const slate = Object.fromEntries(
  [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map((tono) => [tono, `rgb(var(--slate-${tono}) / <alpha-value>)`]),
);

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  // La variante «dark:» responde a la clase que pone el botón de tema del panel
  darkMode: ['selector', '.oscuro'],
  theme: {
    extend: {
      colors: {
        marino: { DEFAULT: '#0F1E45', claro: '#1A2C5E', oscuro: '#0A1533' },
        primario: { DEFAULT: '#2563EB', oscuro: '#1D4ED8', suave: '#EFF4FF' },
        fondo: 'rgb(var(--fondo) / <alpha-value>)',
        slate,
      },
      fontFamily: {
        // Una sola familia en toda la app; «titulo» se conserva como alias para títulos y cifras
        titulo: ['"Manrope Variable"', 'Manrope', 'system-ui', 'Segoe UI', 'sans-serif'],
        sans: ['"Manrope Variable"', 'Manrope', 'system-ui', 'Segoe UI', 'sans-serif'],
      },
      boxShadow: {
        tarjeta: '0 1px 2px rgba(15, 30, 69, 0.04)',
      },
      keyframes: {
        entrada: { from: { opacity: '0', transform: 'translateY(6px)' }, to: { opacity: '1', transform: 'none' } },
        brote: { from: { opacity: '0', transform: 'scale(0.7)' }, to: { opacity: '1', transform: 'none' } },
      },
      // Duran menos que la espera de las capturas de e2e (350 ms)
      animation: {
        entrada: 'entrada 0.22s ease-out both',
        brote: 'brote 0.3s cubic-bezier(0.2, 0.9, 0.3, 1.3) both',
      },
    },
  },
  plugins: [],
};

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Palet utama: biru-teal
        laut: '#0F766E',
        lauts: '#E6F7F5',
        biru: '#2563EB',
        birus: '#EAF1FE',
        ink: '#0F172A',
        inkl: '#64748B',
        krem: '#F8FAFC',
        // Status stok
        aman: '#16A34A',
        amans: '#E7F7EC',
        menipis: '#D97706',
        menipiss: '#FEF4E0',
        habis: '#DC2626',
        habiss: '#FDEAEA',
      },
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        kartu: '0 1px 2px rgba(15, 23, 42, 0.04), 0 8px 24px rgba(15, 23, 42, 0.06)',
        naik: '0 12px 32px rgba(15, 23, 42, 0.14)',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      keyframes: {
        muncul: {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        muncul: 'muncul 0.18s ease-out',
      },
    },
  },
  plugins: [],
};

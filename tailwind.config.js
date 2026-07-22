/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./frontend/src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Design Tokens dari Logo Resmi Pesantren Miftahul Huda As-Syadzili
        primary: {
          DEFAULT: '#0B4A3F', // Hijau Tua Emerald
          dark: '#083831',    // Hijau lebih gelap
          light: '#116354',
        },
        accent: {
          DEFAULT: '#D4AF37', // Emas/Gold
          light: '#E8C766',   // Gold pudar
          dark: '#B79526',
        },
        surface: {
          bg: '#F5F5F0',      // Neutral off-white/cream
          card: '#FFFFFF',
        },
        txt: {
          main: '#1A1A1A',
          header: '#0B4A3F',
          muted: '#4B5563',
        },
        status: {
          success: '#16A34A',
          successBg: '#DCFCE7',
          pending: '#D97706',
          pendingBg: '#FEF3C7',
          danger: '#DC2626',
          dangerBg: '#FEE2E2',
        },
        islamic: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#0B4A3F',
          800: '#083831',
          900: '#052b25',
        },
        gold: {
          50: '#fffdf5',
          100: '#fef9c3',
          200: '#fef08a',
          300: '#E8C766',
          400: '#D4AF37',
          500: '#b79526',
          600: '#8a6e1a',
          700: '#644e13',
          800: '#473711',
          900: '#2e230a',
        }
      },
      fontFamily: {
        serif: ['Merriweather', 'Playfair Display', 'Georgia', 'serif'],
        sans: ['Inter', 'Poppins', 'Outfit', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 2px 8px rgba(0, 0, 0, 0.06)',
        'soft-lg': '0 4px 20px rgba(0, 0, 0, 0.08)',
        'gold-glow': '0 0 15px rgba(212, 175, 55, 0.3)',
      }
    },
  },
  plugins: [],
}


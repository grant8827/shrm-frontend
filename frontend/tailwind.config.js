/** @type {import('tailwindcss').Config} */
module.exports = {
  // Scoped to the SHRM marketing pages only — the rest of the app is MUI-only.
  content: ['./src/marketing/**/*.{js,jsx,ts,tsx}'],
  corePlugins: {
    // MUI's CssBaseline already provides the global reset; Tailwind's own
    // preflight would fight it across the whole app (Tailwind's content-based
    // purge can't scope the base reset layer to just /marketing).
    preflight: false,
  },
  theme: {
    extend: {
      colors: {
        // SHRM Brand Colors - Safe Haven Restoration Ministries
        shrm: {
          primary: '#3c4535',
          secondary: '#fac800',
          'primary-light': '#4a5542',
          'primary-dark': '#2e3429',
          'secondary-light': '#ffd433',
          'secondary-dark': '#e6b400',
        },
        neutral: {
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#e5e5e5',
          300: '#d4d4d4',
          400: '#a3a3a3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Georgia', 'serif'],
        display: ['Poppins', 'sans-serif'],
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      boxShadow: {
        soft: '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
      },
      animation: {
        'fade-in': 'fadeIn 0.8s ease-out',
        'slide-up': 'slideUp 0.6s ease-out',
        'slide-down': 'slideDown 0.6s ease-out',
        float: 'float 6s ease-in-out infinite',
        'float-delayed': 'float 6s ease-in-out infinite 2s',
        'float-delayed-2': 'float 6s ease-in-out infinite 4s',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce 3s infinite',
        gradient: 'gradient 6s ease infinite',
        glow: 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(50px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-50px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(-20px) rotate(3deg)' },
        },
        gradient: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        glow: {
          '0%': { boxShadow: '0 0 20px rgba(250, 200, 0, 0.5)' },
          '100%': { boxShadow: '0 0 40px rgba(250, 200, 0, 0.8)' },
        },
      },
    },
  },
  plugins: [],
};

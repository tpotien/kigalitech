module.exports = {
  darkMode: 'class',
  content: ['./pages/**/*.{js,jsx}', './components/**/*.{js,jsx}', './context/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary:    '#DB4444',
        'primary-hover': '#c73e3e',
        ex: {
          dark:   '#1D2026',
          gray:   '#F5F5F5',
          border: '#E9E9E9',
          muted:  '#8B96A5',
          light:  '#FAFAFA',
          text:   '#1D2026',
        },
      },
      fontFamily: {
        sans: ['Poppins', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
      },
      maxWidth: {
        container: '1170px',
      },
      animation: {
        marquee: 'marquee 30s linear infinite',
      },
      keyframes: {
        marquee: {
          '0%':   { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
    },
  },
  plugins: [],
};

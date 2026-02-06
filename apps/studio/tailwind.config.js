/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        studio: {
          bg: 'var(--studio-bg)',
          'bg-secondary': 'var(--studio-bg-secondary)',
          'bg-tertiary': 'var(--studio-bg-tertiary)',
          text: 'var(--studio-text)',
          'text-secondary': 'var(--studio-text-secondary)',
          'text-muted': 'var(--studio-text-muted)',
          border: 'var(--studio-border)',
          accent: 'var(--studio-accent)',
          'accent-hover': 'var(--studio-accent-hover)',
          success: 'var(--studio-success)',
          warning: 'var(--studio-warning)',
          error: 'var(--studio-error)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};

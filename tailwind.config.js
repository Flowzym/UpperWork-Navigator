/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'muted-foreground': 'var(--color-text-muted)',
      },
    },
  },
  plugins: [],
};

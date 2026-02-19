/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        kawaii: {
          pink:    '#FF6EB4',
          rose:    '#FFB3D9',
          purple:  '#C084FC',
          lavender:'#E9D5FF',
          mint:    '#6EE7B7',
          sky:     '#BAE6FD',
          peach:   '#FDBA74',
          cream:   '#FFF5E4',
        },
      },
      fontFamily: {
        pixel: ['"Press Start 2P"', 'monospace'],
      },
      keyframes: {
        bounce2: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':      { transform: 'translateY(-12px)' },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(-6deg)' },
          '50%':      { transform: 'rotate(6deg)' },
        },
        pulse2: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.6' },
        },
      },
      animation: {
        bounce2: 'bounce2 0.8s ease-in-out infinite',
        wiggle:  'wiggle 0.4s ease-in-out 0s 3',
        pulse2:  'pulse2 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}

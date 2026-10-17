/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        pothole: '#EF4444',
        'longitudinal-crack': '#F97316',
        'alligator-crack': '#EAB308',
        rutting: '#3B82F6',
        patches: '#22C55E',
      },
    },
  },
  plugins: [],
}

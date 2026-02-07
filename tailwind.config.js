
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // This line is crucial and now correct
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                background: "#000000",
                primary: "#ffffff",
                accent: "#137fec",
            },
            fontFamily: {
                sans: ["Space Grotesk", "sans-serif"],
            },
        },
    },
    plugins: [],
}

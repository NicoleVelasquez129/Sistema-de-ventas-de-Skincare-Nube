import daisyui from "daisyui";

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Colores que ya existían (sin cambios)
        primary: "#68c3b7",
        primaryFocus: "#55a89e",
        // Colores que ya se usaban en el proyecto, ahora con nombre
        nube: {
          oscuro: "#0f766e",
          suave: "#5bb3a9",
          crema: "#fdfbf7",
        },
      },
    },
  },
  plugins: [daisyui],
  daisyui: {
    logs: false,
    themes: [
      {
        nube: {
          primary: "#68c3b7",
          "primary-content": "#ffffff",
          secondary: "#5bb3a9",
          accent: "#0f766e",
          neutral: "#1c1917",
          "base-100": "#ffffff",
          "base-200": "#f1f5f9",
          "base-300": "#e2e8f0",
          "base-content": "#1e293b",
          info: "#0ea5e9",
          success: "#10b981",
          warning: "#f59e0b",
          error: "#e11d48",
        },
      },
    ],
  },
};
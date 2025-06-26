import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      colors: {
        lama: "#0077b6", // deep blue
        lamaLight: "#90e0ef", // light aqua
        lamaSky: "#48cae4", // sky blue
        lamaSkyLight: "#caf0f8", // light sky
        lamaMuted: "#023e8a", // navy blue
      },
    },
  },
  plugins: [],
};
export default config;

import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  // ค่าสีต้องตรงกับตัวแปรใน app/globals.css
  theme: { extend: { colors: { ink: "#17201d", brand: "#ad3b27", "brand-dark": "#7f291c" } } },
  plugins: [],
} satisfies Config;

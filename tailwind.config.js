// tailwind.config.js (또는 tailwind.config.mjs)
export default {
    content: [
      "./index.html",
      "./src/**/*.{js,jsx,ts,tsx}",
    ],
    theme: {
      extend: {
        fontFamily: {
          sans: ['Pretendard', 'sans-serif'],
        },
      },
    },
    plugins: [],
  };
  
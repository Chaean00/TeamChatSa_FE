/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eef6ff',
          100: '#d9eaff',
          200: '#b8d7ff',
          300: '#8cbcff',
          400: '#5c9bff',
          500: '#3b82f6', // 메인 블루
          600: '#2f6dd6',
          700: '#2558ad',
          800: '#1f498b',
          900: '#1d3d72',
        },
        ink: '#0f172a', // 헤딩/진한 텍스트
        mute: '#64748b', // 보조 텍스트
      },
      fontFamily: {
        sans: ['Inter', 'Pretendard Variable', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xl: '14px',
      },
      boxShadow: {
        card: '0 8px 24px rgba(15, 23, 42, 0.06)',
      },
    },
  },
  plugins: [],
}


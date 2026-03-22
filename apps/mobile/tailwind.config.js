/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: { DEFAULT: '#0F1117' },
        surface: { 1: '#181B23', 2: '#1F2330', 3: '#262C3D' },
        border: { subtle: '#2A2F3E', DEFAULT: '#343A4F' },
        text: { primary: '#F0EFF4', secondary: '#A1A1AA', tertiary: '#555B6E', disabled: '#3A3F50' },
        accent: { DEFAULT: '#0AADA8', hover: '#0DC4BE', muted: '#0AADA812', mutedBorder: '#0AADA830' },
        danger: { DEFAULT: '#E84040', surface: '#E8404010', border: '#E8404030' },
        warning: { DEFAULT: '#F5A623', surface: '#F5A62310', border: '#F5A62330' },
        success: { DEFAULT: '#1BBF74', surface: '#1BBF7410', border: '#1BBF7430' },
        info: { DEFAULT: '#5B8DEF', surface: '#5B8DEF10', border: '#5B8DEF30' },
      },
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        body: ['"DM Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      }
    },
  },
  plugins: [],
}

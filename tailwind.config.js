/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ios: {
          yellow: '#E4A11B',
          yellowLight: '#FEF8EC',
          yellowHover: '#D49216',
          bg: '#F2F2F7',
          sidebar: '#F7F7F8',
          card: '#FFFFFF',
          border: '#E5E5EA',
          borderSubtle: '#EBEBEF',
          text: '#1C1C1E',
          textSecondary: '#8E8E93',
          textTertiary: '#AEAEB2',
          activeBg: '#E9E9EB',
          gray1: '#8E8E93',
          gray2: '#AEAEB2',
          gray3: '#C7C7CC',
          gray4: '#D1D1D6',
          gray5: '#E5E5EA',
          gray6: '#F2F2F7',
          blue: '#007AFF',
          red: '#FF3B30',
          green: '#34C759',
          purple: '#AF52DE',
          orange: '#FF9500',
        }
      },
      borderRadius: {
        'ios': '14px',
        'ios-lg': '18px',
        'ios-sm': '10px',
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Text"',
          '"SF Pro Display"',
          '"Segoe UI"',
          'Roboto',
          'Helvetica',
          'Arial',
          'sans-serif'
        ],
      },
      boxShadow: {
        'ios-sm': '0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.03)',
        'ios-card': '0 2px 8px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0, 0, 0, 0.02)',
        'ios-card-hover': '0 6px 16px rgba(0, 0, 0, 0.08), 0 2px 6px rgba(0, 0, 0, 0.04)',
        'ios-floating': '0 8px 24px rgba(0, 0, 0, 0.12), 0 2px 6px rgba(0, 0, 0, 0.06)',
      }
    },
  },
  plugins: [],
}

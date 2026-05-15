import tailwindcssAnimate from 'tailwindcss-animate';

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                background: '#0A0F1C',   // Deep Space
                surface: '#1a1435',      // Surface variant
                primary: {
                    DEFAULT: '#00FFB3',  // Neon Mint
                    400: '#66ffcc',
                    500: '#00FFB3',      // MAIN BRAND COLOR
                    600: '#00cc8f',
                    700: '#00ccb3',      // Hover State (Darker Mint)
                },
                accent: {
                    DEFAULT: '#8B5CF6',  // Violet
                    400: '#a78bfa',
                    500: '#8B5CF6',
                    600: '#7c3aed',
                },
                aqi: {
                    good: '#10B981',         // 0-50
                    moderate: '#FBBF24',     // 51-100
                    unhealthy_sg: '#F97316', // 101-150
                    unhealthy: '#EF4444',    // 151-200
                    hazardous: '#A855F7',    // 201+
                },
                gray: {
                    900: '#0A0F1C',
                    800: '#111827',
                    700: '#1f2937',
                },
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
                display: ['Outfit', 'sans-serif'], // For Headings
            },
            animation: {
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'float': 'float 6s ease-in-out infinite',
                'scan': 'scan 3s linear infinite',
            },
            keyframes: {
                float: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-10px)' },
                },
                scan: {
                    '0%': { top: '0%', opacity: '0' },
                    '10%': { opacity: '1' },
                    '90%': { opacity: '1' },
                    '100%': { top: '100%', opacity: '0' },
                }
            }
        },
    },
    plugins: [
        tailwindcssAnimate,
    ],
}

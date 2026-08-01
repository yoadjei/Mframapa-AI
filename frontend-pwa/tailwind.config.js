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
                // ── Mobile app exact palette ──────────────────────────
                'app-bg':       '#0B0F14',
                'app-bg-light': '#E8ECF2',
                'app-card':     '#171E28',
                'app-card-alt': '#10161F',
                'app-surface':  '#121821',
                'app-border':   '#25303C',
                'app-border-light': '#D4DAE3',
                'app-green':    '#00C896',
                'app-green-dim':'#00A87C',
                'app-text':     '#FFFFFF',
                'app-text-light':'#0F1419',
                'app-sub':      '#B0BAC6',
                'app-sub-light':'#3D4A57',
                'app-muted':    '#8B97A6',
                'app-muted-light':'#4A5866',
                'aqi-good':     '#00C896',
                'aqi-moderate': '#F5C518',
                'aqi-high':     '#FF8C00',
                'aqi-unhealthy':'#E53935',
                'aqi-hazardous':'#9C27B0',
                'app-danger':   '#E53935',
                'app-warning':  '#F5C518',
                // ── Legacy tokens kept for components not yet migrated ─
                background: '#0B0F14',
                primary: {
                    DEFAULT: '#00C896',
                    500: '#00C896',
                    600: '#00A87C',
                },
                gray: {
                    900: '#0B0F14',
                    800: '#121821',
                    700: '#171E28',
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

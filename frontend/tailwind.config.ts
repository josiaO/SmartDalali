import tailwindcssAnimate from "tailwindcss-animate";
import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			'accordion-up': 'accordion-up 0.2s ease-out',
			'float': 'float 3s ease-in-out infinite',
			'pulse-glow': 'pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
			'slide-in-right': 'slide-in-right 0.3s ease-out',
			'slide-in-left': 'slide-in-left 0.3s ease-out',
		},
		colors: {
			// ... existing colors ...
			cosmic: {
				900: '#0B0E17',
				800: '#151926',
				700: '#1F2937',
				DEFAULT: '#0B0E17'
			},
			nebula: {
				500: '#6366F1',
				400: '#818CF8',
				glow: 'rgba(99, 102, 241, 0.5)'
			},
			glass: {
				100: 'rgba(255, 255, 255, 0.1)',
				200: 'rgba(255, 255, 255, 0.2)',
				border: 'rgba(255, 255, 255, 0.15)'
			},
			// Re-adding existing colors to merge properly if not using deep merge in replacement
			border: 'hsl(var(--border))',
			input: 'hsl(var(--input))',
			ring: 'hsl(var(--ring))',
			background: 'hsl(var(--background))',
			foreground: 'hsl(var(--foreground))',
			primary: {
				'50': '#EBF5FF',
				'100': '#D7EBFF',
				'200': '#AED7FF',
				'300': '#7AC0FF',
				'400': '#4DA8FF',
				'500': '#1A73E8',
				'600': '#175FCC',
				'700': '#124C99',
				'800': '#0E3A66',
				'900': '#0A2640',
				DEFAULT: 'hsl(var(--primary))',
				foreground: 'hsl(var(--primary-foreground))'
			},
			secondary: {
				DEFAULT: 'hsl(var(--secondary))',
				foreground: 'hsl(var(--secondary-foreground))'
			},
			destructive: {
				DEFAULT: 'hsl(var(--destructive))',
				foreground: 'hsl(var(--destructive-foreground))'
			},
			muted: {
				DEFAULT: 'hsl(var(--muted))',
				foreground: 'hsl(var(--muted-foreground))'
			},
			accent: {
				'50': '#E6FFF7',
				'100': '#CCFEEE',
				'200': '#99FDDC',
				'300': '#66FEC8',
				'400': '#33FFB4',
				'500': '#34D399',
				DEFAULT: 'hsl(var(--accent))',
				foreground: 'hsl(var(--accent-foreground))'
			},
			popover: {
				DEFAULT: 'hsl(var(--popover))',
				foreground: 'hsl(var(--popover-foreground))'
			},
			card: {
				DEFAULT: 'hsl(var(--card))',
				foreground: 'hsl(var(--card-foreground))'
			},
			sidebar: {
				DEFAULT: 'hsl(var(--sidebar-background))',
				foreground: 'hsl(var(--sidebar-foreground))',
				primary: 'hsl(var(--sidebar-primary))',
				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
				accent: 'hsl(var(--sidebar-accent))',
				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
				border: 'hsl(var(--sidebar-border))',
				ring: 'hsl(var(--sidebar-ring))'
			},
			surface: {
				DEFAULT: '#FFFFFF',
				muted: '#F7FAFC'
			},
			danger: '#EF4444',
			subtext: '#64748B'
		},
		fontFamily: {
			sans: [
				'Roboto',
				'ui-sans-serif',
				'system-ui',
				'-apple-system',
				'BlinkMacSystemFont',
				'Segoe UI',
				'Helvetica Neue',
				'Arial',
				'Noto Sans',
				'sans-serif'
			],
			serif: [
				'Libre Caslon Text',
				'ui-serif',
				'Georgia',
				'Cambria',
				'Times New Roman',
				'Times',
				'serif'
			],
			mono: [
				'Roboto Mono',
				'ui-monospace',
				'SFMono-Regular',
				'Menlo',
				'Monaco',
				'Consolas',
				'Liberation Mono',
				'Courier New',
				'monospace'
			]
		}
	},
	plugins: [tailwindcssAnimate],
} satisfies Config;

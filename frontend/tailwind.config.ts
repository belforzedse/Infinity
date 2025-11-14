import type { Config } from "tailwindcss";
import plugin from "tailwindcss/plugin";

export default {
    darkMode: ["class"],
    content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
  	extend: {
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			actions: {
  				primary: '#EC4899',
  				link: '#2563EB'
  			},
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		},
  		screens: {
  			'440': '440px',
  			sm: '640px',
  			md: '768px',
  			lg: '1024px',
  			xl: '1280px',
  			'2xl': '1536px'
  		},
  		fontFamily: {
  			'peyda-fanum': [
  				'var(--font-peyda-fanum)'
  			],
  			peyda: [
  				'var(--font-peyda)'
  			],
  			rokh: [
  				'var(--font-rokh)'
  			],
  			kaghaz: [
  				'var(--font-kaghaz)'
  			]
  		},
  		fontWeight: {
  			regular: '400',
  			medium: '500',
  			bold: '700'
  		},
  		fontSize: {
  			xxs: [
  				'8px',
  				{
  					lineHeight: 'auto'
  				}
  			],
  			xs: [
  				'10px',
  				{
  					lineHeight: '16px'
  				}
  			],
  			sm: [
  				'12px',
  				{
  					lineHeight: '20px'
  				}
  			],
  			base: [
  				'14px',
  				{
  					lineHeight: '24px'
  				}
  			],
  			lg: [
  				'16px',
  				{
  					lineHeight: '28px'
  				}
  			],
  			xl: [
  				'18px',
  				{
  					lineHeight: '24px'
  				}
  			],
  			'2xl': [
  				'20px',
  				{
  					lineHeight: '32px'
  				}
  			],
  			'3xl': [
  				'24px',
  				{
  					lineHeight: '36px'
  				}
  			],
  			'4xl': [
  				'30px',
  				{
  					lineHeight: 'auto'
  				}
  			],
  			'5xl': [
  				'36px',
  				{
  					lineHeight: 'auto'
  				}
  			],
  			'6xl': [
  				'48px',
  				{
  					lineHeight: 'auto'
  				}
  			],
  			'7xl': [
  				'60px',
  				{
  					lineHeight: 'auto'
  				}
  			],
  			'8xl': [
  				'72px',
  				{
  					lineHeight: 'auto'
  				}
  			],
  			'9xl': [
  				'96px',
  				{
  					lineHeight: 'auto'
  				}
  			]
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		}
  	}
  },
  plugins: [
    require("tailwind-scrollbar")({
      nocompatible: true,
      themeKey: "scrollbar",
    }),
    require("tailwindcss-animate")
],
} satisfies Config;

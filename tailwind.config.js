/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: '#002F5C', // Navy Blue
          light: '#1a4573',
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: '#FFC736', // Golden Yellow
          light: '#FFD469',
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        gray: {
          50: '#F4F4F4',
          100: '#E9E9E9',
        }
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'font-loading': {
          '0%': { opacity: '0.6' },
          '100%': { opacity: '1' }
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        'fade-in': 'fadeIn 0.5s ease-in',
        'slide-up': 'slideUp 0.5s ease-out',
        'font-loading': 'font-loading 0.3s ease-in-out',
      },
      screens: {
        'sm': '577px',    // Tablet
        'md': '1025px',   // Desktop
        'lg': '1441px',   // Large desktop
      },
      fontFamily: {
        sans: ['Poppins', 'system-ui', 'sans-serif'],
        body: ['Open Sans', 'system-ui', 'sans-serif'],
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: 'none',
            color: 'inherit',
            'ul > li': {
              marginTop: '0.5em',
              marginBottom: '0.5em',
            },
            'ol > li': {
              marginTop: '0.5em',
              marginBottom: '0.5em',
            },
            a: {
              color: 'inherit',
              textDecoration: 'none',
            },
            blockquote: {
              borderLeftColor: 'var(--accent)',
              backgroundColor: 'rgba(var(--primary), 0.05)',
              borderRadius: '0 0.5rem 0.5rem 0',
              padding: '0.5rem 1rem',
            },
            table: {
              width: '100%',
            },
            th: {
              backgroundColor: 'rgba(var(--primary), 0.05)',
              padding: '0.5rem',
            },
            td: {
              padding: '0.5rem',
              borderColor: 'rgba(var(--border), 1)',
            },
          },
        },
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
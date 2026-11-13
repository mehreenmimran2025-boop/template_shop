import type { Config } from 'tailwindcss';

const v = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        wine:    { DEFAULT: v('wine'),    deep: v('wine-deep'),    soft: v('wine-soft')    },
        mauve:   { DEFAULT: v('mauve'),   light: v('mauve-light'), pale: v('mauve-pale')   },
        olive:   { DEFAULT: v('olive'),   light: v('olive-light'), pale: v('olive-pale')   },
        sand:    { DEFAULT: v('sand'),    light: v('sand-light'),  pale: v('sand-pale')    },
        brown:   { DEFAULT: v('brown'),   light: v('brown-light')                          },
        cocoa:   { DEFAULT: v('cocoa'),   deep: v('cocoa-deep')                            },
        cream:   v('cream'),
        surface: v('surface'),
        ink:     v('ink'),
      },
      fontFamily: {
        display: ['var(--font-display)', 'Georgia', 'serif'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(0,0,0,0.06), 0 8px 24px -12px rgba(0,0,0,0.18)',
        lift: '0 2px 4px rgba(0,0,0,0.08), 0 18px 40px -18px rgba(0,0,0,0.28)',
      },
      borderRadius: { xl2: '1.25rem' },
    },
  },
  plugins: [],
};
export default config;

/** @type {import('tailwindcss').Config} */
// The Corporate brand tokens. Square corners by default (borderRadius overridden),
// hairline borders, the four brand colors + white + Acid Lime, Playfair + DM Sans.
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#000000',
        stone: '#B6B09F',
        linen: '#EAE4D5',
        chalk: '#F2F2F2',
        lime: '#C8F135', // highlight only — max 2/page, only inside a black container
        danger: '#C0392B', // error text only
        success: '#2E7D32', // success text only
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Courier New"', 'monospace'],
      },
      borderWidth: {
        hair: '0.5px',
      },
      maxWidth: {
        page: '1120px',
        content: '720px',
      },
      letterSpacing: {
        h3: '0.08em',
        label: '0.12em',
        subhead: '0.16em',
      },
    },
    // Override (not extend) so structural elements are square; keep `full` for avatars.
    borderRadius: {
      none: '0',
      DEFAULT: '0',
      full: '9999px',
    },
  },
  plugins: [],
}

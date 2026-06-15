---
name: the-corporate-brand
description: >
  Apply The Corporate brand identity to any UI, document, presentation, or written output.
  Trigger on any task involving The Corporate: building components, writing copy, designing slides,
  creating reports, generating mockups, or producing any branded deliverable.
  Always read this file before writing a single line of code or copy for The Corporate.
---

# The Corporate — Brand Specification for Claude Code

## 1. Identity

| Property     | Value                                         |
|--------------|-----------------------------------------------|
| Company name | The Corporate                                 |
| Tagline      | (none by default — use context-specific lines)|
| Brand voice  | Precise · Direct · Composed · Authoritative   |
| Anti-voice   | Casual · Exclamatory · Vague · Trendy         |
| Aesthetic    | Corporate minimalism — restraint over decoration |

---

## 2. Logo

### Primary mark
```
┌───┐  THE CORPORATE
│ C │  (boxed monogram + spaced wordmark)
└───┘
```

### Rules
- Box: solid black fill (#000000), square, no border-radius
- Monogram: "C" in DM Sans Medium, #F2F2F2, centered
- Wordmark: "THE CORPORATE" in DM Sans Light (300), letter-spacing: 0.12em, uppercase, #000000
- Clearspace: minimum 1× box height on all sides
- Monogram-only: use for favicon, avatar, app icon contexts (≤32px)
- Wordmark-only: use on dark/Ink backgrounds with color inverted to #F2F2F2

### Do not
- Add color to the logo mark
- Use border-radius on the box
- Change font weights
- Use Stone or Linen as logo fill

---

## 3. Color System

### Palette

| Name      | Hex       | CSS Variable  | Role                                        |
|-----------|-----------|---------------|---------------------------------------------|
| Ink       | #000000   | --tc-ink      | Primary text, logo, CTA fills               |
| Stone     | #B6B09F   | --tc-stone    | Muted labels, borders, icons                |
| Linen     | #EAE4D5   | --tc-linen    | Surface/card backgrounds                    |
| Chalk     | #F2F2F2   | --tc-chalk    | Page background, alternate rows             |
| White     | #FFFFFF   | --tc-white    | Document white, modal backgrounds           |
| Acid Lime | #C8F135   | --tc-lime     | Highlight accent only — max 2× per page     |

### CSS Custom Properties block (always include in projects)
```css
:root {
  --tc-ink:    #000000;
  --tc-stone:  #B6B09F;
  --tc-linen:  #EAE4D5;
  --tc-chalk:  #F2F2F2;
  --tc-white:  #FFFFFF;

  /* Semantic aliases */
  --tc-bg-page:      var(--tc-chalk);
  --tc-bg-surface:   var(--tc-linen);
  --tc-bg-elevated:  var(--tc-white);
  --tc-text-primary: var(--tc-ink);
  --tc-text-muted:   var(--tc-stone);
  --tc-border:       rgba(182, 176, 159, 0.35); /* Stone @ 35% */
  --tc-border-strong: var(--tc-stone);

  /* Accent */
  --tc-lime: #C8F135;
}
```

### Acid Lime — Accent Usage Rules

**The single rule:** Lime only works at full contrast. It must always sit against `#000000`. Never directly on Chalk, Linen, or White.

#### On dark surfaces (`#000000` background)
- Fill for badges, pills, tags: `background: #C8F135; color: #000`
- Text color inside black containers
- Primary CTA button fill
- Data callout highlight

#### On light surfaces — 3 permitted patterns only

**Pattern A — Black container with Lime text:**
```html
<div style="background:#000; padding:4px 12px; display:inline-block;">
  <span style="color:#C8F135; font-size:10px; letter-spacing:0.14em; text-transform:uppercase; font-weight:500;">Critical</span>
</div>
```

**Pattern B — 2px Lime left border on key callout:**
```css
border-left: 2px solid #C8F135;
padding-left: 16px;
/* One item only — the single most important in a list */
```

**Pattern C — Lime underline on one headline word:**
```css
border-bottom: 2px solid #C8F135;
padding-bottom: 2px;
/* One word or short phrase only — never full sentences */
```

#### Hard limits
- Max **2 uses per page** regardless of surface
- Never on body text, nav, borders, or icons
- Never as a direct fill on light backgrounds
- Never decorative — only where content is genuinely critical

### Usage rules
- Never use color for decoration — only for hierarchy or state
- No gradients
- No drop shadows (use hairline borders for depth)
- Error state: #C0392B (text only — not fills)
- Success state: #2E7D32 (text only)
- Links: underline + Ink color, no blue

---

## 4. Typography

### Font stack
```css
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=DM+Sans:wght@300;400;500&display=swap');

--tc-font-display: 'Playfair Display', Georgia, serif;
--tc-font-body:    'DM Sans', system-ui, sans-serif;
--tc-font-mono:    'JetBrains Mono', 'Courier New', monospace;
```

### Type scale

| Role         | Font           | Weight | Size   | Line-height | Letter-spacing | Transform  |
|--------------|----------------|--------|--------|-------------|----------------|------------|
| Display H1   | Playfair       | 700    | 48px   | 1.05        | -0.01em        | none       |
| Heading H2   | Playfair       | 400    | 32px   | 1.15        | 0              | none       |
| Heading H3   | DM Sans        | 500    | 18px   | 1.3         | 0.08em         | uppercase  |
| Subheading   | DM Sans        | 500    | 13px   | 1.4         | 0.16em         | uppercase  |
| Body         | DM Sans        | 300    | 15px   | 1.75        | 0              | none       |
| Body strong  | DM Sans        | 500    | 15px   | 1.75        | 0              | none       |
| Caption/Label| DM Sans        | 400    | 11px   | 1.5         | 0.12em         | uppercase  |
| Monospace    | JetBrains Mono | 400    | 13px   | 1.6         | 0              | none       |

### CSS typography classes
```css
.tc-h1 { font-family: var(--tc-font-display); font-size: 48px; font-weight: 700; line-height: 1.05; letter-spacing: -0.01em; color: var(--tc-ink); }
.tc-h2 { font-family: var(--tc-font-display); font-size: 32px; font-weight: 400; line-height: 1.15; color: var(--tc-ink); }
.tc-h3 { font-family: var(--tc-font-body); font-size: 18px; font-weight: 500; line-height: 1.3; letter-spacing: 0.08em; text-transform: uppercase; color: var(--tc-ink); }
.tc-subhead { font-family: var(--tc-font-body); font-size: 13px; font-weight: 500; line-height: 1.4; letter-spacing: 0.16em; text-transform: uppercase; color: var(--tc-stone); }
.tc-body { font-family: var(--tc-font-body); font-size: 15px; font-weight: 300; line-height: 1.75; color: var(--tc-ink); }
.tc-label { font-family: var(--tc-font-body); font-size: 11px; font-weight: 400; line-height: 1.5; letter-spacing: 0.12em; text-transform: uppercase; color: var(--tc-stone); }
```

---

## 5. Spacing System

Base unit: **8px**

| Token  | Value | Use case                          |
|--------|-------|-----------------------------------|
| xs     | 4px   | Icon-to-label gap, inline gap     |
| sm     | 8px   | List item padding, chip padding   |
| md     | 16px  | Component internal padding        |
| lg     | 24px  | Section gap, card padding         |
| xl     | 40px  | Between major sections            |
| 2xl    | 64px  | Page margins, hero top padding    |
| 3xl    | 96px  | Full section vertical rhythm      |

```css
:root {
  --tc-space-xs:  4px;
  --tc-space-sm:  8px;
  --tc-space-md:  16px;
  --tc-space-lg:  24px;
  --tc-space-xl:  40px;
  --tc-space-2xl: 64px;
  --tc-space-3xl: 96px;
  --tc-max-width: 1120px;
  --tc-content-width: 720px;  /* body text column max width */
}
```

---

## 6. Component Patterns

### Buttons
```css
/* Primary */
.tc-btn-primary {
  font-family: var(--tc-font-body);
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  background: var(--tc-ink);
  color: var(--tc-chalk);
  border: none;
  border-radius: 0;
  padding: 12px 28px;
  cursor: pointer;
}
.tc-btn-primary:hover { background: #1a1a1a; }

/* Secondary */
.tc-btn-secondary {
  font-family: var(--tc-font-body);
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  background: transparent;
  color: var(--tc-ink);
  border: 0.5px solid var(--tc-ink);
  border-radius: 0;
  padding: 12px 28px;
  cursor: pointer;
}
.tc-btn-secondary:hover { background: var(--tc-chalk); }
```

### Cards
```css
.tc-card {
  background: var(--tc-linen);
  border: 0.5px solid var(--tc-border-strong);
  border-radius: 0;
  padding: var(--tc-space-lg);
}

.tc-card-elevated {
  background: var(--tc-white);
  border: 0.5px solid var(--tc-border);
  border-radius: 0;
  padding: var(--tc-space-lg);
}
```

### Dividers
```css
.tc-divider { height: 0.5px; background: var(--tc-border); margin: var(--tc-space-xl) 0; }
.tc-divider-strong { height: 1px; background: var(--tc-stone); margin: var(--tc-space-xl) 0; }
```

### Tables
```css
.tc-table { width: 100%; border-collapse: collapse; font-family: var(--tc-font-body); font-size: 14px; }
.tc-table th { font-size: 10px; font-weight: 500; letter-spacing: 0.14em; text-transform: uppercase; color: var(--tc-stone); padding: 10px 12px; text-align: left; border-bottom: 0.5px solid var(--tc-stone); }
.tc-table td { padding: 10px 12px; color: var(--tc-ink); font-weight: 300; border-bottom: 0.5px solid var(--tc-border); }
.tc-table tr:nth-child(even) td { background: var(--tc-chalk); }
```

### Form inputs
```css
.tc-input {
  font-family: var(--tc-font-body);
  font-size: 14px;
  font-weight: 300;
  color: var(--tc-ink);
  background: var(--tc-white);
  border: 0.5px solid var(--tc-stone);
  border-radius: 0;
  padding: 10px 14px;
  width: 100%;
  outline: none;
}
.tc-input:focus { border-color: var(--tc-ink); }
.tc-input::placeholder { color: var(--tc-stone); }
```

---

## 7. Layout Grid

```css
.tc-page { max-width: var(--tc-max-width); margin: 0 auto; padding: 0 var(--tc-space-2xl); }
.tc-grid-2 { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--tc-space-lg); }
.tc-grid-3 { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: var(--tc-space-lg); }
.tc-grid-4 { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: var(--tc-space-lg); }

/* Responsive */
@media (max-width: 768px) {
  .tc-grid-2, .tc-grid-3, .tc-grid-4 { grid-template-columns: 1fr; }
  .tc-page { padding: 0 var(--tc-space-md); }
}
```

---

## 8. Voice & Copy Rules

### Tone
- Short sentences. Declarative structure. No filler phrases.
- Use active voice. Never passive when avoidable.
- Numbers: write as numerals (7, not seven) for data; write out for < 10 in prose
- Dates: DD Month YYYY (no ordinals) — "14 October 2025"
- Oxford comma: always
- No exclamation points in professional copy
- No emoji in document or UI copy

### Sentence patterns (use these)
- "Results declined 14% in Q3. Three factors contributed." ✓
- "The analysis indicates a structural misalignment." ✓
- "We recommend immediate review." ✓

### Anti-patterns (never use)
- "Exciting new updates!" ✗
- "Going forward, we are pleased to announce..." ✗
- "Leverage synergies across verticals" ✗
- Vague qualifiers: "very," "quite," "really," "somewhat" ✗

---

## 9. Do / Don't Summary

| Do                                              | Don't                                      |
|-------------------------------------------------|--------------------------------------------|
| Hairline borders (0.5px)                        | Drop shadows or box-shadow decorations     |
| Square corners (border-radius: 0)               | Rounded cards or buttons                   |
| DM Sans 300 for body text                       | Bold body text (use 500 only for emphasis) |
| Playfair Display for headlines                  | Sans-serif only approach                   |
| #000000 and #F2F2F2 as primary contrast pair    | Blue, green, purple as brand colors        |
| Uppercase tracked labels for section markers    | ALL CAPS for body copy                     |
| Linen (#EAE4D5) as surface background           | Pure white as default background           |
| Stone (#B6B09F) for borders and muted text      | Gray or off-brand neutrals                 |
| Single-weight icons (stroke, 1.5px)             | Filled/colored icon sets                   |

---

## 10. File References

- Logo SVG: `assets/logo/tc-logo-primary.svg` (horizontal lockup)
- Logo SVG: `assets/logo/tc-monogram.svg` (box mark only)
- Font CDN: `https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=DM+Sans:wght@300;400;500&display=swap`
- Color tokens: `assets/tokens/tc-colors.css`

---

## Usage Note for Claude Code

When working on any task for The Corporate:
1. Import the CSS custom properties block in every project
2. Use only the four brand colors + white
3. Default to DM Sans 300 for all body; Playfair Display 700 for display headlines only
4. No border-radius on structural elements (buttons, cards, containers)
5. No gradients, shadows, or decorative fills
6. All copy follows Section 8 voice rules — review before finalizing

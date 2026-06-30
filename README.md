# Heer Ranjha — Next.js Homepage

Luxury Indian couture. La Comète-inspired editorial homepage built with Next.js 14.

## Tech Stack
- Next.js 14 (App Router)
- React 18
- CSS Modules (no Tailwind, no additional UI libraries)
- Google Fonts via next/font (Cormorant Garamond + Jost)

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Run development server
npm run dev
# Open http://localhost:3000

# 3. Build for production
npm run build

# 4. Start production server
npm start
```

## Deploy to Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
# Follow prompts — select Next.js, deploy
```

Or drag-and-drop the project folder at vercel.com/new.

## Deploy to Netlify

```bash
npm run build
# Upload the .next folder or connect your repo at netlify.com
```
Set build command: `npm run build`
Set publish directory: `.next`

## Project Structure

```
heer-ranjha/
├── app/
│   ├── layout.js        # Root layout, fonts, metadata
│   ├── page.js          # Homepage (assembles all sections)
│   └── globals.css      # Design system: variables, resets, utilities
├── components/
│   ├── Navbar.jsx / .module.css
│   ├── Hero.jsx / .module.css          # 3-slide cinematic hero
│   ├── Collections.jsx / .module.css   # 4 collection feature blocks
│   ├── NewArrivals.jsx / .module.css   # Filtered product grid
│   ├── CraftStory.jsx / .module.css    # Heritage/craft section
│   ├── LookbookCTA.jsx / .module.css   # Men / Women split panels
│   ├── Newsletter.jsx / .module.css    # Email signup
│   ├── Footer.jsx / .module.css
│   └── ScrollObserver.jsx              # Scroll-reveal init
└── public/
    └── logo.png                        # Transparent-background logo
```

## Adding Real Product Images

Replace colour-gradient placeholders with real images by adding them to `/public/` and updating each component:

In `Hero.jsx` — replace `.slide1 / .slide2 / .slide3` CSS backgrounds:
```css
.slide1 {
  background-image: url('/hero-nayi-leher.jpg');
  background-size: cover;
}
```

In `Collections.jsx` — replace the `swatchCanvas` `div` with:
```jsx
<Image src="/collection-nayi-leher.jpg" alt="Nayi Leher" fill style={{ objectFit: 'cover' }} />
```

In `NewArrivals.jsx` — replace `cardBg` gradient `div` with:
```jsx
<Image src="/products/HKM-304.jpg" alt={product.name} fill style={{ objectFit: 'cover' }} />
```

## Customising Content

All content is data-driven via arrays at the top of each component file.
- Collections: `COLLECTIONS` array in `Collections.jsx`
- Products: `PRODUCTS` array in `NewArrivals.jsx`
- Hero slides: `SLIDES` array in `Hero.jsx`
- Nav links: `navLinks` array in `Navbar.jsx`

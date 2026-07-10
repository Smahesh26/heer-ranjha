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

## Deploy to Render

This repo now includes [render.yaml](render.yaml) for Render Blueprint deploys.

Important:
- This app currently uses SQLite with Prisma.
- On Render, SQLite must live on a persistent disk or your data will reset on restart/redeploy.
- The blueprint mounts a disk at `/var/data` and uses `DATABASE_URL="file:/var/data/heer-ranjha.db"`.

### Render Steps

1. Push this repo to GitHub.
2. In Render, click `New` -> `Blueprint`.
3. Connect this repository.
4. Render will detect `render.yaml` and create the web service.
5. Fill these secret env vars in Render before first deploy:

```bash
JWT_SECRET="replace-with-strong-random-secret"
RAZORPAY_KEY_ID="your_key"
RAZORPAY_KEY_SECRET="your_secret"
NEXT_PUBLIC_RAZORPAY_KEY_ID="your_public_key"
RAZORPAY_WEBHOOK_SECRET="your_webhook_secret"
SMTP_HOST="smtp.gmail.com"
SMTP_USER="your-sender-email@example.com"
SMTP_PASS="your-app-password"
EMAIL_FROM="Heer Ranjha <your-sender-email@example.com>"
```

### Build and Start Used by Render

Build command:

```bash
npm ci && npx prisma generate && npx prisma db push && npm run build
```

Start command:

```bash
npm start
```

Health check:

```text
/api/health
```

## Environment Variables

Add these keys in `.env.local` (and production secrets manager):

```bash
DATABASE_URL="file:./dev.db"
JWT_SECRET="replace-with-strong-random-secret"

RAZORPAY_KEY_ID="rzp_test_xxx"
RAZORPAY_KEY_SECRET="your_key_secret"
NEXT_PUBLIC_RAZORPAY_KEY_ID="rzp_test_xxx"
RAZORPAY_WEBHOOK_SECRET="set-same-secret-as-razorpay-webhook-config"

SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="your-sender-email@example.com"
SMTP_PASS="your-app-password"
EMAIL_FROM="Heer Ranjha <your-sender-email@example.com>"
```

If SMTP is not configured, login OTP will be printed in server logs only in development mode.

## Checkout and Payment Webhook

Webhook endpoint:

```text
POST /api/payments/razorpay-webhook
```

Configure this endpoint in Razorpay dashboard and use the same value as `RAZORPAY_WEBHOOK_SECRET`.

## Production Smoke Checklist

1. Register/login user and add items to cart.
2. Checkout, complete Razorpay payment.
3. Confirm order appears in user `My Orders` and `Payments`.
4. Confirm admin `Orders` and `Payments` sections show the same record.
5. Track the order from `Order Tracking` page using order number and billing email.

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

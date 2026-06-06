# KigaliTech — Electronics E-Commerce Platform

A full-featured electronics store built with **Next.js 13**, **Prisma/SQLite**, **NextAuth**, and **Tailwind CSS**.

## Features

- 🛒 Full storefront — cart, checkout, coupon codes, order tracking
- 📱 39 products: Phones (iPhone 17 Pro Max, S26 Ultra, Z Fold 7), Laptops (MacBook M5), Headphones (Sony XM6), Gaming (PS5, Xbox, Switch, DualSense), Cameras, Wearables, Accessories, TVs
- 🔥 Flash deal countdown — admin controls product, discount %, timer duration, label
- 🌟 Hero section — fully customisable (badge text, headline, subtitle, image, price) from admin
- 🎮 Gaming category with 4 products
- 🌍 Trilingual: English / French / Kinyarwanda
- 💱 Multi-currency: USD, RWF, EUR, GBP
- 👤 Customer accounts — orders, repair tickets, profile picture upload
- 🔧 Admin panel — products (with image upload), orders, repairs, trade-ins, marketplace, analytics, coupons, staff, site config, admin profile
- 🔐 Auth: credentials (email/password), Google, GitHub
- 🏷️ Trust badges — 17 brand logos with hover colour + font effects

---

## Quick Start

### 1. Clone & install

```bash
git clone https://github.com/tpotien1/kigalitech.git
cd kigalitech
npm install
```

### 2. Environment variables

```bash
cp .env.example .env.local
```

Minimum required in `.env.local`:

```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="<run: openssl rand -base64 32>"
```

### 3. Database setup

```bash
npx prisma migrate deploy
DATABASE_URL="file:./dev.db" node prisma/seed.js
```

### 4. Run dev server

```bash
npm run dev
```

Open **http://localhost:3000**

### Default admin login

| Field | Value |
|---|---|
| Email | admin@kigalitech.com |
| Password | admin123 |

Admin panel → **http://localhost:3000/admin**

---

## Project Structure

```
pages/
  index.js              # Homepage (hero, categories, flash deal, products)
  deals.js              # Deals page
  products/             # Product listing + detail pages
  checkout.js           # Checkout
  account.js            # Customer account (orders, repairs, profile photo)
  admin/                # Full admin panel
  api/                  # All API routes

components/
  HeroSection.js        # Configurable hero with radial-mask image blending
  CountdownTimer.js     # Flash deal countdown (configurable via admin)
  FeaturedCategories.js # 7-category grid with photo cards
  TrustBadges.js        # 17 brand logos with hover brand colours
  ProductForm.js        # Admin product form with file upload

prisma/
  schema.prisma         # Full database schema
  seed.js               # 39-product seed file
```

---

## Deployment on Vercel

1. Import this repo at **vercel.com/new**
2. Add all environment variables from `.env.example`
3. Switch `DATABASE_URL` to a hosted PostgreSQL (Neon, Supabase, Railway, PlanetScale)
4. In `prisma/schema.prisma` change `provider = "sqlite"` → `provider = "postgresql"`
5. Set build command: `npx prisma migrate deploy && next build`

> **SQLite** works perfectly for local dev and single-server VPS. For Vercel/serverless you need PostgreSQL.

---

## Tech Stack

| | |
|---|---|
| Framework | Next.js 13 — Pages Router |
| ORM | Prisma + SQLite (dev) / PostgreSQL (prod) |
| Auth | NextAuth v4 — JWT, credentials, Google, GitHub |
| Styling | Tailwind CSS v3 |
| Payments | Stripe (optional) |
| Email | Nodemailer (optional) |
| i18n | Custom React context — EN / FR / Kinyarwanda |

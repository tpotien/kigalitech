# KigaliTech Electronics Shop

A hybrid Next.js electronics storefront with admin dashboard, variant selectors, receipt page, and PDF background service.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env.local` with:
```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret"
GITHUB_ID="your-github-id"
GITHUB_SECRET="your-github-secret"
EMAIL_SERVER="smtp://user:pass@smtp.example.com"
EMAIL_FROM="no-reply@example.com"
STRIPE_SECRET_KEY="your-stripe-secret"
STRIPE_PUBLISHABLE_KEY="your-stripe-publishable"
```

3. Run Prisma and seed:
```bash
npx prisma generate
npx prisma migrate dev --name init
npm run seed
```

4. Start development:
```bash
npm run dev
```

## Docker PDF service

The `services/pdf-generator` folder contains a small Express service for PDF generation.

## GitHub and Vercel deployment

- Push to GitHub repo: `KigaliTech/electronics-shop`
- Deploy the main app to Vercel.
- Add required env vars in Vercel.

## Notes

- Product images use Unsplash remote image URLs.
- The admin panel and PDF service are included as starter components.

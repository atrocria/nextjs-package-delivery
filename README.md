This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Supabase setup

1. Create a Supabase project and enable Email authentication under **Authentication → Providers**.
2. Copy `.env.example` to `.env.local` and fill in the project URL and publishable key from **Project Settings → API**.
   On Windows PowerShell:

   ```powershell
   Copy-Item .env.example .env.local
   ```

3. In the Supabase SQL Editor, run [`supabase/schema.sql`](./supabase/schema.sql). It creates the `shipping_drafts` table, enables row-level security, and restricts draft access to the signed-in owner.
4. Restart the Next.js development server after editing `.env.local`.

The shipping flow keeps an unauthenticated What & where form in session storage while redirecting to sign-in. After sign-in, continue the flow to save it to `shipping_drafts`. Delivery choices are saved as a draft; this setup does not collect payment or create a parcel.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

# wearetreed — deploy checklist

## Files
- `index.html` — single-file page (rename of `index-v6.html` for production)
- `images/` — all photos, logos, favicon
- `vercel.json` — cache headers + security headers
- `DEPLOY.md` — this file

## Before first deploy — do these four things

### 1. Formspree (form backend)
1. Sign up at https://formspree.io (free tier = 50 submissions/month)
2. Create a new form, target email `ahoj@wearetreed.com`
3. Copy the 8-character form ID from the form URL (e.g. `mblodknv`)
4. In `index.html`, find `YOUR_FORMSPREE_ID` and replace it with the real ID
5. Verify the email (Formspree sends a confirmation to `ahoj@wearetreed.com`)

### 2. Phone number
In `index.html` (footer and sticky mobile CTA), search `+420000000000` — replace with the real number. Check `TODO[phone]` comments.

### 3. Favicon PNG
Current: only `images/favicon.svg` ships. For Safari/iOS home-screen icons you'll also want `images/apple-touch-icon.png` (180×180). Create one from the SVG or drop a Treed-branded PNG in that path.

### 4. Analytics (optional, recommended)
Uncomment one of the two lines in the `<head>`:
- Plausible (paid, privacy-first, no cookie banner needed): replace `data-domain` value
- Vercel Analytics (free tier, built-in): just uncomment

## Deploy to Vercel

From this folder:
```bash
npx vercel            # preview URL
npx vercel --prod     # production (only after you've tested the preview)
```

First run will ask you to link the project and log in. After that it's two commands.

## Custom domain

After a successful `vercel --prod`:
1. Vercel dashboard → this project → Settings → Domains → Add `wearetreed.com`
2. In your current DNS (Webflow → Custom Domain settings, or wherever), point:
   - `@` (apex) → A record `76.76.21.21`
   - `www` → CNAME `cname.vercel-dns.com`
3. Wait 10–60 minutes for DNS to propagate. Vercel issues the SSL cert automatically.

## Keep Webflow live until you flip DNS
Do the full Vercel deploy, test on the `*.vercel.app` preview URL, share with 2–3 people for sanity check, then flip DNS. Webflow stays up right until DNS changes propagate.

## Remaining TODOs (grep them)
- `TODO[capacity]` — optional trust bar in top nav, delete if not wanted
- `TODO[price]` × 4 — verify 100ks pricing per product
- `TODO[product-swap]` — Pokladnička was swapped for Treed Notebook
- `TODO[stats]` — verify the three % stats (Sendoso 2023, Giftsenda 2024, Postal.com 2022)
- `TODO[form-endpoint]` — replace Formspree placeholder
- `TODO[phone]` — real phone number
- `TODO[analytics]` — uncomment when ready

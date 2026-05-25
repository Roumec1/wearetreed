# wearetreed — deploy checklist

## Repo structure
- `index.html`, `bohemia.html`, `cloudflare.html`, `myco.html` — Czech (root locale)
- `en/` — English mirror (homepage + 3 case studies)
- `de/` — German mirror (homepage + 3 case studies)
- `api/contact.js` — serverless email handler (Resend)
- `images/` — photos, logos, favicon
- `sitemap.xml`, `robots.txt` — SEO
- `vercel.json` — clean URLs, cache headers, security headers
- `DEPLOY.md` — this file

## Hosting & domains
Hosted on **Vercel**, git-integrated to `github.com/Roumec1/wearetreed`. A push to `master` triggers an automatic deploy.

Domains attached in the same Vercel project (Settings → Domains):
- `wearetreed.com` (apex → 307 redirect to `www.wearetreed.com`)
- `www.wearetreed.com` (production)
- `wearetreed.cz`, `www.wearetreed.cz` (production)
- `wearetreed.vercel.app` (preview)

All four serve the same deployment.

## Contact form
Form posts JSON to `/api/contact` which forwards via **Resend** to `CONTACT_EMAIL` (defaults to `roman.unzeitig@gmail.com`).

Required Vercel environment variables:
- `RESEND_API_KEY` — your Resend API key
- `CONTACT_EMAIL` — destination email (optional, defaults shown above)

Set them in: Vercel dashboard → project → Settings → Environment Variables.

## SEO
- `sitemap.xml` lists all 12 URLs with hreflang alternates (CS / EN / DE / x-default)
- `robots.txt` points crawlers to the sitemap and disallows `/api/`
- Every page has canonical, hreflang, og:url, and JSON-LD structured data
  - Homepages: Organization + WebSite
  - Case studies: Article + BreadcrumbList

After a deploy, you may want to:
1. Submit `https://wearetreed.com/sitemap.xml` to [Google Search Console](https://search.google.com/search-console)
2. Validate any page with the [Rich Results Test](https://search.google.com/test/rich-results)

## Optional: favicon polish
For Safari/iOS home-screen icons, drop a 180×180 PNG at `images/apple-touch-icon.png` and add to each `<head>`:
```html
<link rel="apple-touch-icon" href="/images/apple-touch-icon.png">
```
The SVG favicon (`images/favicon.svg`) already covers Chrome/Firefox/Edge.

## Optional: analytics
Either drop one snippet into the `<head>` of all 3 homepages (and case study pages if desired):
- **Plausible** (privacy-first, paid, no cookie banner needed):
  ```html
  <script defer data-domain="wearetreed.com" src="https://plausible.io/js/script.js"></script>
  ```
- **Vercel Analytics** (free tier, built-in):
  ```html
  <script defer src="/_vercel/insights/script.js"></script>
  ```

## Local preview
```bash
npx vercel dev    # runs API routes locally on http://localhost:3000
```
Or just open `index.html` in a browser (the form won't work without the dev server).

## Manual deploy (only needed if git integration breaks)
```bash
npx vercel            # preview URL
npx vercel --prod     # production
```

## Pending content TODOs (grep them)
- `TODO[price]` × 4 in CS homepage — verify 100 ks pricing per product

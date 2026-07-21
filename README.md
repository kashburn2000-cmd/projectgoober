# Billowatt

**What every plug in your home really costs.** A state-aware home electricity cost
platform: interactive bill analyzer, cost-to-run calculators, and ~4,000
programmatically generated pages (appliance × state) computed from current EIA
electricity rates — refreshed monthly, fully static, $0/month to run.

## Why this site wins

- **The gap**: every "how much does X cost to run" answer online assumes a stale
  national-average rate. Real residential rates span ~11¢–42¢/kWh by state, so
  incumbent answers are off 2–3× for tens of millions of people.
- **The moat**: monthly auto-refreshed EIA data + per-state computation + interactive
  tools = pages that stay current while competitor blog posts age.
- **The surface**: ~140 appliance pages, ~3,900 appliance×state pages, 51 state
  pages, 28 comparisons, 14 editorial guides, 2 calculators — all interlinked,
  all with structured data.

## Stack

Astro 5 (static output) · Preact islands (calculators only — everything else ships zero JS) ·
Tailwind CSS v4 · deployed on Cloudflare Pages · data from the EIA open API.

```bash
npm install
npm run dev        # local dev
npm run build      # production build → dist/
npm run fetch-rates  # refresh src/data/rates.json (needs EIA_API_KEY)
npm run og         # regenerate OG images (needs devDeps)
```

Branding (name, domain, contact email, AdSense ID) lives in **`src/config.js`** —
one file to change if the domain choice differs.

---

## 🚀 Launch checklist

### 1. Domain + hosting (~15 min)

1. Buy `billowatt.com` in Cloudflare (Registrar → Register). The site is already
   branded for it. (If the name ever changes: update `SITE_NAME`, `SITE_URL`,
   `CONTACT_EMAIL` in `src/config.js`, the sitemap URL in `public/robots.txt`,
   and rerun `npm run og`.)
2. Cloudflare dashboard → **Workers & Pages → Create → Pages → Connect to Git** →
   pick this repo and branch.
   - Build command: `npm run build`
   - Output directory: `dist`
3. Pages → Custom domains → add your domain (Cloudflare auto-configures DNS).
4. Merge this branch to your default branch so pushes deploy automatically.

### 2. Data freshness (~5 min)

1. Get a free EIA API key: https://www.eia.gov/opendata/register.php
2. GitHub repo → Settings → Secrets and variables → Actions → new secret
   `EIA_API_KEY`.
3. The included workflow (`.github/workflows/refresh-rates.yml`) refreshes rates
   monthly and commits; Cloudflare Pages redeploys automatically. Run it once now
   via Actions → "Refresh electricity rates" → Run workflow to pull the latest data.

### 3. Search engines (~15 min, then patience)

1. Google Search Console → add property (domain-level) → verify via the DNS record
   Cloudflare offers one-click for → submit sitemap: `https://<domain>/sitemap-index.xml`.
2. Bing Webmaster Tools → import from Search Console.
3. Optional: enable Cloudflare Web Analytics (free, cookieless) and put the beacon
   token in `src/config.js` → `CF_ANALYTICS_TOKEN`.

Expect indexing to ramp over 2–8 weeks. The long-tail (appliance × state) pages are
where early traffic appears.

### 4. Monetization (after ~2–4 weeks of indexing)

1. Apply at https://adsense.google.com with your domain. The site ships with
   everything approval looks for: substantial original content, privacy policy,
   terms, contact, about, methodology.
2. On approval: set `ADSENSE_PUB_ID` in `src/config.js` (e.g. `'ca-pub-123…'`) and
   deploy. Ad slots (in-content + sidebar) and the consent banner activate
   automatically — no other changes needed.
3. Replace the placeholder line in `public/ads.txt` with your real publisher ID.
4. In AdSense → Privacy & messaging, enable Google's consent message for EEA/UK
   traffic (complements the built-in Consent Mode v2 banner).
5. Email: set up Cloudflare Email Routing (free) to forward `hello@<domain>` to
   your inbox.

### 5. Growth levers (later, optional)

- Watch Search Console for which appliance×state queries win; deepen those pages.
- Natural expansions: natural gas appliance costs, water costs, time-of-use
  optimizer per utility, a "rate hike tracker" news section.
- At meaningful traffic (~50k sessions/mo), apply to premium ad networks
  (Mediavine/Raptive) for 3–10× AdSense RPMs.
- Affiliate upside: smart plugs/energy monitors (Amazon), solar quotes, and
  deregulated-market electricity comparison programs.

## Data + methodology

- Rates: EIA average residential retail price by state (`src/data/rates.json`),
  refreshed by `scripts/fetch-rates.mjs`. A committed snapshot guarantees builds
  never depend on the API.
- Appliances: `src/data/appliances/*.json` — curated wattages, ranges, and usage
  models (continuous hours/day or kWh-per-cycle).
- All formulas documented on the live `/methodology/` page.

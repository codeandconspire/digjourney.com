# Hosting: Cloudflare Pages (migrated from fly.io)

The site is a statically **prerendered** snapshot of the Choo/Jalla SSR app,
served from Cloudflare Pages with a few dynamic endpoints as Pages Functions.

## How the build works

```
npm run build         # jalla bundles the client → dist/public (content-hashed)
node bin/prerender.js  # boots `node server.js` (serve mode), crawls every route,
                       # writes static HTML + assets + _redirects + _headers → out/
```

- `bin/prerender.js` enumerates routes from the Choo router (`wayfarer`) and
  expands dynamic routes via `lib/resolve-route.js` (queries Prismic for posts,
  events, products, courses, pages).
- The crawl snapshots server-rendered HTML, which already contains
  `window.initialState` + hashed bundle URLs, so the SPA hydrates client-side.
- Content is re-fetched client-side by `stores/prismic.js`, so the static HTML
  is the first-paint/SEO layer and the live app self-heals.

Local preview of the built site incl. Functions: `npm run preview`
(`npx wrangler pages dev out`).

## Cloudflare Pages project settings (dashboard)

Create a Pages project named **digjourney** connected to this Git repo:

- **Build command:** `npm run pages:build`
- **Build output directory:** `out`
- **Node version:** 18 (set `NODE_VERSION=18` env var if needed)
- **Environment variables (Production):**
  - `HOST=digjourney.com`
  - `HUBSPOT_API_KEY=…` (secret)
  - `HUBSPOT_SUBSCRIPTION_ID=…`
- Functions runtime config lives in `wrangler.toml`
  (`compatibility_flags = ["nodejs_compat"]`).

## Publish-triggered rebuilds

Create a **Deploy Hook** in the Pages project and point the **Prismic webhook**
at that URL. Publishing in Prismic then triggers a fresh prerender + deploy
(≈1–3 min, vs. the old instant cache purge — this is the main behavior change).

The old `/api/prismic-hook` purge endpoint and `lib/purge.js` were removed.

## Dynamic endpoints (Pages Functions)

- `functions/media/[[path]].js` — image proxy backed by **Cloudflare Image
  Transformations** (`cf.image`). Keeps the legacy `/media/:type/:transform/:uri`
  URL shape but resizes the remote Prismic source on Cloudflare's edge (no more
  Cloudinary). **Requires Image Transformations to be enabled on the zone**
  (dashboard → Images → Transformations → enable for `digjourney.com`).
- `functions/api/subscribe.js` — HubSpot newsletter signup.
- `functions/api/prismic-preview.js` — sets the preview cookie + redirects.

> Image Transformations have a monthly free allowance of unique transformations
> and are billed per unique transformation beyond it — smaller than Cloudinary's
> free tier, so confirm current pricing. The output is cached on the edge, so
> only *unique* (URL + options) transforms are billed.

## Cutover checklist

1. Rotate the **Cloudflare API key** that was previously hardcoded in
   `lib/purge.js` (it's in git history — treat as compromised).
2. Enable **Image Transformations** on the `digjourney.com` zone
   (dashboard → Images → Transformations).
3. Create the Pages project + env vars; deploy and smoke-test on the
   `*.pages.dev` URL.
4. Configure the Prismic webhook → Pages Deploy Hook.
5. Point the apex/`www` DNS records at the Pages project (custom domain).
6. Decommission the fly.io app (`digjourney`); `fly.toml` is no longer used.

## Known edge case

Pages whose Prismic `parent` link is **broken** (e.g. `/ett-case`) resolve to a
bare `/uid` that the old server redirected in a loop; they are not prerendered
and will 404. Fix the parent link in Prismic, or the page will need a manual
`_redirects` entry.

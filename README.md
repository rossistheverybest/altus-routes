# Altus Route Hub (Sea to Sky)

Route pages for altusmountainguides.com: ski tours, climbs, alpine routes and runs from Vancouver to the Duffey.
Built with Next.js and hosted on Vercel. Every page is pre-built HTML, so Google and AI search can read it in full.

## Pages

| Address | What it is |
| --- | --- |
| `/routes` | Hub: seven zones, filters, map, all route cards |
| `/routes/{zone}` | Zone page, e.g. `/routes/squamish` |
| `/routes/{zone}/{route}` | One route, e.g. `/routes/whistler/spearhead-traverse` |
| `/routes/squamish/stawamus-chief` | The Chief with climbs drawn on the photo |
| `/sitemap.xml`, `/robots.txt` | Made automatically |

## Where the content comes from

The Google Sheet **Altus_Route_Hub_-_Sea_to_Sky_routes** is the source. On every build, `scripts/sync-sheet.mjs`
pulls the **Routes** and **Trip Reports** tabs into `data/`. If the Sheet can't be reached, the build uses the last copy in `data/`.

- Rows with status `BACKLOG` are left out. Every other row gets a page.
- Only `LIVE` routes are indexed by Google and listed in the sitemap. Everything else is built (so you can review it) but marked noindex.
- `products` column: one per line, `Name | https://link`.
- Zones and their map outlines live in `data/zones.json`. The Chief lines live in `data/crag-chief.json`.

**Publishing a change:** edit the Sheet, then Website > Publish website now (see `scripts/apps-script-publish.gs`).

## Photos

Put files in `public/photos/`, named by the route slug:

```
spearhead-traverse-hero.jpg     (big photo at the top and on the card)
spearhead-traverse-start.jpg
spearhead-traverse-crux.jpg
spearhead-traverse-payoff.jpg
spearhead-traverse-detail.jpg
```

They appear automatically on the next build. Landscape, about 2400 px wide, under 500 KB each. Altus's own photos only.

## Settings (Vercel > Project > Settings > Environment Variables)

| Variable | Production | Preview | What it does |
| --- | --- | --- | --- |
| `SHEET_ID` | `1sbRTelw39y2WUwFOAZbVsgFR3wgg7EMOjp-7xzW377M` | same | Which Sheet to pull from. The Sheet must be shared "Anyone with the link: Viewer". |
| `SITE_URL` | `https://altusmountainguides.com` | same | Used for canonical links and the sitemap |
| `SITE_NOINDEX` | `1` until launch, then `0` | `1` | Keeps the whole site out of Google |
| `NEXT_PUBLIC_BUILD_NOTES` | leave unset | `1` | Shows "Draft · verify" notes and the Chief line-tracing tool |

Header and footer links are in `lib/site.js`. Check they match the main site.

## Run it on a computer

```
npm install
npm run dev        # http://localhost:3000/routes
npm run build      # what Vercel runs
```

## Putting it under altusmountainguides.com/routes

The main site stays on WordPress. Two ways to serve this hub at `/routes`:

1. **Subdomain first (quick):** in Vercel add the domain `routes.altusmountainguides.com` and add the DNS record it shows. The hub works at `routes.altusmountainguides.com/routes`.
2. **Same address as the main site (better for search):** a proxy in front of the main site sends `/routes*`, `/_next*`, `/photos*` and `/altus-logo.png` to Vercel. That's done with Cloudflare (a Worker or Origin Rule) or a reverse-proxy rule on the web host. It needs whoever manages DNS and hosting.

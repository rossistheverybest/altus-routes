import { ZONES, ROUTES, CRAG } from "../lib/data";
import { SITE_URL, INDEXABLE_STATUSES } from "../lib/site";

export default function sitemap() {
  const live = ROUTES.filter((r) => INDEXABLE_STATUSES.includes(r.status));
  return [
    { url: `${SITE_URL}/routes`, changeFrequency: "weekly", priority: 0.9 },
    ...ZONES.map((z) => ({ url: `${SITE_URL}/routes/${z.slug}`, changeFrequency: "weekly", priority: 0.7 })),
    { url: `${SITE_URL}/routes/${CRAG.zone}/stawamus-chief`, priority: 0.7 },
    ...live.map((r) => ({ url: `${SITE_URL}/routes/${r.zone}/${r.slug}`, lastModified: r.last_updated || undefined, priority: 0.8 })),
  ];
}

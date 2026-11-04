import { SITE_URL, SITE_NOINDEX } from "../lib/site";

export default function robots() {
  return SITE_NOINDEX
    ? { rules: { userAgent: "*", disallow: "/" } }
    : { rules: { userAgent: "*", allow: "/" }, sitemap: `${SITE_URL}/sitemap.xml` };
}

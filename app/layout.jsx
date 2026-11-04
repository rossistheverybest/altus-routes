import "./globals.css";
import { SiteHeader, SiteFooter } from "../components/Chrome";
import { SITE_URL, SITE_NOINDEX } from "../lib/site";

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "Sea to Sky Routes | Altus Mountain Guides", template: "%s" },
  description: "Route guides from Altus's IFMGA guides: ski tours, rock climbs, alpine summits and mountain runs between Vancouver and the Duffey Lake Road.",
  robots: SITE_NOINDEX ? { index: false, follow: false } : undefined,
  openGraph: { siteName: "Altus Mountain Guides", locale: "en_CA", type: "website" },
};

export const viewport = { themeColor: "#000000" };

export default function RootLayout({ children }) {
  return (
    <html lang="en-CA">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800&family=Rajdhani:wght@500;600;700&display=swap" />
      </head>
      <body>
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}

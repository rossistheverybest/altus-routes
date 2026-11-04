import { ZONES, ROUTES, GEOMETRY, lite, liteZone } from "../../lib/data";
import MapPreview from "../../components/MapPreview";

export const metadata = { title: "Map style preview | Altus", robots: { index: false, follow: false } };

export default function Page() {
  return <MapPreview zones={ZONES.map(liteZone)} routes={ROUTES.map(lite)} geometry={GEOMETRY} />;
}

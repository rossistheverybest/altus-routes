import Link from "next/link";
export default function NotFound() {
  return <div className="gut"><main className="wrap"><h1>Not found</h1><p className="lede">That route page doesn&apos;t exist. <Link href="/routes" style={{ color: "var(--spruce)" }}>See all Sea to Sky routes →</Link></p></main></div>;
}

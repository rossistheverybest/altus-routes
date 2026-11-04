// Pulls the route database from the Google Sheet into /data before each build.
//
//   SHEET_ID=<id> node scripts/sync-sheet.mjs        (sheet must be shared "Anyone with the link: Viewer")
//   node scripts/sync-sheet.mjs --file routes.csv --reports reports.csv   (local CSV exports, for testing)
//
// If SHEET_ID isn't set or the sheet can't be reached, it keeps the data already in /data and the build carries on.
import fs from "node:fs";

const args = process.argv.slice(2);
const opt = (k) => { const i = args.indexOf(k); return i > -1 ? args[i + 1] : null; };
const SHEET_ID = process.env.SHEET_ID;
const csvUrl = (tab) => `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(tab)}`;

function parseCSV(text) {
  const rows = []; let row = [], cell = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += c; }
    else if (c === '"') q = true;
    else if (c === ",") { row.push(cell); cell = ""; }
    else if (c === "\n" || c === "\r") { if (c === "\r" && text[i + 1] === "\n") i++; row.push(cell); rows.push(row); row = []; cell = ""; }
    else cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  const [head, ...body] = rows.filter((r) => r.some((v) => v.trim()));
  return body.map((r) => Object.fromEntries(head.map((h, i) => [h.trim(), (r[i] ?? "").trim()])));
}

async function load(tab, file) {
  if (file) return fs.readFileSync(file, "utf8");
  const res = await fetch(csvUrl(tab));
  if (!res.ok) throw new Error(`${tab}: HTTP ${res.status}`);
  const t = await res.text();
  if (t.trim().startsWith("<")) throw new Error(`${tab}: got a web page, not CSV. Is the sheet shared "Anyone with the link"?`);
  return t;
}

// Google can export dates as 5/28/2012; the site wants 2012-05-28. Anything unreadable becomes blank.
const isoDate = (s) => {
  if (!s) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  // A plain number is a spreadsheet date serial (days since 30 Dec 1899).
  if (/^\d{5}(\.\d+)?$/.test(s)) return new Date(Date.UTC(1899, 11, 30) + Math.floor(+s) * 864e5).toISOString().slice(0, 10);
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
};
const products = (s) => (s || "").split("\n").map((l) => l.split("|").map((x) => x.trim())).filter((p) => p[0] && p[1]).map(([name, url]) => ({ name, url }));

async function main() {
  if (!SHEET_ID && !opt("--file")) { console.log("sync-sheet: no SHEET_ID set, using the data already in /data"); return; }
  const existing = Object.fromEntries(JSON.parse(fs.readFileSync("data/routes.json", "utf8")).map((r) => [r.slug, r]));
  const zones = new Set(JSON.parse(fs.readFileSync("data/zones.json", "utf8")).map((z) => z.slug));

  const rows = parseCSV(await load("Routes", opt("--file")));
  const routes = []; const problems = [];
  for (const r of rows) {
    if (!r.slug) continue;
    if (!zones.has(r.zone)) { problems.push(`${r.slug}: unknown zone "${r.zone}"`); continue; }
    if (r.status === "BACKLOG") continue;
    const old = existing[r.slug] || {};
    const lat = parseFloat(r.lat), lng = parseFloat(r.lng);
    if (Number.isNaN(lat) || Number.isNaN(lng)) { problems.push(`${r.slug}: missing lat/lng`); continue; }
    routes.push({
      ...old, ...r, lat, lng, products: products(r.products), last_updated: isoDate(r.last_updated),
      // Columns that may not exist in the sheet yet keep their current values.
      aspect: r.aspect ?? old.aspect ?? "", max_pitch: r.max_pitch ?? old.max_pitch ?? "", terrain: r.terrain ?? old.terrain ?? "",
    });
  }
  if (routes.length < 5) throw new Error(`only ${routes.length} usable rows; refusing to overwrite data/routes.json`);
  fs.writeFileSync("data/routes.json", JSON.stringify(routes, null, 1));
  console.log(`sync-sheet: ${routes.length} routes written`);

  try {
    const reps = parseCSV(await load("Trip Reports", opt("--reports")))
      .filter((x) => x.route && x.date && x.url && routes.some((r) => r.slug === x.route))
      .map(({ route, date, title, url }) => ({ route, date: isoDate(date), title: title || "Trip report", url }))
      .filter((x) => x.date);
    fs.writeFileSync("data/reports.json", JSON.stringify(reps, null, 1));
    console.log(`sync-sheet: ${reps.length} trip reports written`);
  } catch (e) { console.warn("sync-sheet: trip reports not updated:", e.message); }

  if (problems.length) console.warn("sync-sheet: skipped rows:\n  " + problems.join("\n  "));
}

main().catch((e) => { console.warn("sync-sheet: kept existing data:", e.message); });

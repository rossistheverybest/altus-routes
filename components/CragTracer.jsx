"use client";
// Line-tracing tool for the crag photo. Only shown on preview builds (NEXT_PUBLIC_BUILD_NOTES=1).
// Click the photo to add points; "Copy line data" gives JSON to paste into data/crag-chief.json.
import { useEffect, useRef, useState } from "react";
import { cragSVG } from "../lib/crag";
import { LINE_COLOURS } from "../lib/shared";

export default function CragTracer({ crag, rockRoutes }) {
  const [lines, setLines] = useState(crag.lines);
  const [cur, setCur] = useState(1);
  const [photo, setPhoto] = useState({ src: crag.photo, w: crag.w, h: crag.h });
  const [msg, setMsg] = useState("Click the photo to add points, bottom of the climb first.");
  const [out, setOut] = useState("");
  const box = useRef(null);

  useEffect(() => { try { const s = JSON.parse(localStorage.getItem("cragEdits") || "null"); if (s?.lines) setLines(s.lines); } catch {} }, []);
  const save = (ls) => { setLines(ls); try { localStorage.setItem("cragEdits", JSON.stringify({ lines: ls })); } catch {} };
  const line = lines.find((l) => l.n === cur) || lines[0];
  const upd = (fn) => save(lines.map((l) => (l.n === line.n ? fn({ ...l, pts: [...l.pts] }) : l)));

  const fig = cragSVG({ ...crag, w: photo.w, h: photo.h, lines }, { edit: true });
  const onClick = (e) => {
    const svg = box.current.querySelector("svg"); const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
    const p = pt.matrixTransform(svg.getScreenCTM().inverse());
    upd((l) => ({ ...l, pts: [...l.pts, [+(p.x / fig.VW).toFixed(4), +(p.y / fig.VH).toFixed(4)]] }));
  };
  const copy = () => {
    const txt = JSON.stringify({ lines: lines.map(({ n, route, label, pts }) => ({ n, route, label, pts })) }, null, 1);
    setOut(txt);
    navigator.clipboard?.writeText(txt).then(() => setMsg("Copied. Paste it to Claude or into data/crag-chief.json."), () => setMsg("Select and copy the box below."));
  };
  const onPhoto = (e) => {
    const f = e.target.files?.[0]; if (!f) return; const rd = new FileReader();
    rd.onload = () => { const im = new Image(); im.onload = () => setPhoto({ src: rd.result, w: im.width, h: im.height }); im.src = rd.result; };
    rd.readAsDataURL(f);
  };

  return (
    <div className="tracer">
      <div className="editbar">
        <b>Trace lines (preview only)</b>
        {lines.map((l) => (
          <button key={l.n} className="chip" aria-pressed={l.n === line.n} onClick={() => setCur(l.n)}>
            <span className="dot" style={{ background: LINE_COLOURS[(l.n - 1) % LINE_COLOURS.length] }} />{l.n}
          </button>
        ))}
        <select aria-label="Link this line to a route" value={line.route || ""} onChange={(e) => upd((l) => ({ ...l, route: e.target.value, label: rockRoutes.find((r) => r.slug === e.target.value)?.name || l.label }))}>
          <option value="">Link to route…</option>
          {rockRoutes.map((r) => <option key={r.slug} value={r.slug}>{r.name}</option>)}
        </select>
        <button className="chip" onClick={() => upd((l) => ({ ...l, pts: l.pts.slice(0, -1) }))}>Undo point</button>
        <button className="chip" onClick={() => upd((l) => ({ ...l, pts: [] }))}>Clear line</button>
        <button className="chip" onClick={() => { const n = Math.max(...lines.map((l) => l.n)) + 1; save([...lines, { n, route: "", label: `Line ${n}`, pts: [] }]); setCur(n); }}>+ New line</button>
        <label className="chip">Try another photo<input type="file" accept="image/*" hidden onChange={onPhoto} /></label>
        <button className="chip" onClick={copy}>Copy line data</button>
        <span className="muted">{msg}</span>
      </div>
      <div ref={box} className="crag editing" style={{ aspectRatio: `${fig.VW}/${fig.VH}` }} onClick={onClick}>
        <img src={photo.src} alt="" />
        <div className="svgwrap" dangerouslySetInnerHTML={{ __html: fig.svg }} />
      </div>
      {out && <textarea className="jsonout" readOnly value={out} />}
    </div>
  );
}

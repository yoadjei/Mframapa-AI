/** Pure export builders — shared by Export Centre UI and unit tests. */

export function escapeCsv(value) {
  if (value === null || value === undefined) return "";
  const s = String(value);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function buildCsv(savedCities, predictionHistory) {
  const rows = ["source,name,country,lat,lon,pm25,aqi_category,checked_at"];
  for (const loc of savedCities) {
    rows.push(
      [
        escapeCsv("saved"),
        escapeCsv(loc.name),
        escapeCsv(loc.country ?? ""),
        escapeCsv(loc.lat ?? ""),
        escapeCsv(loc.lon ?? ""),
        escapeCsv(loc.lastPm25 ?? ""),
        escapeCsv(loc.lastAqiCategory ?? ""),
        escapeCsv(loc.lastChecked ?? ""),
      ].join(",")
    );
  }
  for (const p of predictionHistory ?? []) {
    rows.push(
      [
        escapeCsv("history"),
        escapeCsv(p.location?.name ?? ""),
        escapeCsv(""),
        escapeCsv(p.location?.lat ?? ""),
        escapeCsv(p.location?.lon ?? ""),
        escapeCsv(typeof p.pm25 === "number" ? p.pm25.toFixed(1) : ""),
        escapeCsv(p.aqi_category ?? ""),
        escapeCsv(p.timestamp ?? ""),
      ].join(",")
    );
  }
  return rows.join("\n");
}

export function buildGeoJson(savedCities, predictionHistory) {
  const features = [];
  for (const loc of savedCities) {
    features.push({
      type: "Feature",
      geometry: { type: "Point", coordinates: [loc.lon, loc.lat] },
      properties: {
        source: "saved",
        name: loc.name,
        country: loc.country ?? null,
        pm25: loc.lastPm25 ?? null,
        aqi_category: loc.lastAqiCategory ?? null,
        checked_at: loc.lastChecked ?? null,
      },
    });
  }
  for (const p of predictionHistory ?? []) {
    features.push({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [p.location?.lon, p.location?.lat],
      },
      properties: {
        source: "history",
        name: p.location?.name,
        pm25: p.pm25,
        aqi_category: p.aqi_category,
        uncertainty: p.uncertainty,
        weather: p.weather,
        timestamp: p.timestamp,
      },
    });
  }
  return JSON.stringify({ type: "FeatureCollection", features }, null, 2);
}

export function buildHtml(savedCities, predictionHistory) {
  const esc = (s) =>
    String(s ?? "").replace(
      /[&<>"']/g,
      (c) =>
        ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
    );
  const savedRows = savedCities
    .map(
      (l) =>
        `<tr><td>${esc(l.name)}</td><td>${esc(l.country)}</td><td>${l.lastPm25 ?? "-"}</td><td>${esc(l.lastAqiCategory ?? "-")}</td></tr>`
    )
    .join("");
  const historyRows = (predictionHistory ?? [])
    .map(
      (p) =>
        `<tr><td>${esc(p.location?.name)}</td><td>${typeof p.pm25 === "number" ? p.pm25.toFixed(1) : "-"}</td><td>${esc(p.aqi_category)}</td><td>${esc(p.timestamp)}</td></tr>`
    )
    .join("");
  return `<!doctype html><html><head><meta charset="utf-8"><title>Mframapa Export</title>
    <style>body{font-family:-apple-system,system-ui,sans-serif;padding:24px;color:#111}
    h1{font-size:22px} h2{font-size:16px;margin-top:24px}
    table{border-collapse:collapse;width:100%;font-size:13px}
    th,td{border:1px solid #ddd;padding:8px;text-align:left}
    th{background:#f5f5f5}</style></head><body>
    <h1>Mframapa Air Quality Export</h1>
    <p>Generated ${new Date().toLocaleString()}</p>
    <h2>Saved locations (${savedCities.length})</h2>
    <table><tr><th>Name</th><th>Country</th><th>PM2.5</th><th>Category</th></tr>${savedRows}</table>
    <h2>Recent checks (${(predictionHistory ?? []).length})</h2>
    <table><tr><th>City</th><th>PM2.5</th><th>Category</th><th>Time</th></tr>${historyRows}</table>
  </body></html>`;
}

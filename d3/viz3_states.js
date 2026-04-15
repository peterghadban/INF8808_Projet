// ─── Viz 3 : Carte choroplèthe US ────────────────────────────────────────────
// Dépendances : D3 v7, TopoJSON v3
// Données     : viz3_states.json  { "CA": { count, avg_severity }, ... }
// Note        : les clés sont des abréviations d'état (2 lettres).
//               D3 US-atlas identifie les états par leur FIPS code numérique.
//               On doit joindre via properties.name (nom complet).

import * as d3        from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import * as topojson  from "https://cdn.jsdelivr.net/npm/topojson-client@3/+esm";

// Table de correspondance abréviation → nom complet (nécessaire pour le join)
const STATE_NAMES = {
  AL:"Alabama", AK:"Alaska", AZ:"Arizona", AR:"Arkansas", CA:"California",
  CO:"Colorado", CT:"Connecticut", DE:"Delaware", FL:"Florida", GA:"Georgia",
  HI:"Hawaii", ID:"Idaho", IL:"Illinois", IN:"Indiana", IA:"Iowa",
  KS:"Kansas", KY:"Kentucky", LA:"Louisiana", ME:"Maine", MD:"Maryland",
  MA:"Massachusetts", MI:"Michigan", MN:"Minnesota", MS:"Mississippi",
  MO:"Missouri", MT:"Montana", NE:"Nebraska", NV:"Nevada", NH:"New Hampshire",
  NJ:"New Jersey", NM:"New Mexico", NY:"New York", NC:"North Carolina",
  ND:"North Dakota", OH:"Ohio", OK:"Oklahoma", OR:"Oregon", PA:"Pennsylvania",
  RI:"Rhode Island", SC:"South Carolina", SD:"South Dakota", TN:"Tennessee",
  TX:"Texas", UT:"Utah", VT:"Vermont", VA:"Virginia", WA:"Washington",
  WV:"West Virginia", WI:"Wisconsin", WY:"Wyoming",
};

export async function renderViz3(container) {
  const [stateData, us] = await Promise.all([
    d3.json("data/viz3_states.json"),
    d3.json("https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json"),
  ]);

  // Remap abbreviations → full names for join
  const byName = {};
  for (const [abbr, vals] of Object.entries(stateData)) {
    const name = STATE_NAMES[abbr];
    if (name) byName[name] = vals;
  }

  const counts = Object.values(byName).map(d => d.count);
  const sevs   = Object.values(byName).map(d => d.avg_severity);

  const colorCount = d3.scaleQuantize(d3.extent(counts), d3.schemeBlues[7]);
  const colorSev   = d3.scaleQuantize(d3.extent(sevs),   d3.schemeOrRd[7]);

  let currentMode = "count";

  const wrap = container.querySelector("#map-svg-wrap");
  const W = wrap.offsetWidth || 700;
  const H = Math.round(W * 0.58);

  const svg = d3.select(wrap).append("svg")
    .attr("viewBox", `0 0 ${W} ${H}`)
    .attr("width", "100%");

  const projection = d3.geoAlbersUsa().scale(W * 1.25).translate([W / 2, H / 2]);
  const path       = d3.geoPath(projection);
  const features   = topojson.feature(us, us.objects.states).features;

  // Tooltip
  const tooltip = d3.select(container.querySelector("#map-tooltip"));

  function getColor(name) {
    const d = byName[name];
    if (!d) return "#ddd";
    return currentMode === "count"
      ? colorCount(d.count)
      : colorSev(d.avg_severity);
  }

  const paths = svg.selectAll("path")
    .data(features)
    .join("path")
    .attr("d", path)
    .attr("stroke", "#fff")
    .attr("stroke-width", 0.5)
    .attr("fill", d => getColor(d.properties.name))
    .on("mousemove", (event, d) => {
      const name = d.properties.name;
      const info = byName[name];
      if (!info) return;
      tooltip
        .style("display", "block")
        .style("left",  (event.offsetX + 12) + "px")
        .style("top",   (event.offsetY -  8) + "px")
        .html(`<strong>${name}</strong><br>
               ${d3.format(",")(info.count)} accidents<br>
               Gravité moy. ${info.avg_severity.toFixed(2)}`);
    })
    .on("mouseleave", () => tooltip.style("display", "none"));

  // Toggle buttons
  container.querySelectorAll("[data-map-mode]").forEach(btn => {
    btn.addEventListener("click", () => {
      currentMode = btn.dataset.mapMode;
      paths.attr("fill", d => getColor(d.properties.name));
      container.querySelectorAll("[data-map-mode]")
        .forEach(b => b.classList.toggle("active", b === btn));
    });
  });

  // Top 5 list
  const top5 = Object.entries(byName)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5);
  const topEl = container.querySelector("#top5-list");
  topEl.innerHTML = top5.map(([name, v]) =>
    `<span class="top-badge">${name}: ${d3.format(",")(v.count)}</span>`
  ).join("");
}

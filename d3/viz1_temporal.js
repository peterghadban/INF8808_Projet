// ─── Viz 1 : Double heatmap temporelle ───────────────────────────────────────
// Dépendances : D3 v7
// Données     : viz1_temporal.json  [{year, month, count, avg_severity}]

import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

export async function renderViz1(container) {
  const raw = await d3.json("data/viz1_temporal.json");

  const years  = [...new Set(raw.map(d => d.year))].sort();
  const months = ["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"];

  // Index data for O(1) lookup
  const countMap = new Map(raw.map(d => [`${d.year}-${d.month}`, d.count]));
  const sevMap   = new Map(raw.map(d => [`${d.year}-${d.month}`, d.avg_severity]));

  const counts   = raw.map(d => d.count);
  const sevs     = raw.map(d => d.avg_severity);
  const countExt = d3.extent(counts);
  const sevExt   = d3.extent(sevs);

  const colorCount = d3.scaleSequential(d3.interpolateBlues).domain(countExt);
  const colorSev   = d3.scaleSequential(d3.interpolateOrRd).domain(sevExt);

  // Season separator months (after month index 3, 6, 9)
  const seasonBreaks = [3, 6, 9];

  const cellW = 36, cellH = 24, labelW = 38, topPad = 22, gap = 2;
  const totalW = labelW + months.length * (cellW + gap);
  const totalH = topPad + years.length * (cellH + gap);

  function buildHeatmap(parentEl, valueMap, colorScale, fmt) {
    const svg = d3.select(parentEl)
      .append("svg")
      .attr("viewBox", `0 0 ${totalW} ${totalH}`)
      .attr("width", "100%");

    // Month labels
    svg.selectAll(".mlabel")
      .data(months)
      .join("text")
      .attr("class", "mlabel")
      .attr("x", (_, i) => labelW + i * (cellW + gap) + cellW / 2)
      .attr("y", topPad - 5)
      .attr("text-anchor", "middle")
      .attr("font-size", 10)
      .attr("fill", "#888")
      .text(d => d);

    // Season separators
    seasonBreaks.forEach(mi => {
      const x = labelW + mi * (cellW + gap) - gap / 2;
      svg.append("line")
        .attr("x1", x).attr("y1", 0)
        .attr("x2", x).attr("y2", totalH)
        .attr("stroke", "#aaa")
        .attr("stroke-dasharray", "3,2")
        .attr("stroke-width", 1);
    });

    years.forEach((yr, yi) => {
      const y = topPad + yi * (cellH + gap);

      // Year label
      svg.append("text")
        .attr("x", labelW - 4)
        .attr("y", y + cellH / 2 + 4)
        .attr("text-anchor", "end")
        .attr("font-size", 10)
        .attr("fill", "#888")
        .text(yr);

      months.forEach((_, mi) => {
        const key = `${yr}-${mi + 1}`;
        const val = valueMap.get(key);
        const x   = labelW + mi * (cellW + gap);

        svg.append("rect")
          .attr("x", x).attr("y", y)
          .attr("width", cellW).attr("height", cellH)
          .attr("rx", 2)
          .attr("fill", val != null ? colorScale(val) : "#eee")
          .append("title")
          .text(val != null ? `${yr}/${mi + 1} — ${fmt(val)}` : "Données manquantes");
      });
    });

    return svg;
  }

  // Render both heatmaps
  const wrap1 = container.querySelector("#hm-count");
  const wrap2 = container.querySelector("#hm-sev");

  buildHeatmap(wrap1, countMap, colorCount, d => d3.format(",")(d) + " accidents");
  buildHeatmap(wrap2, sevMap,   colorSev,   d => "Gravité moy. " + d.toFixed(2));

  // Color legends
  function buildLegend(el, colorScale, lo, hi) {
    const w = el.offsetWidth || 200, h = 10;
    const svg = d3.select(el).append("svg").attr("width", w).attr("height", h);
    const defs = svg.append("defs");
    const grad = defs.append("linearGradient").attr("id", el.id + "-grad");
    const stops = d3.range(0, 1.01, 0.1);
    stops.forEach(t => {
      grad.append("stop")
        .attr("offset", `${t * 100}%`)
        .attr("stop-color", colorScale(lo + (hi - lo) * t));
    });
    svg.append("rect").attr("width", w).attr("height", h).attr("rx", 2)
      .attr("fill", `url(#${el.id}-grad)`);
  }

  buildLegend(container.querySelector("#leg-count"), colorCount, ...countExt);
  buildLegend(container.querySelector("#leg-sev"),   colorSev,   ...sevExt);
}

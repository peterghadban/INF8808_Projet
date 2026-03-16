// ─── Viz 2 : Heatmap jours × heures ─────────────────────────────────────────
// Dépendances : D3 v7
// Données     : viz2_weekhour.json   [{dayofweek, hour, count}]
//               viz2_daynight.json   {day_pct, night_pct}

import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

export async function renderViz2(container) {
  const [raw, summary] = await Promise.all([
    d3.json("data/viz2_weekhour.json"),
    d3.json("data/viz2_daynight.json"),
  ]);

  const days  = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
  const hours = d3.range(24);

  const valueMap = new Map(raw.map(d => [`${d.dayofweek}-${d.hour}`, d.count]));
  const allCounts = raw.map(d => d.count);
  const colorScale = d3.scaleSequential(d3.interpolateBlues).domain(d3.extent(allCounts));

  const cellW = 26, cellH = 22, labelW = 30, topPad = 20, gap = 1;
  const totalW = labelW + hours.length * (cellW + gap);
  const totalH = topPad + days.length  * (cellH + gap);

  const svg = d3.select(container.querySelector("#hm-week"))
    .append("svg")
    .attr("viewBox", `0 0 ${totalW} ${totalH}`)
    .attr("width", "100%");

  // Night background bands
  [[0, 6], [20, 24]].forEach(([s, e]) => {
    svg.append("rect")
      .attr("x",      labelW + s * (cellW + gap))
      .attr("y",      0)
      .attr("width",  (e - s) * (cellW + gap))
      .attr("height", totalH)
      .attr("fill",   "currentColor")
      .attr("fill-opacity", 0.04);
  });

  // Hour labels (every 3h)
  hours.forEach(h => {
    if (h % 3 !== 0) return;
    svg.append("text")
      .attr("x", labelW + h * (cellW + gap) + cellW / 2)
      .attr("y", topPad - 5)
      .attr("text-anchor", "middle")
      .attr("font-size", 10)
      .attr("fill", "#888")
      .text(`${h}h`);
  });

  // Cells
  days.forEach((day, di) => {
    const y = topPad + di * (cellH + gap);

    svg.append("text")
      .attr("x", labelW - 4)
      .attr("y", y + cellH / 2 + 4)
      .attr("text-anchor", "end")
      .attr("font-size", 10)
      .attr("fill", "#888")
      .text(day);

    hours.forEach(h => {
      const val = valueMap.get(`${di}-${h}`) ?? 0;
      const x   = labelW + h * (cellW + gap);
      svg.append("rect")
        .attr("x", x).attr("y", y)
        .attr("width", cellW).attr("height", cellH)
        .attr("rx", 2)
        .attr("fill", colorScale(val))
        .append("title")
        .text(`${day} ${h}h — ${d3.format(",")(val)} accidents`);
    });
  });

  // Day / Night summary cards
  container.querySelector("#day-pct").textContent   = summary.day_pct   + "%";
  container.querySelector("#night-pct").textContent = summary.night_pct + "%";

  // Peak (max cell)
  const peak = raw.reduce((a, b) => b.count > a.count ? b : a);
  container.querySelector("#peak-slot").textContent =
    `${days[peak.dayofweek]} ${peak.hour}h`;
}

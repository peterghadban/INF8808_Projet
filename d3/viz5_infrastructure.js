// ─── Viz 5 : Bar chart infrastructure routière ───────────────────────────────
// Dépendances : D3 v7
// Données     : viz5_infrastructure.json
//   [{feature, present_count, absent_count, present_pct, absent_pct, odds_ratio}]

import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

export async function renderViz5(container) {
  const raw = await d3.json("data/viz5_infrastructure.json");

  let currentView = "proportion";

  const margin = { top: 20, right: 20, bottom: 60, left: 55 };
  const wrap   = container.querySelector("#v5-wrap");
  const W      = (wrap.offsetWidth || 600) - margin.left - margin.right;
  const H      = 280 - margin.top - margin.bottom;

  const svg = d3.select(wrap).append("svg")
    .attr("width",  W + margin.left + margin.right)
    .attr("height", H + margin.top  + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const labels = raw.map(d => d.feature);
  const x = d3.scaleBand().domain(labels).range([0, W]).padding(0.25);
  const y = d3.scaleLinear().range([H, 0]);

  const xAxisG = svg.append("g").attr("transform", `translate(0,${H})`);
  const yAxisG = svg.append("g");
  const yLabelEl = svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -H / 2).attr("y", -margin.left + 12)
    .attr("text-anchor", "middle")
    .attr("font-size", 11).attr("fill", "#888");

  // Reference line at OR=1 (drawn once, toggled)
  const refLine = svg.append("line")
    .attr("stroke", "rgba(200,80,80,0.6)")
    .attr("stroke-width", 1.5)
    .attr("stroke-dasharray", "4,3")
    .attr("display", "none");

  const colorPresent = "#5B8FC4";
  const colorAbsent  = "#B0B8C1";
  const colorOdds    = d => d.odds_ratio >= 2.0 ? "#5B8FC4" : d.odds_ratio >= 1.5 ? "#8BAED4" : "#B0B8C1";

  function draw() {
    svg.selectAll(".bar-group").remove();

    if (currentView === "proportion") {
      // Grouped bars: present + absent
      const sub = d3.scaleBand().domain(["present", "absent"]).range([0, x.bandwidth()]).padding(0.05);
      const maxVal = d3.max(raw, d => Math.max(d.present_pct, d.absent_pct));
      y.domain([0, maxVal * 1.1]);

      xAxisG.call(d3.axisBottom(x).tickSize(0))
        .selectAll("text").attr("font-size", 11).attr("fill", "#888").attr("dy", "1.2em");
      xAxisG.select(".domain").attr("stroke", "#ddd");

      yAxisG.call(d3.axisLeft(y).ticks(5).tickFormat(d => d + "%").tickSize(-W))
        .selectAll("text").attr("font-size", 11).attr("fill", "#888");
      yAxisG.selectAll(".tick line").attr("stroke", "#eee");
      yAxisG.select(".domain").remove();

      yLabelEl.text("% d'accidents");
      refLine.attr("display", "none");

      raw.forEach(d => {
        const g = svg.append("g").attr("class", "bar-group");
        [
          { key: "present", val: d.present_pct, col: colorPresent, label: "Présent" },
          { key: "absent",  val: d.absent_pct,  col: colorAbsent,  label: "Absent"  },
        ].forEach(({ key, val, col, label }) => {
          g.append("rect")
            .attr("x",      x(d.feature) + sub(key))
            .attr("y",      y(val))
            .attr("width",  sub.bandwidth())
            .attr("height", H - y(val))
            .attr("rx", 2)
            .attr("fill", col)
            .append("title")
            .text(`${d.feature} — ${label}: ${val.toFixed(1)}% (${d3.format(",")(key === "present" ? d.present_count : d.absent_count)} accidents)`);
        });
      });

    } else {
      // Odds ratio bars
      const maxOR = d3.max(raw, d => d.odds_ratio);
      y.domain([0, maxOR * 1.15]);

      xAxisG.call(d3.axisBottom(x).tickSize(0))
        .selectAll("text").attr("font-size", 11).attr("fill", "#888").attr("dy", "1.2em");
      xAxisG.select(".domain").attr("stroke", "#ddd");

      yAxisG.call(d3.axisLeft(y).ticks(5).tickSize(-W))
        .selectAll("text").attr("font-size", 11).attr("fill", "#888");
      yAxisG.selectAll(".tick line").attr("stroke", "#eee");
      yAxisG.select(".domain").remove();

      yLabelEl.text("Odds ratio (OR=1 : pas d'effet)");

      // OR=1 reference line
      refLine
        .attr("display", null)
        .attr("x1", 0).attr("y1", y(1))
        .attr("x2", W).attr("y2", y(1));

      raw.forEach(d => {
        const g = svg.append("g").attr("class", "bar-group");
        g.append("rect")
          .attr("x",      x(d.feature))
          .attr("y",      y(d.odds_ratio))
          .attr("width",  x.bandwidth())
          .attr("height", H - y(d.odds_ratio))
          .attr("rx", 2)
          .attr("fill", colorOdds(d))
          .append("title")
          .text(`${d.feature} — OR: ${d.odds_ratio.toFixed(2)}`);
      });
    }
  }

  draw();

  // Toggle buttons
  container.querySelectorAll("[data-v5-view]").forEach(btn => {
    btn.addEventListener("click", () => {
      currentView = btn.dataset.v5View;
      container.querySelectorAll("[data-v5-view]")
        .forEach(b => b.classList.toggle("active", b === btn));
      draw();
    });
  });
}

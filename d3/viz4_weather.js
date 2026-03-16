// ─── Viz 4 : Boxplot météo ────────────────────────────────────────────────────
// Dépendances : D3 v7
// Données     : viz4_weather.json
//   [{category, count, severity:{min,q1,median,q3,max}, precipitation:{...}}]

import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

export async function renderViz4(container) {
  const raw = await d3.json("data/viz4_weather.json");

  // Sort by count desc (already done in Python, but ensure it)
  raw.sort((a, b) => b.count - a.count);

  const categories = raw.map(d => d.category);
  let currentMetric = "severity";

  const margin = { top: 20, right: 20, bottom: 60, left: 50 };
  const wrap   = container.querySelector("#bp-wrap");
  const W      = (wrap.offsetWidth || 600) - margin.left - margin.right;
  const H      = 280 - margin.top - margin.bottom;

  const svg = d3.select(wrap).append("svg")
    .attr("width",  W + margin.left + margin.right)
    .attr("height", H + margin.top  + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const x = d3.scaleBand().domain(categories).range([0, W]).padding(0.3);
  const y = d3.scaleLinear().range([H, 0]);

  const xAxis = svg.append("g").attr("transform", `translate(0,${H})`);
  const yAxis = svg.append("g");
  const yLabel = svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -H / 2).attr("y", -margin.left + 12)
    .attr("text-anchor", "middle")
    .attr("font-size", 11).attr("fill", "#888");

  // Grid lines
  const gridG = svg.insert("g", ":first-child").attr("class", "grid");

  function getVals(d) {
    return currentMetric === "severity" ? d.severity : d.precipitation;
  }

  function draw() {
    const allStats = raw.map(getVals);
    const yMin = d3.min(allStats, d => d.min);
    const yMax = d3.max(allStats, d => d.max);
    const pad  = (yMax - yMin) * 0.1;
    y.domain([yMin - pad, yMax + pad]);

    // Axes
    xAxis.call(
      d3.axisBottom(x)
        .tickSize(0)
    ).selectAll("text")
      .attr("font-size", 11)
      .attr("fill", "#888")
      .attr("dy", "1.2em");

    xAxis.select(".domain").attr("stroke", "#ddd");

    yAxis.call(d3.axisLeft(y).ticks(5).tickSize(-W))
      .selectAll("text").attr("font-size", 11).attr("fill", "#888");
    yAxis.selectAll(".tick line").attr("stroke", "#eee");
    yAxis.select(".domain").remove();

    yLabel.text(currentMetric === "severity" ? "Gravité" : "Précipitations (in)");

    // Boxplots
    const color = "#3B7EC4";
    svg.selectAll(".box-group").remove();

    raw.forEach(d => {
      const stats = getVals(d);
      const cx    = x(d.category) + x.bandwidth() / 2;
      const bw    = x.bandwidth();
      const hw    = bw * 0.35;
      const g     = svg.append("g").attr("class", "box-group");

      // Whisker top
      g.append("line")
        .attr("x1", cx).attr("y1", y(stats.max))
        .attr("x2", cx).attr("y2", y(stats.q3))
        .attr("stroke", color).attr("stroke-width", 1.5);

      // Whisker cap top
      g.append("line")
        .attr("x1", cx - hw * 0.5).attr("y1", y(stats.max))
        .attr("x2", cx + hw * 0.5).attr("y2", y(stats.max))
        .attr("stroke", color).attr("stroke-width", 1.5);

      // Box Q1–Q3
      g.append("rect")
        .attr("x", cx - hw)
        .attr("y", y(stats.q3))
        .attr("width",  bw * 0.7)
        .attr("height", Math.abs(y(stats.q1) - y(stats.q3)))
        .attr("rx", 2)
        .attr("fill",   color + "33")
        .attr("stroke", color)
        .attr("stroke-width", 1);

      // Median line
      g.append("line")
        .attr("x1", cx - hw).attr("y1", y(stats.median))
        .attr("x2", cx + hw).attr("y2", y(stats.median))
        .attr("stroke", color).attr("stroke-width", 2);

      // Whisker bottom
      g.append("line")
        .attr("x1", cx).attr("y1", y(stats.q1))
        .attr("x2", cx).attr("y2", y(stats.min))
        .attr("stroke", color).attr("stroke-width", 1.5);

      g.append("line")
        .attr("x1", cx - hw * 0.5).attr("y1", y(stats.min))
        .attr("x2", cx + hw * 0.5).attr("y2", y(stats.min))
        .attr("stroke", color).attr("stroke-width", 1.5);

      // Tooltip rect (invisible)
      g.append("rect")
        .attr("x", cx - bw / 2).attr("y", y(stats.max))
        .attr("width", bw)
        .attr("height", y(stats.min) - y(stats.max))
        .attr("fill", "transparent")
        .append("title")
        .text(`${d.category}\nMédiane: ${stats.median}\nQ1: ${stats.q1} – Q3: ${stats.q3}\nMin: ${stats.min} / Max: ${stats.max}\nN=${d3.format(",")(d.count)}`);
    });
  }

  draw();

  // Metric toggle
  container.querySelectorAll("[data-bp-metric]").forEach(btn => {
    btn.addEventListener("click", () => {
      currentMetric = btn.dataset.bpMetric;
      container.querySelectorAll("[data-bp-metric]")
        .forEach(b => b.classList.toggle("active", b === btn));
      draw();
    });
  });
}

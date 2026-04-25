// ─── Viz 4 : Météo & Température ─────────────────────────────────────────────
// Dépendances : D3 v7
// Données     : viz4_weather_stacked.json  [{category, severity, count}]
//               viz4_temperature.json      [{bin_label, accident_count, exposure_pct}]

import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

const SEV_COLORS = {
  1: "#B5D4F4",
  2: "#378ADD",
  3: "#185FA5",
  4: "#042C53",
};

export async function renderViz4(container) {
  const [stacked, tempData] = await Promise.all([
    d3.json("data/viz4_weather_stacked.json"),
    d3.json("data/viz4_temperature.json"),
  ]);

  let activeTab = "q11";

  const chartWrap = container.querySelector("#v4-chart");

  function clearChart() {
    chartWrap.innerHTML = "";
  }

  // ── Q11 : horizontal stacked bar ──────────────────────────────────────────
  function drawQ11() {
    clearChart();

    const severities = [1, 2, 3, 4];

    // Build per-category totals and stacked data
    const catTotals = new Map();
    stacked.forEach(d => {
      catTotals.set(d.category, (catTotals.get(d.category) || 0) + d.count);
    });

    const categories = [...catTotals.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([cat]) => cat);

    // Pivot to { category -> { sev -> count } }
    const pivot = new Map();
    categories.forEach(c => pivot.set(c, {}));
    stacked.forEach(d => {
      pivot.get(d.category)[d.severity] = d.count;
    });

    // D3 stack
    const stackData = categories.map(cat => {
      const row = { category: cat };
      severities.forEach(s => { row[s] = pivot.get(cat)[s] || 0; });
      return row;
    });

    const stack = d3.stack().keys(severities)(stackData);

    const margin = { top: 16, right: 120, bottom: 40, left: 110 };
    const W = (chartWrap.offsetWidth || 680) - margin.left - margin.right;
    const H = categories.length * 36;

    const svg = d3.select(chartWrap).append("svg")
      .attr("width",  W + margin.left + margin.right)
      .attr("height", H + margin.top  + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scaleLinear()
      .domain([0, d3.max(catTotals.values())])
      .range([0, W]);

    const y = d3.scaleBand()
      .domain(categories)
      .range([0, H])
      .padding(0.25);

    // Grid lines
    svg.append("g").attr("class", "grid")
      .call(d3.axisBottom(x).ticks(5).tickSize(H).tickFormat(""))
      .attr("transform", "translate(0,0)")
      .selectAll("line").attr("stroke", "#eee");
    svg.select(".grid .domain").remove();

    // Axes
    svg.append("g")
      .call(d3.axisLeft(y).tickSize(0))
      .selectAll("text")
        .attr("font-size", 11).attr("fill", "#555").attr("dx", "-6");
    svg.select(".domain").remove();

    svg.append("g")
      .attr("transform", `translate(0,${H})`)
      .call(
        d3.axisBottom(x)
          .ticks(5)
          .tickFormat(d => d >= 1e6 ? d3.format(".1f")(d / 1e6) + "M" : d3.format(",")(d))
      )
      .selectAll("text").attr("font-size", 10).attr("fill", "#888");

    // Bars
    stack.forEach(layer => {
      svg.selectAll(`.bar-sev-${layer.key}`)
        .data(layer)
        .join("rect")
        .attr("class", `bar-sev-${layer.key}`)
        .attr("y",      d => y(d.data.category))
        .attr("x",      d => x(d[0]))
        .attr("width",  d => x(d[1]) - x(d[0]))
        .attr("height", y.bandwidth())
        .attr("fill",   SEV_COLORS[layer.key])
        .append("title")
        .text(d => `${d.data.category} — Sévérité ${layer.key}: ${d3.format(",")(d[1] - d[0])}`);
    });

    // Legend
    const leg = svg.append("g").attr("transform", `translate(${W + 12}, 10)`);
    severities.forEach((s, i) => {
      const g = leg.append("g").attr("transform", `translate(0,${i * 20})`);
      g.append("rect").attr("width", 12).attr("height", 12).attr("rx", 2).attr("fill", SEV_COLORS[s]);
      g.append("text").attr("x", 16).attr("y", 10)
        .attr("font-size", 11).attr("fill", "#555")
        .text(`Sévérité ${s}`);
    });
  }

  // ── Q13 : dual-axis line chart ─────────────────────────────────────────────
  function drawQ13() {
    clearChart();

    const margin = { top: 20, right: 60, bottom: 80, left: 70 };
    const W = (chartWrap.offsetWidth || 680) - margin.left - margin.right;
    const H = 300 - margin.top - margin.bottom;

    const svg = d3.select(chartWrap).append("svg")
      .attr("width",  W + margin.left + margin.right)
      .attr("height", H + margin.top  + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scalePoint()
      .domain(tempData.map(d => d.bin_label))
      .range([0, W]);

    const yLeft = d3.scaleLinear()
      .domain([0, d3.max(tempData, d => d.accident_count) * 1.1])
      .range([H, 0]);

    const yRight = d3.scaleLinear()
      .domain([0, d3.max(tempData, d => d.exposure_pct) * 1.1])
      .range([H, 0]);

    // Show every 4th label to avoid overlap
    const tickFilter = tempData.map((d, i) => i % 4 === 0 ? d.bin_label : null).filter(Boolean);

    svg.append("g")
      .attr("transform", `translate(0,${H})`)
      .call(d3.axisBottom(x).tickValues(tickFilter).tickSize(0))
      .selectAll("text")
        .attr("font-size", 10).attr("fill", "#888")
        .attr("transform", "rotate(-40)")
        .attr("text-anchor", "end")
        .attr("dy", "0.4em")
        .attr("dx", "-0.4em");

    svg.append("g")
      .call(
        d3.axisLeft(yLeft)
          .ticks(5)
          .tickFormat(d => d >= 1e6 ? d3.format(".1f")(d / 1e6) + "M" : d3.format(",")(d))
          .tickSize(-W)
      )
      .selectAll("text").attr("font-size", 10).attr("fill", "#378ADD");
    svg.selectAll(".tick line").attr("stroke", "#eee");
    svg.select(".domain").remove();

    svg.append("g")
      .attr("transform", `translate(${W},0)`)
      .call(d3.axisRight(yRight).ticks(5).tickFormat(d => d + "%"))
      .selectAll("text").attr("font-size", 10).attr("fill", "#E24B4A");

    // Left Y label
    svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -H / 2).attr("y", -margin.left + 14)
      .attr("text-anchor", "middle")
      .attr("font-size", 11).attr("fill", "#378ADD")
      .text("Nombre d'accidents");

    // Right Y label
    svg.append("text")
      .attr("transform", "rotate(90)")
      .attr("x", H / 2).attr("y", -W - margin.right + 14)
      .attr("text-anchor", "middle")
      .attr("font-size", 11).attr("fill", "#E24B4A")
      .text("Part des données (%)");

    // Accident count line (blue)
    svg.append("path")
      .datum(tempData)
      .attr("fill", "none")
      .attr("stroke", "#378ADD")
      .attr("stroke-width", 2)
      .attr("d", d3.line()
        .x(d => x(d.bin_label))
        .y(d => yLeft(d.accident_count))
        .curve(d3.curveMonotoneX)
      );

    // Exposure pct line (red dashed)
    svg.append("path")
      .datum(tempData)
      .attr("fill", "none")
      .attr("stroke", "#E24B4A")
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", "6,4")
      .attr("d", d3.line()
        .x(d => x(d.bin_label))
        .y(d => yRight(d.exposure_pct))
        .curve(d3.curveMonotoneX)
      );

    // Annotation
    svg.append("text")
      .attr("x", W)
      .attr("y", H + margin.bottom - 4)
      .attr("text-anchor", "end")
      .attr("font-size", 10)
      .attr("fill", "#888");
  }

  // ── Tab switching ──────────────────────────────────────────────────────────
  function renderTab(key) {
    activeTab = key;
    key === "q11" ? drawQ11() : drawQ13();
  }

  container.querySelectorAll("[data-v4-tab]").forEach(btn => {
    btn.addEventListener("click", () => {
      container.querySelectorAll("[data-v4-tab]")
        .forEach(b => b.classList.toggle("active", b === btn));
      renderTab(btn.dataset.v4Tab);
    });
  });

  renderTab("q11");
}

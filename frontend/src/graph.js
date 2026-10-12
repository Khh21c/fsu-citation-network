import * as d3 from "d3";

const FSU_RED = "#782F40";

/**
 * Draw a force-directed graph into an <svg> element.
 * Pure D3: receives the SVG element and the data, holds no framework state.
 * @param {SVGSVGElement} svgElement
 * @param {{nodes: Array, links: Array}} data  (links reference nodes by id)
 * @returns {{fit: Function, destroy: Function}}
 */
export function renderGraph(svgElement, data) {
  const { width, height } = svgElement.getBoundingClientRect();

  // d3 mutates the objects it is given, so work on copies
  const nodes = data.nodes.map((d) => ({ ...d }));
  const links = data.links.map((d) => ({ ...d }));

  const svg = d3.select(svgElement);
  svg.selectAll("*").remove();
  svg.attr("viewBox", [0, 0, width, height]);

  // One container <g> holds links and nodes; zoom transforms this group, never the <svg>
  const container = svg.append("g");

  const link = container.append("g")
    .attr("stroke", "#888").attr("stroke-opacity", 0.6)
    .selectAll("line").data(links).join("line")
    .attr("stroke-width", (d) => 0.8 + Math.sqrt(d.value));   // width scales with repeat count

  const node = container.append("g")
    .attr("stroke", "#fff").attr("stroke-width", 0.5)
    .selectAll("circle").data(nodes).join("circle")
    .attr("r", (d) => 3 + Math.sqrt(d.cited_by ?? 0))
    .attr("fill", FSU_RED);

  node.append("title").text(
    (d) => `${d.id}\nCited by ${d.cited_by} | Cites ${d.cites} | Component ${d.group}`
  );

  // --- Force simulation ---
  const simulation = d3.forceSimulation(nodes)
    .force("link", d3.forceLink(links).id((d) => d.id).distance(25))
    .force("charge", d3.forceManyBody().strength(-30))
    .force("center", d3.forceCenter(width / 2, height / 2))
    // pull disconnected components toward the middle so they don't drift away
    .force("x", d3.forceX(width / 2).strength(0.08))
    .force("y", d3.forceY(height / 2).strength(0.08))
    .on("tick", () => {
      link.attr("x1", (d) => d.source.x).attr("y1", (d) => d.source.y)
          .attr("x2", (d) => d.target.x).attr("y2", (d) => d.target.y);
      node.attr("cx", (d) => d.x).attr("cy", (d) => d.y);
    })
    .on("end", () => fit());   // zoom-to-fit once the layout has settled

  // --- Zoom and pan: wheel zooms, dragging the background pans ---
  const zoom = d3.zoom()
    .scaleExtent([0.02, 40])
    .on("zoom", (event) => container.attr("transform", event.transform));
  svg.call(zoom);

  // --- Drag individual nodes (takes priority over background pan) ---
  node.call(
    d3.drag()
      .on("start", (event, d) => {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x; d.fy = d.y;
      })
      .on("drag", (event, d) => { d.fx = event.x; d.fy = event.y; })
      .on("end", (event, d) => {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null; d.fy = null;
      })
  );

  // --- Zoom-to-fit: scale and centre the extent of all node positions ---
  function fit(duration = 750) {
    const xs = nodes.map((d) => d.x);
    const ys = nodes.map((d) => d.y);
    const [x0, x1] = d3.extent(xs);
    const [y0, y1] = d3.extent(ys);
    const boxW = Math.max(x1 - x0, 1);
    const boxH = Math.max(y1 - y0, 1);
    const padding = 0.92;                                    // leave a small margin
    const scale = Math.min(padding * width / boxW, padding * height / boxH, 8);
    const tx = width / 2 - scale * (x0 + x1) / 2;
    const ty = height / 2 - scale * (y0 + y1) / 2;
    svg.transition().duration(duration)
      .call(zoom.transform, d3.zoomIdentity.translate(tx, ty).scale(scale));
  }

  return { fit, destroy: () => simulation.stop() };
}

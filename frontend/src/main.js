import "./style.css";
import { renderGraph } from "./graph.js";

import { FSUID, FULL_NAME } from "./config.js";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5000";

document.getElementById("title").textContent =
  `Citation Network Visualization in FSU (${FSUID}, ${FULL_NAME})`;
document.title = "Citation Network Visualization in FSU";

const status = document.getElementById("status");

async function main() {
  try {
    const response = await fetch(`${API_URL}/api/network`);   // data comes from the backend, not the CSV
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();

    status.textContent = `${data.nodes.length} papers, ${data.links.length} citations`;
    const graph = renderGraph(document.getElementById("graph"), data);
    document.getElementById("fit").addEventListener("click", () => graph.fit());
  } catch (err) {
    status.textContent = `Could not load data from ${API_URL}/api/network (${err.message}). Is the backend running?`;
    console.error(err);
  }
}

main();

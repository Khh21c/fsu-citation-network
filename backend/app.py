"""Flask backend: loads the FSU citation edges from CSV and serves them as a D3-ready network."""
import os
from pathlib import Path

import networkx as nx
import pandas as pd
from flask import Flask, jsonify
from flask_cors import CORS

CSV_PATH = Path(os.environ.get(
    "CSV_PATH",
    Path(__file__).parent / "data" / "paper_citation_links_within_fsu.csv",
))

app = Flask(__name__)
CORS(app)  # the Vite dev server (localhost:3000) is a different origin than this API (localhost:5000)


def build_network(csv_path):
    """Read the edge list and return {"nodes": [...], "links": [...]}."""
    edges = pd.read_csv(csv_path, usecols=["paper_id_1", "paper_id_2"]).dropna()

    # value = number of times each directed edge (paper_id_1 cites paper_id_2) appears
    links_df = (edges.groupby(["paper_id_1", "paper_id_2"])
                     .size().reset_index(name="value"))

    # Analysis: group = connected component (0 = the largest), ignoring edge direction
    G = nx.Graph()
    G.add_edges_from(zip(links_df["paper_id_1"], links_df["paper_id_2"]))
    components = sorted(nx.connected_components(G), key=len, reverse=True)
    group_of = {node: i for i, comp in enumerate(components) for node in comp}

    cites = links_df.groupby("paper_id_1").size()       # how many papers each paper cites
    cited_by = links_df.groupby("paper_id_2").size()    # how many papers cite each paper

    nodes = [
        {"id": n,
         "group": group_of[n],
         "cites": int(cites.get(n, 0)),
         "cited_by": int(cited_by.get(n, 0))}
        for n in sorted(G.nodes)                          # unique ids across both columns
    ]
    links = [{"source": s, "target": t, "value": int(v)}
             for s, t, v in links_df.itertuples(index=False)]
    return {"nodes": nodes, "links": links}


# Load once at startup: fails fast with a clear message if the CSV is missing.
if not CSV_PATH.exists():
    raise SystemExit(f"CSV not found: {CSV_PATH}\n"
                     "Copy paper_citation_links_within_fsu.csv into backend/data/ first.")
NETWORK = build_network(CSV_PATH)
print(f"Loaded {len(NETWORK['nodes'])} nodes and {len(NETWORK['links'])} links from {CSV_PATH.name}")


@app.get("/api/network")
def network():
    return jsonify(NETWORK)


@app.get("/api/health")
def health():
    return jsonify({"status": "ok",
                    "nodes": len(NETWORK["nodes"]),
                    "links": len(NETWORK["links"])})


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)

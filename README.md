# Citation Network Visualization in FSU

Interactive force-directed graph of citations between Florida State University papers (OpenAlex data, 2021-2026).

- **backend/**: Flask API. Reads `backend/data/paper_citation_links_within_fsu.csv` and serves `GET /api/network`.
- **frontend/**: Vite + D3. Fetches the API and draws the graph (zoom, pan, drag, zoom-to-fit).

## Run it

Backend (terminal 1):

```
conda activate dvjupyter
cd backend
pip install -r requirements.txt
python app.py            # http://localhost:5000
```

Frontend (terminal 2):

```
cd frontend
npm install
npm run dev              # http://localhost:3000
```

Open http://localhost:3000. Set your FSU ID and name in `frontend/src/config.js` (or let `setup.bat` do it).

## API

`GET /api/network` returns:

```
{"nodes": [{"id", "group", "cites", "cited_by"}],
 "links": [{"source", "target", "value"}]}
```

`group` is the connected component (0 = largest), `value` is how many times a citation edge repeats.

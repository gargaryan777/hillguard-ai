# 🛡️ HillGuard AI — Landslide Early Warning & Command Platform
     Here it is working live: https://hillguard-ai.vercel.app

> **Real-time, hyper-local landslide intelligence for Himalayan lifelines and disaster response teams.**

Built for **Smart India Hackathon** — *Disaster Management & Resilient Infrastructure*.

---

## ⚡ Quick Navigation & Live Demos

| Service | URL | Role |
|:---|:---|:---|
| **Command Center UI (Next.js)** | [http://localhost:3000](http://localhost:3000) | Primary GIS Command Console, Live Risk Map, Alert Dispatch |
| **FastAPI REST + WebSocket** | [http://localhost:8000](http://localhost:8000) | ML Inference Engine, SRTM DEM Sampler, Sync Pipeline |
| **Interactive API Docs** | [http://localhost:8000/docs](http://localhost:8000/docs) | OpenAPI / Swagger Specifications & Live Testing |
| **Streamlit Prototype UI** | [http://localhost:8501](http://localhost:8501) | Single-process geo-analytics & PDF report exporter (`app.py`) |

---

## 1. 🏔️ Why HillGuard AI Exists (The Problem We Are Solving)

The Himalayan belt—and specifically **Sikkim and the North Eastern Region (NER)**—faces some of the world's most catastrophic monsoon-triggered mass wasting events. The lifeline of Sikkim, **National Highway 10 (NH-10)**, is repeatedly severed during heavy precipitation, cutting off food supplies, emergency medical transit, military logistics, and entire rural populations.

### The Real-World Breakdown Today:
1. **The Lead-Time Crisis:** Landslides happen in minutes, but official administrative warnings are issued at macro district scales (e.g., *"Heavy rainfall alert for East Sikkim"*). District-wide bulletins don't tell an on-ground engineer whether **Km 42 on NH-10** or a specific slope behind a village school will fail in the next 3 hours.
2. **The "Last-Mile Communication Void":** When torrential rains strike, mobile towers collapse and optical fiber links snap. Traditional cloud-heavy disaster platforms become completely inaccessible on the ground precisely when they are needed most.
3. **Static Maps vs Dynamic Reality:** State agencies possess geological atlases and slope susceptibility maps, but they are **static PDFs or historical shapefiles**. A slope that is stable under 10 mm of rain becomes lethal after 180 mm of antecedent downpour.
4. **Linguistic & Operational Disconnect:** Ground reporters and village panchayats in the North East speak Nepali, Assamese, Bengali, and Hindi. Complex desktop GIS software (ArcGIS/QGIS) is alienating and requires specialized GIS operators.

> **HillGuard's Core Mission:**  
> Provide instant, hyper-local slope risk assessment at 30-meter resolution for any coordinate, dynamically boosted by live rainfall, accessible over zero-bandwidth offline conditions, in local languages, with a bidirectional bridge between village reporters and district emergency command centers.

---

## 2. ⚔️ Competitive Analysis: How HillGuard Differs from the Market

| Feature / Dimension | Existing GSI Landslide Atlas / State Portals | IMD / NDMA Weather Warnings (SACHET) | NASA LHASA / Global Models | 🛡️ HillGuard AI |
| :--- | :--- | :--- | :--- | :--- |
| **Spatial Granularity** | Regional / Macro polygon zones | District / Subdivision level | 1 km – 10 km grid resolution | **Hyper-local 30m terrain resolution** (NASA SRTM DEM) |
| **Dynamic Temporal Scoring** | Static (historic susceptibility) | Static rainfall forecast bulletins | 3-hr / Daily rainfall satellite grid | **Real-time on-demand point evaluation** combining terrain + live nowcast |
| **Offline Capability** | ❌ None (requires active web) | ❌ SMS broadcast only (one-way) | ❌ Cloud-only API | **✅ Full Offline-First PWA** with IndexedDB (Dexie) & auto-sync queue |
| **Bidirectional Field Flow** | ❌ Top-down publication only | ❌ Broadcast only (no ground feedback) | ❌ Satellite feed only | **✅ Citizen & Field Officer Reporting** with geotagged uploads and status tracking |
| **Deployment & Cost** | Heavyweight proprietary GIS (ArcGIS) | Government legacy portals | High-complexity cloud dependencies | **Zero-cost, lightweight web stack** (MapLibre, FastAPI, Next.js, SQLite/PostGIS) |
| **Regional Inclusivity** | English / Hindi only | Multi-channel SMS | English only | **Native NER Dialects** (Nepali, Assamese, Bengali, Hindi, English) |
| **Interactivity** | View-only PDF/Raster viewer | Text alert delivery | Static raster layers | **Interactive Command Center** (What-if rainfall sliders, instant click-to-evaluate) |

---

## 3. 🎯 What We Are Really Building (System Architecture)

```
                       [ Field Ground Reporters / Citizens / BRO Officers ]
                                                │
                                    (Multilingual PWA Shell)
                                    (IndexedDB Offline Cache)
                                                │
                      ┌─────────────────────────┴─────────────────────────┐
                      │                                                   │
               [ Offline Mode ]                                    [ Online Sync ]
           Queue reports in Dexie.js                         REST / WebSocket (FastAPI)
                      │                                                   │
                      └─────────────────────────┬─────────────────────────┘
                                                ▼
                               ┌─────────────────────────────────┐
                               │     HillGuard Intelligence      │
                               │        FastAPI + Python         │
                               └────────────────┬────────────────┘
                                                │
                 ┌──────────────────────────────┼──────────────────────────────┐
                 ▼                              ▼                              ▼
     [ Terrain Engine (30m) ]       [ Predictive ML Core ]         [ Dynamic Hydro Trigger ]
       NASA SRTM DEM (`.hgt`)         Random Forest Classifier       Open-Meteo Weather API
       Slope, Aspect, Elevation       Trained on 510 Ground Points   Live 24h Rainfall Nowcast
                 │                              │                              │
                 └──────────────────────────────┼──────────────────────────────┘
                                                ▼
                                [ Dynamic Risk Synthesis Engine ]
                   Final Risk = min(P(Terrain) * 100 + (Rainfall / 300) * 20, 100)
                                                │
                                                ▼
                               ┌─────────────────────────────────┐
                               │   Emergency Command Dashboard   │
                               │   Next.js 16 + MapLibre GL 3D   │
                               │  Live Feed, Sensors & Analytics │
                               └─────────────────────────────────┘
```

### Core Value Deliverables:
1. **Point-Level Risk Inference:** Click any mountain slope on the map or input GPS coordinates to extract DEM elevation, calculate slope gradient ($\Delta z / 60$) and aspect, and feed features into our trained Random Forest model.
2. **Dynamic Meteorological Boost:** Combines static terrain vulnerability with real-time antecedent rainfall to escalate risk from Baseline to Critical.
3. **Resilient Field Crowdsourcing:** Village volunteers and engineers can log tension cracks, ground seepage, rockfalls, and upload geo-tagged photos even when mobile data is dead. Reports auto-sync upon reconnection.
4. **Actionable Command Center:** Aggregates live alerts, infrastructure vulnerability statuses (bridges, hospitals, NH-10 sectors), sensor streams, and notification logs.

---

## 4. 🔍 Honest Scope & Truth Table (What Is Real vs Simulated)

| Capability | Status | Implementation Detail |
|:---|:---|:---|
| **Terrain Risk at any Point** | **Real** | Direct 1-arc-second NASA SRTM DEM (`N27E088.hgt`) raster sampling + Scikit-Learn Random Forest |
| **Historical Landslide Inventory** | **Real** | Verified Sikkim landslide shapefiles converted to GeoJSON (255 slides + 255 non-slide control points) |
| **Live Rainfall & Weather** | **Real** | Automated live fetching from Open-Meteo Forecast API with local 5-min caching |
| **GIS Command Dashboard** | **Real** | Next.js 16, MapLibre GL, Recharts, dark-mode geospatial styling |
| **Field Reports CRUD & Media** | **Real** | SQLite (WAL mode) database + local file storage upload pipeline |
| **Offline Incident Reporting** | **Real** | Client-side IndexedDB (Dexie.js) background queue + `/api/reports/bulk-sync` |
| **Multilingual Regional UI** | **Real** | Full i18n catalogs for English, Hindi, Nepali, Assamese, and Bengali |
| **Real-Time WebSocket Feed** | **Real** | FastAPI WebSocket server (`/ws/alerts`) with live broadcast upon report submission |
| **IoT Sensor Monitoring** | **Simulated** | 15 named telemetry stations across Sikkim with realistic synthetic sensor variation |
| **30-Day Predictive Trend** | **Simulated** | Seasonal statistical distribution modeling monsoon peaks |
| **SMS/Email Carrier Gateway** | **Logged Locally** | Transactional notification dispatcher writes to `notification_log` database table |

---

## 5. ⚠️ Current Gaps & Where the Project Lacks

To be technically honest and visionary, here are the real limitations of the prototype today:

1. **Feature Set Depth (5 Features):**
   - *Current:* Longitude, latitude, elevation, slope, and aspect.
   - *Missing:* Geological lithology (rock type), soil thickness/type, distance to faults/thrust lines (e.g., Main Boundary Thrust), Land Use / Land Cover (LULC), and road cut proximity.
2. **Heuristic Rainfall Integration:**
   - *Current:* Rainfall is applied as an additive heuristic rule ($+20\%$ max) over baseline probability.
   - *Limitation:* It is not an end-to-end trained spatio-temporal hydrological model. It does not calculate transient groundwater pore pressure or soil moisture saturation curves.
3. **Spatial Autocorrelation in ML:**
   - *Current:* Random Forest includes Lat/Lon coordinates and uses a stratified 80/20 train-test split.
   - *Limitation:* Coordinates can lead to spatial memorization. A production-grade validation requires Spatial Block Cross-Validation across distinct geological watersheds.
4. **Vector Map Tile Offline Limitations:**
   - *Current:* Field report form and app shell work offline via PWA/Dexie, but the full 3D MapLibre map still requires pre-cached vector tiles or internet access to fetch basemap tiles.
5. **No Active Hardware Mesh:**
   - *Current:* Sensor telemetry is simulated in software; no physical LoRaWAN / ESP32 hardware bridge is currently plugged in.

---

## 6. 🚀 Next-Gen Roadmap: What Will Make HillGuard Truly Revolutionary

Here is the strategic blueprint to elevate HillGuard AI from a hackathon prototype into a multi-million-dollar defense & state disaster standard:

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                           THE HILLGUARD EVOLUTION                            │
├──────────────────────────────────────────────────────────────────────────────┤
│  Phase 1: InSAR Satellite Creep Detection (ESA Sentinel-1 SAR Interferometry)│
│  Phase 2: Physics-Informed Neural Networks (PINNs + Soil Seepage Equations)  │
│  Phase 3: Off-Grid LoRaWAN Mesh Network for Hill Villages                    │
│  Phase 4: AI Drone Photogrammetry & Surface Fissure Detection                │
│  Phase 5: National CAP & WhatsApp Bot Community Alert Dispatch               │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 1. InSAR Satellite Millimeter-Level Pre-Failure Detection
- **What:** Ingest Copernicus Sentinel-1 Synthetic Aperture Radar (SAR) imagery to run Differential InSAR (DInSAR).
- **Why it matters:** Landslides do not happen spontaneously—slopes creep and deform by millimeters weeks before catastrophic collapse. InSAR provides early slope velocity vectors from space before visible cracks appear.

### 2. Physics-Informed ML (PIML / Hydrological Coupling)
- **What:** Couple scikit-learn/XGBoost models with classical geotechnical models (e.g., **TRIGRS** — Transient Rainfall Infiltration and Grid-Based Regional Slope-Stability Analysis) or Factor of Safety ($FS$) infinite slope equations.
- **Why it matters:** Eliminates heuristic guesswork by calculating exact real-time pore water pressure vs. shear strength of Himalayan soils.

### 3. Off-Grid LoRaWAN Mesh Networking for Isolated Valleys
- **What:** Deploy $15 battery/solar-powered LoRa nodes (ESP32 + Semtech SX1262) along critical sectors like NH-10 that communicate hop-by-hop without cellular towers, pushing alerts to pocket village pagers and relaying field SOS signals.

### 4. Drone Photogrammetry & Edge CV Fissure Analysis
- **What:** Enable disaster teams to fly standard consumer drones (DJI/Autel) over suspected ridges, stitch 3D point clouds on-device, and use Computer Vision to automatically highlight newly formed tension cracks and slope bulging.

### 5. Automated Resilient Evacuation Route Optimization
- **What:** Integrate live OpenStreetMap road network graph routing (using Dijkstra / A* with hazard weight penalties).
- **Why it matters:** If NH-10 is blocked at Singtam, the system automatically computes safe alternative bypass corridors through secondary mountain ridges for emergency ambulances and supply convoys.

---

## 7. 🛠️ Tech Stack & Architecture

| Layer | Technologies Used |
|:---|:---|
| **Frontend Framework** | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4 |
| **Geospatial & Visuals** | MapLibre GL 3D, Recharts, Lucide Icons |
| **Offline Persistence** | Dexie.js (IndexedDB wrapper), Progressive Web App (PWA) Service Workers |
| **Backend REST & WS** | FastAPI (Python 3.10+), Uvicorn ASGI, WebSockets |
| **Machine Learning** | Scikit-Learn (Random Forest Classifier), Joblib, NumPy |
| **Geospatial Data Processing** | Rasterio (SRTM HGT sampling), GeoPandas, Shapely |
| **Database** | SQLite with Write-Ahead Logging (WAL mode), expandable to PostGIS |
| **Weather Ingestion** | Open-Meteo Global Forecasting API |

---

## 8. 💻 Quick Start & Installation

### Prerequisites
- Python 3.10+
- Node.js 18+

### Step 1: Clone and Set Up Backend
```bash
git clone https://github.com/your-username/hillguard-ai.git
cd hillguard-ai

# Install Python dependencies
pip install -r requirements.txt

# Launch FastAPI backend on port 8000
uvicorn src.api.main:app --reload --host 0.0.0.0 --port 8000
```

### Step 2: Set Up & Launch Frontend
```bash
# In a new terminal window:
cd frontend
npm install
npm run dev
```

Open **[http://localhost:3000](http://localhost:3000)** in your browser.

### Step 3: Run Alternate Streamlit Prototype (Optional)
```bash
streamlit run app.py
```
Open **[http://localhost:8501](http://localhost:8501)** for the standalone data exploration & PDF generation prototype.

---

## 9. ⚖️ Ethical, Data & Attribution Notes
- **NASA SRTM**: Digital Elevation Models are derived from NASA SRTM 30m global radar topography.
- **Geological Inventory**: Historical landslide points are adapted from Geological Survey of India (GSI) public disaster inventory shapefiles for Sikkim.
- **Open-Meteo**: Weather forecasts and precipitation rates provided under open meteorological data licenses.

---

*Developed with passion for mountain safety, disaster resilience, and Himalayan infrastructure defense.*

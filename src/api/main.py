from fastapi import FastAPI, HTTPException, Query, UploadFile, File, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import joblib
import rasterio
import numpy as np
import requests
import math
import json
import os
import uuid
import asyncio
from datetime import datetime, timedelta
from typing import Optional
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))
from backend import database as db

app = FastAPI(title="HillGuard AI Command API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = os.environ.get("UPLOAD_DIR", os.path.join(os.path.dirname(__file__), "..", "..", "uploads"))
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Serve uploaded field-report photos
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

model = joblib.load("src/models/random_forest_sikkim.joblib")
dem_path = "data/terrain/N27E088.hgt"

weather_cache = {"data": None, "timestamp": 0}

# --- WebSocket connection manager ---
class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                pass

manager = ConnectionManager()

# --- Pydantic models ---
class PointRequest(BaseModel):
    latitude: float
    longitude: float
    simulated_rain: float = -1.0

class ReportRequest(BaseModel):
    latitude: float
    longitude: float
    description: str
    severity: str = "medium"
    location_name: str = ""

class ReportUpdate(BaseModel):
    status: Optional[str] = None

class SubscriberRequest(BaseModel):
    phone: Optional[str] = None
    email: Optional[str] = None
    zone: str
    min_severity: str = "high"

class AlertRuleConfig(BaseModel):
    rules: list[dict]

class BulkSyncRequest(BaseModel):
    reports: list[dict]

# --- Helpers ---
def fetch_live_rainfall(lat: float, lon: float) -> float:
    try:
        url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&daily=rain_sum&timezone=auto"
        res = requests.get(url, timeout=4).json()
        return float(res['daily']['rain_sum'][0])
    except Exception:
        return 0.0

def risk_level_from_score(score: float) -> str:
    if score >= 80:
        return "CRITICAL"
    elif score >= 60:
        return "HIGH"
    elif score >= 40:
        return "MODERATE"
    return "LOW"

# --- Location data ---
SIKKIM_LOCATIONS = [
    {"name": "Gangtok", "lat": 27.3389, "lng": 88.6065},
    {"name": "Namchi", "lat": 27.1769, "lng": 88.3639},
    {"name": "Gyalshing", "lat": 27.3372, "lng": 88.2639},
    {"name": "Rangpo", "lat": 27.2216, "lng": 88.5357},
    {"name": "Jorethang", "lat": 27.0971, "lng": 88.3224},
    {"name": "Mangan", "lat": 27.5074, "lng": 88.5639},
    {"name": "Pelling", "lat": 27.3005, "lng": 88.2444},
    {"name": "Lachung", "lat": 27.6903, "lng": 88.7468},
    {"name": "Ravangla", "lat": 27.2972, "lng": 88.3633},
    {"name": "Zuluk", "lat": 27.3461, "lng": 88.7438},
    {"name": "Singtam", "lat": 27.2223, "lng": 88.4972},
    {"name": "Nayabazar", "lat": 27.1825, "lng": 88.3889},
    {"name": "Dentam", "lat": 27.1533, "lng": 88.1967},
    {"name": "Yuksom", "lat": 27.3617, "lng": 88.2633},
    {"name": "Thangu", "lat": 27.7033, "lng": 88.6967},
]

REPORT_DESCRIPTIONS = [
    "Large boulder slide detected near the road bend. Traffic blocked.",
    "Cracks appearing on hillside above residential area. Multiple families affected.",
    "Mud flow observed blocking NH10 near 12th Mile. Vehicles stuck.",
    "Heavy debris on trekking trail to Tsomgo Lake. Tourists stranded.",
    "Water seepage increasing on retaining wall near school.",
    "Road subsidence reported near Rangpo bridge approach.",
    "Tree fall blocking secondary road to Lachung after continuous rain.",
    "Minor rockfall near Singtam bypass. No injuries reported.",
    "Slope instability observed near new construction site in Namchi.",
    "Flash flood debris on village road near Jorethang.",
    "Landslide scar expanding near Mangan. Evacuation recommended.",
    "Sinking road section near Pelling monastery access road.",
    "Drainage blockage causing waterlogging and soil saturation in Gangtok.",
    "Debris flow from unnamed tributary blocking Teesta riverbed partially.",
    "Multiple small slides on Ravangla-Gangtok highway after 3-day rainfall.",
    "Foundation settlement visible in building near hillside in Gyalshing.",
    "Wire rope barrier damaged by recent slide near Zuluk.",
    "Agricultural land destroyed by mudslide in lower Dentam valley.",
]

SENSOR_STATIONS = [
    {"id": "SEN001", "name": "Gangtok Central", "lat": 27.3389, "lng": 88.6065},
    {"id": "SEN002", "name": "Rangpo Bridge", "lat": 27.2216, "lng": 88.5357},
    {"id": "SEN003", "name": "Mangan North", "lat": 27.5074, "lng": 88.5639},
    {"id": "SEN004", "name": "Namchi Hill", "lat": 27.1769, "lng": 88.3639},
    {"id": "SEN005", "name": "Lachung Valley", "lat": 27.6903, "lng": 88.7468},
    {"id": "SEN006", "name": "Pelling Slope", "lat": 27.3005, "lng": 88.2444},
    {"id": "SEN007", "name": "Zuluk Ridge", "lat": 27.3461, "lng": 88.7438},
    {"id": "SEN008", "name": "Singtam Bypass", "lat": 27.2223, "lng": 88.4972},
    {"id": "SEN009", "name": "Jorethang Low", "lat": 27.0971, "lng": 88.3224},
    {"id": "SEN010", "name": "Ravangla Altitude", "lat": 27.2972, "lng": 88.3633},
    {"id": "SEN011", "name": "Yuksom Base", "lat": 27.3617, "lng": 88.2633},
    {"id": "SEN012", "name": "Thangu Outpost", "lat": 27.7033, "lng": 88.6967},
    {"id": "SEN013", "name": "Gyalshing West", "lat": 27.3372, "lng": 88.2639},
    {"id": "SEN014", "name": "Nayabazar Gate", "lat": 27.1825, "lng": 88.3889},
    {"id": "SEN015", "name": "Dentam Valley", "lat": 27.1533, "lng": 88.1967},
]

INFRASTRUCTURE = [
    {"name": "NH-10 Gangtok-Rangpo Section", "type": "road", "lat": 27.2800, "lng": 88.5200, "status": "open", "risk_level": "HIGH"},
    {"name": "Rangpo Bridge", "type": "bridge", "lat": 27.2216, "lng": 88.5357, "status": "open", "risk_level": "HIGH"},
    {"name": "Teesta Bridge near Singtam", "type": "bridge", "lat": 27.2300, "lng": 88.5000, "status": "damaged", "risk_level": "CRITICAL"},
    {"name": "Gangtok General Hospital", "type": "hospital", "lat": 27.3350, "lng": 88.6080, "status": "open", "risk_level": "LOW"},
    {"name": "Namchi District Hospital", "type": "hospital", "lat": 27.1780, "lng": 88.3620, "status": "open", "risk_level": "MODERATE"},
    {"name": "Gyalshing PHC", "type": "hospital", "lat": 27.3360, "lng": 88.2650, "status": "open", "risk_level": "MODERATE"},
    {"name": "Mangan Government School", "type": "school", "lat": 27.5060, "lng": 88.5650, "status": "closed", "risk_level": "HIGH"},
    {"name": "Pelling Primary School", "type": "school", "lat": 27.3010, "lng": 88.2450, "status": "open", "risk_level": "LOW"},
    {"name": "Lachung Monastery Road", "type": "road", "lat": 27.6900, "lng": 88.7470, "status": "closed", "risk_level": "CRITICAL"},
    {"name": "Ravangla-Gangtok Highway", "type": "road", "lat": 27.3000, "lng": 88.4000, "status": "open", "risk_level": "MODERATE"},
    {"name": "Jorethang Local Bridge", "type": "bridge", "lat": 27.0980, "lng": 88.3230, "status": "damaged", "risk_level": "HIGH"},
    {"name": "Zuluk Army Road", "type": "road", "lat": 27.3470, "lng": 88.7440, "status": "closed", "risk_level": "CRITICAL"},
    {"name": "Singtam Community Health Centre", "type": "hospital", "lat": 27.2230, "lng": 88.4980, "status": "open", "risk_level": "MODERATE"},
    {"name": "Yuksom Heritage Trail", "type": "road", "lat": 27.3620, "lng": 88.2640, "status": "open", "risk_level": "MODERATE"},
    {"name": "Dentam Secondary School", "type": "school", "lat": 27.1540, "lng": 88.1970, "status": "open", "risk_level": "HIGH"},
]

def _seed_database():
    existing_reports = db.get_reports()
    if existing_reports:
        return
    for i, desc in enumerate(REPORT_DESCRIPTIONS):
        loc = SIKKIM_LOCATIONS[i % len(SIKKIM_LOCATIONS)]
        severity = ["low", "medium", "high", "critical"][i % 4]
        status = ["open", "investigating", "resolved"][i % 3]
        ts = (datetime.utcnow() - timedelta(hours=i * 3, minutes=i * 17)).isoformat() + "Z"
        report = {
            "id": f"RPT-{i+1:04d}",
            "lat": loc["lat"],
            "lng": loc["lng"],
            "description": desc,
            "severity": severity,
            "status": status,
            "location_name": loc["name"],
            "created_at": ts,
            "updated_at": ts,
            "synced": 1,
            "image_url": None,
        }
        db.insert_report(report)

    alert_messages = [
        "Extremely high landslide probability. Evacuate immediately.",
        "Slope failure imminent. Road closure advised.",
        "Soil saturation critical. Residents should move to higher ground.",
        "Active debris flow detected. Avoid low-lying areas.",
        "Retaining structure under stress. Engineering team dispatched.",
        "Flash flood risk elevated. Clear drainage channels.",
        "Ground deformation accelerating. Monitor and prepare evacuation.",
        "Heavy rainfall forecast with high instability. Stay alert.",
        "Multiple slope failures likely in next 6 hours.",
        "Bridge foundation undermined by erosion. Structural inspection needed.",
    ]
    for i in range(10):
        loc = SIKKIM_LOCATIONS[i % len(SIKKIM_LOCATIONS)]
        score = float(np.random.uniform(65, 98))
        severity = risk_level_from_score(score)
        ts = (datetime.utcnow() - timedelta(hours=i * 2)).isoformat() + "Z"
        alert = {
            "id": f"ALT-{uuid.uuid4().hex[:8].upper()}",
            "zone_name": loc["name"],
            "severity": severity,
            "message": alert_messages[i],
            "risk_score": round(score, 1),
            "created_at": ts,
            "active": 1,
            "notified_sms": 0,
            "notified_push": 0,
        }
        db.insert_alert(alert)

_seed_database()

# ============================================================
# TERRAIN EVALUATION
# ============================================================

@app.post("/api/evaluate")
def evaluate_terrain(req: PointRequest):
    try:
        with rasterio.open(dem_path) as src:
            dem_data = src.read(1).astype(float)
            r, c = src.index(req.longitude, req.latitude)
            r = np.clip(r, 1, dem_data.shape[0] - 2)
            c = np.clip(c, 1, dem_data.shape[1] - 2)

            elev = float(dem_data[r, c])
            dy = (dem_data[r+1, c] - dem_data[r-1, c]) / 60.0
            dx = (dem_data[r, c+1] - dem_data[r, c-1]) / 60.0
            slope = float(math.degrees(math.atan(math.sqrt(dx**2 + dy**2))))
            aspect = float(math.degrees(math.atan2(-dy, dx))) % 360.0

            curv_y = float(dem_data[r+1, c] + dem_data[r-1, c] - 2 * elev) / 3600.0
            curv_x = float(dem_data[r, c+1] + dem_data[r, c-1] - 2 * elev) / 3600.0
            curvature = curv_x + curv_y

            twi = float(math.log(max(1.0, abs(elev) / max(0.01, slope + 0.01))))

            neighbors = []
            for dr in [-1, 0, 1]:
                for dc in [-1, 0, 1]:
                    if dr == 0 and dc == 0:
                        continue
                    neighbors.append(float(dem_data[r+dr, c+dc]))
            roughness = float(np.std(neighbors))

        feats = np.array([[req.longitude, req.latitude, elev, slope, aspect]])
        base_prob = float(model.predict_proba(feats)[0][1]) * 100.0

        active_rain = req.simulated_rain if req.simulated_rain >= 0 else fetch_live_rainfall(req.latitude, req.longitude)
        rain_boost = (active_rain / 300.0) * 20.0
        final_risk = min(base_prob + rain_boost, 100.0)

        return {
            "risk_score": round(final_risk, 1),
            "risk_level": risk_level_from_score(final_risk),
            "base_probability": round(base_prob, 1),
            "rain_factor": round(rain_boost, 1),
            "terrain": {
                "elevation_m": round(elev, 0),
                "slope_deg": round(slope, 1),
                "aspect_deg": round(aspect, 1),
                "curvature": round(curvature, 4),
                "roughness": round(roughness, 2),
                "twi": round(twi, 2),
                "active_rainfall_mm": round(active_rain, 1),
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================
# MAP DATA
# ============================================================

@app.get("/api/map-data")
def get_map_data():
    danger_zones = []
    geojson_path = "data/landslides/sikkim/sikkim_landslides_features.geojson"
    if os.path.exists(geojson_path):
        try:
            with open(geojson_path, "r") as f:
                data = json.load(f)
                for feature in data.get("features", []):
                    geometry = feature.get("geometry", {})
                    if geometry.get("type") == "Point":
                        coords = geometry.get("coordinates")
                        if coords and len(coords) >= 2:
                            danger_zones.append({"lng": coords[0], "lat": coords[1]})
        except Exception:
            pass
    reports = db.get_reports()
    live_reports = []
    for r in reports:
        live_reports.append({
            "id": r["id"],
            "lat": r["lat"],
            "lng": r["lng"],
            "description": r["description"],
            "severity": r["severity"],
            "status": r["status"],
            "created_at": r["created_at"],
            "location_name": r.get("location_name", ""),
        })
    return {"danger_zones": danger_zones, "live_reports": live_reports}

# ============================================================
# REPORTS
# ============================================================

@app.post("/api/report")
def add_report(req: ReportRequest):
    now = datetime.utcnow().isoformat() + "Z"
    report_id = f"RPT-{uuid.uuid4().hex[:8].upper()}"
    location_name = req.location_name
    if not location_name:
        for loc in SIKKIM_LOCATIONS:
            if abs(loc["lat"] - req.latitude) < 0.05 and abs(loc["lng"] - req.longitude) < 0.05:
                location_name = loc["name"]
                break
    report = {
        "id": report_id,
        "lat": req.latitude,
        "lng": req.longitude,
        "description": req.description,
        "severity": req.severity,
        "status": "open",
        "location_name": location_name,
        "created_at": now,
        "updated_at": now,
        "synced": 1,
        "image_url": None,
    }
    db.insert_report(report)
    asyncio.get_event_loop().create_task(manager.broadcast({
        "type": "new_report",
        "report": report,
    }))
    return {"status": "success", "report": report}

@app.post("/api/reports/bulk-sync")
def bulk_sync_reports(body: BulkSyncRequest):
    synced = 0
    failed = 0
    for r in body.reports:
        try:
            now = datetime.utcnow().isoformat() + "Z"
            report = {
                "id": r.get("id", f"RPT-{uuid.uuid4().hex[:8].upper()}"),
                "lat": r["latitude"],
                "lng": r["longitude"],
                "description": r["description"],
                "severity": r.get("severity", "medium"),
                "status": "open",
                "location_name": r.get("location_name", ""),
                "created_at": r.get("created_at", now),
                "updated_at": now,
                "synced": 1,
                "image_url": r.get("image_url"),
            }
            db.insert_report(report)
            synced += 1
        except Exception:
            failed += 1
    return {"synced": synced, "failed": failed}

@app.get("/api/reports")
def list_reports(severity: Optional[str] = Query(None), status: Optional[str] = Query(None)):
    reports = db.get_reports(severity=severity, status=status)
    result = []
    for r in reports:
        result.append({
            "id": r["id"],
            "lat": r["lat"],
            "lng": r["lng"],
            "description": r["description"],
            "severity": r["severity"],
            "status": r["status"],
            "created_at": r["created_at"],
            "location_name": r.get("location_name", ""),
            "synced": bool(r.get("synced", 1)),
            "image_url": r.get("image_url"),
        })
    return {"reports": result, "total": len(result)}

@app.patch("/api/reports/{report_id}")
def update_report(report_id: str, body: ReportUpdate):
    if body.status:
        result = db.update_report_status(report_id, body.status)
        if result:
            return {"status": "success", "report": result}
    raise HTTPException(status_code=404, detail="Report not found")

@app.post("/api/reports/{report_id}/upload")
async def upload_report_image(report_id: str, file: UploadFile = File(...)):
    ext = os.path.splitext(file.filename)[1] if file.filename else ".jpg"
    filename = f"{report_id}{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    content = await file.read()
    with open(filepath, "wb") as f:
        f.write(content)
    image_url = f"/uploads/{filename}"
    conn = db.get_conn()
    conn.execute("UPDATE reports SET image_url=? WHERE id=?", (image_url, report_id))
    conn.commit()
    conn.close()
    return {"status": "success", "image_url": image_url}

# ============================================================
# DASHBOARD
# ============================================================

@app.get("/api/dashboard/stats")
def dashboard_stats():
    alerts = db.get_alerts(active_only=True)
    critical = sum(1 for a in alerts if a["severity"] == "CRITICAL")
    high = sum(1 for a in alerts if a["severity"] == "HIGH")

    reports = db.get_reports()
    active_reports = sum(1 for r in reports if r["status"] in ("open", "investigating"))
    closed_roads = sum(1 for i in INFRASTRUCTURE if i["type"] in ("road", "bridge") and i["status"] != "open")
    online_sensors = sum(1 for s in SENSOR_STATIONS if np.random.random() > 0.15)

    return {
        "critical_zones": critical,
        "high_risk_zones": high,
        "active_reports": active_reports,
        "affected_roads": closed_roads,
        "sensors_online": online_sensors,
        "alerts_active": len(alerts),
    }

@app.get("/api/dashboard/risk-summary")
def risk_summary():
    alerts = db.get_alerts(active_only=True)
    scores = [a["risk_score"] for a in alerts]
    avg_score = float(np.mean(scores)) if scores else 35.0

    current_rainfall = fetch_live_rainfall(27.35, 88.6)
    soil_moisture = min(90.0, 45.0 + current_rainfall * 0.3 + np.random.uniform(-5, 5))
    confidence = max(60.0, min(95.0, 80.0 - abs(avg_score - 50) * 0.2 + np.random.uniform(-3, 3)))

    factors = ["elevation", "slope", "rainfall", "soil_moisture", "historical_landslides"]
    if current_rainfall > 50:
        factors.append("heavy_rainfall_alert")
    if soil_moisture > 70:
        factors.append("high_saturation")

    return {
        "overall_risk_score": round(avg_score, 1),
        "risk_level": risk_level_from_score(avg_score),
        "confidence": round(confidence, 1),
        "current_rainfall": round(current_rainfall, 1),
        "soil_moisture": round(soil_moisture, 1),
        "contributing_factors": factors,
    }

# ============================================================
# WEATHER
# ============================================================

@app.get("/api/weather")
def get_weather():
    now_ts = datetime.utcnow().timestamp()
    if weather_cache["data"] and (now_ts - weather_cache["timestamp"]) < 300:
        return weather_cache["data"]

    try:
        url = (
            "https://api.open-meteo.com/v1/forecast"
            "?latitude=27.35&longitude=88.6"
            "&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m"
            "&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code"
            "&timezone=Asia/Kolkata&forecast_days=7"
        )
        res = requests.get(url, timeout=8).json()

        current = res.get("current", {})
        daily = res.get("daily", {})

        weather_codes = {
            0: "Clear", 1: "Mainly Clear", 2: "Partly Cloudy", 3: "Overcast",
            45: "Foggy", 48: "Rime Fog", 51: "Light Drizzle", 53: "Moderate Drizzle",
            55: "Dense Drizzle", 61: "Light Rain", 63: "Moderate Rain", 65: "Heavy Rain",
            71: "Light Snow", 73: "Moderate Snow", 75: "Heavy Snow",
            80: "Light Showers", 81: "Moderate Showers", 82: "Violent Showers",
            95: "Thunderstorm", 96: "Thunderstorm w/ Hail", 99: "Thunderstorm w/ Heavy Hail",
        }

        forecast = []
        for i in range(min(7, len(daily.get("time", [])))):
            d = datetime.fromisoformat(daily["time"][i])
            forecast.append({
                "day": d.strftime("%a"),
                "temp_high": daily["temperature_2m_max"][i],
                "temp_low": daily["temperature_2m_min"][i],
                "rainfall": daily["precipitation_sum"][i],
                "condition": weather_codes.get(daily.get("weather_code", [0])[i] if daily.get("weather_code") else 0, "Unknown"),
            })

        wc = current.get("weather_code", 0)
        result = {
            "temperature": current.get("temperature_2m", 18.0),
            "humidity": current.get("relative_humidity_2m", 75.0),
            "rainfall_24h": daily.get("precipitation_sum", [0.0])[0] if daily.get("precipitation_sum") else 0.0,
            "wind_speed": current.get("wind_speed_10m", 5.0),
            "weather_code": wc,
            "description": weather_codes.get(wc, "Unknown"),
            "forecast": forecast,
            "updated_at": datetime.utcnow().isoformat() + "Z",
        }
    except Exception:
        result = {
            "temperature": 18.0 + np.random.uniform(-3, 3),
            "humidity": 78.0 + np.random.uniform(-10, 10),
            "rainfall_24h": 12.0 + np.random.uniform(-8, 15),
            "wind_speed": 6.0 + np.random.uniform(-2, 4),
            "weather_code": 61,
            "description": "Moderate Rain",
            "forecast": [],
            "updated_at": datetime.utcnow().isoformat() + "Z",
        }

    weather_cache["data"] = result
    weather_cache["timestamp"] = now_ts
    return result

# ============================================================
# ALERTS
# ============================================================

@app.get("/api/alerts")
def get_alerts():
    alerts = db.get_alerts()
    result = []
    for a in alerts:
        result.append({
            "id": a["id"],
            "zone_name": a["zone_name"],
            "severity": a["severity"],
            "message": a["message"],
            "risk_score": a["risk_score"],
            "created_at": a["created_at"],
            "active": bool(a["active"]),
        })
    return {"alerts": result}

@app.post("/api/alerts/{alert_id}/dismiss")
def dismiss_alert(alert_id: str):
    conn = db.get_conn()
    conn.execute("UPDATE alerts SET active=0 WHERE id=?", (alert_id,))
    conn.commit()
    conn.close()
    return {"status": "success"}

@app.post("/api/alerts/rules")
def save_alert_rules(config: AlertRuleConfig):
    config_path = os.path.join(os.path.dirname(__file__), "..", "..", "alert_rules.json")
    with open(config_path, "w") as f:
        json.dump(config.rules, f, indent=2)
    return {"status": "success", "rules": config.rules}

@app.get("/api/alerts/rules")
def get_alert_rules():
    config_path = os.path.join(os.path.dirname(__file__), "..", "..", "alert_rules.json")
    if os.path.exists(config_path):
        with open(config_path, "r") as f:
            rules = json.load(f)
        return {"rules": rules}
    return {"rules": [
        {"id": "risk-critical", "label": "Critical Risk Alert", "condition": "Risk Score > 80", "enabled": True},
        {"id": "risk-high", "label": "High Risk Alert", "condition": "Risk Score > 60", "enabled": True},
        {"id": "risk-moderate", "label": "Moderate Risk Alert", "condition": "Risk Score > 40", "enabled": True},
        {"id": "rainfall", "label": "Heavy Rainfall Warning", "condition": "Rainfall > 100mm/day", "enabled": True},
        {"id": "slope", "label": "Steep Slope Warning", "condition": "Slope > 45 degrees", "enabled": False},
    ]}

# ============================================================
# SUBSCRIBERS & NOTIFICATIONS
# ============================================================

@app.post("/api/subscribers")
def add_subscriber(req: SubscriberRequest):
    if not req.phone and not req.email:
        raise HTTPException(status_code=400, detail="Either phone or email is required")
    db.add_subscriber(phone=req.phone, email=req.email, zone=req.zone, min_severity=req.min_severity)
    return {"status": "success"}

@app.get("/api/subscribers")
def list_subscribers(zone: Optional[str] = Query(None)):
    subs = db.get_subscribers(zone=zone)
    return {"subscribers": subs, "total": len(subs)}

@app.delete("/api/subscribers/{subscriber_id}")
def remove_subscriber(subscriber_id: int):
    conn = db.get_conn()
    conn.execute("UPDATE subscribers SET active=0 WHERE id=?", (subscriber_id,))
    conn.commit()
    conn.close()
    return {"status": "success"}

@app.post("/api/notifications/send")
async def send_notification(alert_id: str, channel: str = "push"):
    alerts = db.get_alerts()
    alert = next((a for a in alerts if a["id"] == alert_id), None)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    subscribers = db.get_subscribers(zone=alert["zone_name"])
    sent_count = 0
    for sub in subscribers:
        recipient = sub.get("phone") or sub.get("email", "")
        if not recipient:
            continue
        message = f"HillGuard Alert [{alert['severity']}]: {alert['message']} - Risk Score: {alert['risk_score']}/100 in {alert['zone_name']}"
        db.log_notification(alert_id=alert_id, channel=channel, recipient=recipient, message=message, status="sent")
        sent_count += 1

    db.mark_alert_notified(alert_id, channel)
    return {"status": "success", "sent_to": sent_count}

@app.get("/api/notifications/log")
def get_notification_log(alert_id: Optional[str] = Query(None)):
    conn = db.get_conn()
    if alert_id:
        rows = conn.execute("SELECT * FROM notification_log WHERE alert_id=? ORDER BY sent_at DESC", (alert_id,)).fetchall()
    else:
        rows = conn.execute("SELECT * FROM notification_log ORDER BY sent_at DESC LIMIT 100").fetchall()
    conn.close()
    return {"notifications": [dict(r) for r in rows]}

# ============================================================
# ANALYTICS
# ============================================================

@app.get("/api/analytics/predict-grid")
def predict_grid():
    results = []
    lat_start, lat_end = 27.0, 27.8
    lon_start, lon_end = 88.1, 88.8
    step = 0.05

    try:
        with rasterio.open(dem_path) as src:
            dem_data = src.read(1).astype(float)
            lat = lat_start
            while lat <= lat_end:
                lng = lon_start
                while lng <= lon_end:
                    try:
                        r, c = src.index(lng, lat)
                        r = np.clip(r, 1, dem_data.shape[0] - 2)
                        c = np.clip(c, 1, dem_data.shape[1] - 2)

                        elev = float(dem_data[r, c])
                        dy = (dem_data[r+1, c] - dem_data[r-1, c]) / 60.0
                        dx = (dem_data[r, c+1] - dem_data[r, c-1]) / 60.0
                        slope = float(math.degrees(math.atan(math.sqrt(dx**2 + dy**2))))
                        aspect = float(math.degrees(math.atan2(-dy, dx))) % 360.0

                        feats = np.array([[lng, lat, elev, slope, aspect]])
                        prob = float(model.predict_proba(feats)[0][1]) * 100.0
                        results.append({
                            "lat": round(lat, 2),
                            "lng": round(lng, 2),
                            "risk_score": round(min(prob, 100.0), 1),
                        })
                    except Exception:
                        pass
                    lng += step
                lat += step
    except Exception:
        lat = lat_start
        while lat <= lat_end:
            lng = lon_start
            while lng <= lon_end:
                results.append({
                    "lat": round(lat, 2),
                    "lng": round(lng, 2),
                    "risk_score": round(float(np.random.uniform(10, 70)), 1),
                })
                lng += step
            lat += step

    return {"grid": results}

@app.get("/api/analytics/trend")
def analytics_trend():
    today = datetime.utcnow().date()
    trend = []
    for i in range(30, 0, -1):
        d = today - timedelta(days=i)
        rainfall = max(0, 5.0 + np.random.normal(25, 15) + (10 if 6 <= d.month <= 9 else -10))
        base_risk = 30 + rainfall * 0.6 + np.random.normal(0, 8)
        avg_risk = round(max(10, min(95, base_risk)), 1)
        max_risk = round(min(100, avg_risk + np.random.uniform(5, 20)), 1)
        trend.append({
            "date": d.isoformat(),
            "avg_risk": avg_risk,
            "max_risk": max_risk,
            "rainfall": round(rainfall, 1),
        })
    return {"trend": trend}

# ============================================================
# SENSOR DATA
# ============================================================

@app.get("/api/sensor-data")
def sensor_data():
    now = datetime.utcnow()
    stations = []
    for s in SENSOR_STATIONS:
        is_online = np.random.random() > 0.12
        temp = round(float(np.random.uniform(10, 28)), 1)
        moisture = round(float(np.random.uniform(20, 85)), 1)
        rain = round(float(max(0, np.random.normal(8, 12))), 1)
        vibration = round(float(max(0, np.random.normal(0.5, 0.8))), 3)
        reading = {
            "id": s["id"],
            "name": s["name"],
            "lat": s["lat"],
            "lng": s["lng"],
            "temperature": temp,
            "soil_moisture": moisture,
            "rainfall_rate": rain,
            "vibration_level": vibration,
            "status": "online" if is_online else "offline",
            "last_reading": (now - timedelta(seconds=np.random.randint(5, 600))).isoformat() + "Z",
        }
        stations.append(reading)
        if is_online:
            try:
                db.insert_sensor_reading({
                    "station_id": s["id"],
                    "temperature": temp,
                    "soil_moisture": moisture,
                    "rainfall_rate": rain,
                    "vibration_level": vibration,
                    "recorded_at": now.isoformat() + "Z",
                })
            except Exception:
                pass
    return {"stations": stations}

@app.get("/api/sensor-data/{station_id}/history")
def sensor_history(station_id: str, hours: int = 24):
    readings = db.get_sensor_history(station_id, hours)
    return {"readings": readings}

# ============================================================
# INFRASTRUCTURE
# ============================================================

@app.get("/api/infrastructure")
def infrastructure():
    return {"infrastructure": INFRASTRUCTURE}

# ============================================================
# SATELLITE DATA
# ============================================================

@app.get("/api/satellite/passes")
def get_satellite_passes(limit: int = 20):
    passes = db.get_satellite_passes(limit)
    return {"passes": passes}

@app.post("/api/satellite/passes")
def add_satellite_pass(data: dict):
    now = datetime.utcnow().isoformat() + "Z"
    db.insert_satellite_pass({
        "satellite": data.get("satellite", "unknown"),
        "pass_time": data.get("pass_time", now),
        "cloud_cover": data.get("cloud_cover"),
        "ndvi_json": json.dumps(data.get("ndvi", {})) if data.get("ndvi") else None,
        "region_bounds": data.get("region_bounds"),
        "created_at": now,
    })
    return {"status": "success"}

# ============================================================
# WEBSOCKET
# ============================================================

@app.websocket("/ws/alerts")
async def websocket_alerts(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_json({"type": "pong"})
    except WebSocketDisconnect:
        manager.disconnect(websocket)

# ============================================================
# HEALTH CHECK
# ============================================================

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "version": "2.0.0",
        "model_loaded": model is not None,
        "dem_available": os.path.exists(dem_path),
        "database": "sqlite",
        "timestamp": datetime.utcnow().isoformat() + "Z",
    }

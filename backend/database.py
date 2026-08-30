"""Database layer — SQLite with sync interface for reports, alerts, sensors, satellite, subscribers."""

import sqlite3
import os
from datetime import datetime
from typing import Optional

DB_PATH = os.environ.get("HILLGUARD_DB", os.path.join(os.path.dirname(__file__), "..", "hillguard.db"))


def get_conn() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


def init_db():
    conn = get_conn()
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS reports (
            id TEXT PRIMARY KEY,
            lat REAL NOT NULL,
            lng REAL NOT NULL,
            description TEXT NOT NULL,
            severity TEXT NOT NULL DEFAULT 'medium',
            status TEXT NOT NULL DEFAULT 'open',
            location_name TEXT DEFAULT '',
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            synced INTEGER DEFAULT 1,
            image_url TEXT
        );
        CREATE TABLE IF NOT EXISTS alerts (
            id TEXT PRIMARY KEY,
            zone_name TEXT NOT NULL,
            severity TEXT NOT NULL,
            message TEXT NOT NULL,
            risk_score REAL NOT NULL,
            created_at TEXT NOT NULL,
            active INTEGER DEFAULT 1,
            notified_sms INTEGER DEFAULT 0,
            notified_push INTEGER DEFAULT 0
        );
        CREATE TABLE IF NOT EXISTS sensor_readings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            station_id TEXT NOT NULL,
            temperature REAL,
            soil_moisture REAL,
            rainfall_rate REAL,
            vibration_level REAL,
            recorded_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS satellite_passes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            satellite TEXT NOT NULL,
            pass_time TEXT NOT NULL,
            cloud_cover REAL,
            ndvi_json TEXT,
            region_bounds TEXT,
            created_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS subscribers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            phone TEXT,
            email TEXT,
            zone TEXT NOT NULL,
            min_severity TEXT DEFAULT 'high',
            active INTEGER DEFAULT 1,
            created_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS notification_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            alert_id TEXT,
            channel TEXT NOT NULL,
            recipient TEXT NOT NULL,
            message TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending',
            sent_at TEXT
        );
        CREATE INDEX IF NOT EXISTS idx_reports_severity ON reports(severity);
        CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
        CREATE INDEX IF NOT EXISTS idx_alerts_active ON alerts(active);
        CREATE INDEX IF NOT EXISTS idx_sensor_station ON sensor_readings(station_id);
        CREATE INDEX IF NOT EXISTS idx_subscribers_zone ON subscribers(zone);
    """)
    conn.commit()
    conn.close()


def insert_report(report: dict):
    conn = get_conn()
    conn.execute(
        """INSERT OR REPLACE INTO reports
           (id, lat, lng, description, severity, status, location_name, created_at, updated_at, synced, image_url)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        (report["id"], report["lat"], report["lng"], report["description"],
         report["severity"], report.get("status", "open"),
         report.get("location_name", ""), report["created_at"],
         report["updated_at"], report.get("synced", 1), report.get("image_url")),
    )
    conn.commit()
    conn.close()


def get_reports(severity: Optional[str] = None, status: Optional[str] = None) -> list[dict]:
    conn = get_conn()
    query = "SELECT * FROM reports"
    params: list = []
    conds = []
    if severity:
        conds.append("severity = ?")
        params.append(severity)
    if status:
        conds.append("status = ?")
        params.append(status)
    if conds:
        query += " WHERE " + " AND ".join(conds)
    query += " ORDER BY created_at DESC"
    rows = conn.execute(query, params).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def update_report_status(report_id: str, status: str) -> Optional[dict]:
    conn = get_conn()
    now = datetime.utcnow().isoformat() + "Z"
    conn.execute("UPDATE reports SET status=?, updated_at=? WHERE id=?", (status, now, report_id))
    conn.commit()
    row = conn.execute("SELECT * FROM reports WHERE id=?", (report_id,)).fetchone()
    conn.close()
    return dict(row) if row else None


def get_unsynced_reports() -> list[dict]:
    conn = get_conn()
    rows = conn.execute("SELECT * FROM reports WHERE synced=0").fetchall()
    conn.close()
    return [dict(r) for r in rows]


def mark_report_synced(report_id: str):
    conn = get_conn()
    conn.execute("UPDATE reports SET synced=1 WHERE id=?", (report_id,))
    conn.commit()
    conn.close()


def insert_alert(alert: dict):
    conn = get_conn()
    conn.execute(
        """INSERT OR REPLACE INTO alerts
           (id, zone_name, severity, message, risk_score, created_at, active, notified_sms, notified_push)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        (alert["id"], alert["zone_name"], alert["severity"], alert["message"],
         alert["risk_score"], alert["created_at"],
         alert.get("active", 1), alert.get("notified_sms", 0),
         alert.get("notified_push", 0)),
    )
    conn.commit()
    conn.close()


def get_alerts(active_only: bool = False) -> list[dict]:
    conn = get_conn()
    q = "SELECT * FROM alerts"
    if active_only:
        q += " WHERE active=1"
    q += " ORDER BY created_at DESC"
    rows = conn.execute(q).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def mark_alert_notified(alert_id: str, channel: str):
    conn = get_conn()
    col = f"notified_{channel}"
    conn.execute(f"UPDATE alerts SET {col}=1 WHERE id=?", (alert_id,))
    conn.commit()
    conn.close()


def insert_sensor_reading(reading: dict):
    conn = get_conn()
    conn.execute(
        """INSERT INTO sensor_readings (station_id, temperature, soil_moisture, rainfall_rate, vibration_level, recorded_at)
           VALUES (?, ?, ?, ?, ?, ?)""",
        (reading["station_id"], reading.get("temperature"), reading.get("soil_moisture"),
         reading.get("rainfall_rate"), reading.get("vibration_level"), reading["recorded_at"]),
    )
    conn.commit()
    conn.close()


def get_sensor_history(station_id: str, hours: int = 24) -> list[dict]:
    conn = get_conn()
    rows = conn.execute(
        "SELECT * FROM sensor_readings WHERE station_id=? AND recorded_at>=datetime('now', ?) ORDER BY recorded_at DESC",
        (station_id, f"-{hours} hours"),
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def insert_satellite_pass(data: dict):
    conn = get_conn()
    conn.execute(
        """INSERT INTO satellite_passes (satellite, pass_time, cloud_cover, ndvi_json, region_bounds, created_at)
           VALUES (?, ?, ?, ?, ?, ?)""",
        (data["satellite"], data["pass_time"], data.get("cloud_cover"),
         data.get("ndvi_json"), data.get("region_bounds"), data["created_at"]),
    )
    conn.commit()
    conn.close()


def get_satellite_passes(limit: int = 20) -> list[dict]:
    conn = get_conn()
    rows = conn.execute(
        "SELECT * FROM satellite_passes ORDER BY pass_time DESC LIMIT ?", (limit,)
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def add_subscriber(phone: Optional[str], email: Optional[str], zone: str, min_severity: str = "high"):
    conn = get_conn()
    now = datetime.utcnow().isoformat() + "Z"
    conn.execute(
        "INSERT INTO subscribers (phone, email, zone, min_severity, active, created_at) VALUES (?, ?, ?, ?, 1, ?)",
        (phone, email, zone, min_severity, now),
    )
    conn.commit()
    conn.close()


def get_subscribers(zone: Optional[str] = None) -> list[dict]:
    conn = get_conn()
    if zone:
        rows = conn.execute(
            "SELECT * FROM subscribers WHERE active=1 AND zone IN (?, 'ALL')", (zone,)
        ).fetchall()
    else:
        rows = conn.execute("SELECT * FROM subscribers WHERE active=1").fetchall()
    conn.close()
    return [dict(r) for r in rows]


def log_notification(alert_id: str, channel: str, recipient: str, message: str, status: str = "sent"):
    conn = get_conn()
    now = datetime.utcnow().isoformat() + "Z"
    conn.execute(
        "INSERT INTO notification_log (alert_id, channel, recipient, message, status, sent_at) VALUES (?, ?, ?, ?, ?, ?)",
        (alert_id, channel, recipient, message, status, now),
    )
    conn.commit()
    conn.close()


init_db()

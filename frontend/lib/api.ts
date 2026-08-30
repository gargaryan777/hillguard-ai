const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface DashboardStats {
  critical_zones: number;
  high_risk_zones: number;
  active_reports: number;
  sensors_online: number;
  alerts_active: number;
  infrastructure_affected: number;
}

export interface ContributingFactor {
  factor: string;
  value: number;
  color: string;
}

export interface RiskSummary {
  risk_score: number;
  risk_level: string;
  confidence: number;
  current_rainfall: number;
  soil_moisture: number;
  contributing_factors: ContributingFactor[];
}

export interface Weather {
  temperature: number;
  humidity: number;
  rainfall_24h: number;
  wind_speed: number;
  weather_code: number;
  description: string;
  forecast: WeatherForecast[];
  updated_at: string;
}

export interface WeatherForecast {
  day: string;
  temp_high: number;
  temp_low: number;
  condition: string;
  rainfall: number;
}

export interface Alert {
  id: string;
  zone_name: string;
  severity: string;
  risk_score: number;
  message: string;
  created_at: string;
  active: boolean;
}

export interface Report {
  id: string;
  lat: number;
  lng: number;
  description: string;
  severity: string;
  status: string;
  created_at: string;
  location_name: string;
  synced: boolean;
  image_url?: string | null;
}

export interface MapData {
  danger_zones: MapPoint[];
  live_reports: LiveReport[];
}

export interface MapPoint {
  lng: number;
  lat: number;
}

export interface LiveReport {
  lat: number;
  lng: number;
  description: string;
  id: string;
  timestamp: string;
  severity: string;
  status: string;
}

export interface PredictGrid {
  predictions: PredictCell[];
  count: number;
}

export interface PredictCell {
  lat: number;
  lng: number;
  risk_score: number;
}

export interface TrendPoint {
  date: string;
  avg_risk: number;
  max_risk: number;
  rainfall: number;
}

export interface RiskTrend {
  trend: TrendPoint[];
}

export interface SensorData {
  id: string;
  name: string;
  lat: number;
  lng: number;
  temperature: number;
  soil_moisture: number;
  rainfall_rate: number;
  vibration_level: number;
  status: string;
  last_reading: string;
}

export interface InfrastructureItem {
  id: number;
  name: string;
  type: string;
  lat: number;
  lng: number;
  status: string;
  risk_level: string;
}

export interface TerrainEvaluation {
  risk_score: number;
  risk_level: string;
  base_probability: number;
  rain_factor: number;
  terrain: {
    elevation_m: number;
    slope_deg: number;
    aspect_deg: number;
    active_rainfall_mm: number;
  };
}

export interface Subscriber {
  id: number;
  phone?: string;
  email?: string;
  zone: string;
  min_severity: string;
  active: boolean;
  created_at: string;
}

export interface AlertRule {
  id: string;
  label: string;
  condition: string;
  enabled: boolean;
}

export interface NotificationLog {
  id: number;
  alert_id: string;
  channel: string;
  recipient: string;
  message: string;
  status: string;
  sent_at: string;
}

async function fetchAPI<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `API error ${res.status}: ${res.statusText}${body ? ` - ${body}` : ""}`
    );
  }

  return res.json() as Promise<T>;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const res = await fetchAPI<DashboardStats & { affected_roads?: number }>(
    "/api/dashboard/stats"
  );
  return {
    ...res,
    infrastructure_affected:
      res.infrastructure_affected ?? res.affected_roads ?? 0,
  };
}

export async function getRiskSummary(): Promise<RiskSummary> {
  const res = await fetchAPI<
    RiskSummary & { overall_risk_score?: number; contributing_factors?: unknown }
  >("/api/dashboard/risk-summary");
  const score = Number(res.risk_score ?? res.overall_risk_score ?? 0);
  return {
    ...res,
    risk_score: Number.isFinite(score) ? score : 0,
    contributing_factors: Array.isArray(res.contributing_factors)
      ? (res.contributing_factors as ContributingFactor[])
      : [],
  };
}

export async function getWeather(): Promise<Weather> {
  return fetchAPI<Weather>("/api/weather");
}

export async function getAlerts(): Promise<Alert[]> {
  return fetchAPI<{ alerts: Alert[] }>("/api/alerts").then((res) => res.alerts);
}

export async function dismissAlert(alertId: string): Promise<void> {
  await fetchAPI(`/api/alerts/${alertId}/dismiss`, { method: "POST" });
}

export async function getAlertRules(): Promise<AlertRule[]> {
  return fetchAPI<{ rules: AlertRule[] }>("/api/alerts/rules").then((res) => res.rules);
}

export async function saveAlertRules(rules: AlertRule[]): Promise<void> {
  await fetchAPI("/api/alerts/rules", {
    method: "POST",
    body: JSON.stringify({ rules }),
  });
}

export async function getReports(filters?: {
  severity?: string;
  status?: string;
}): Promise<Report[]> {
  const params = new URLSearchParams();
  if (filters?.severity) params.set("severity", filters.severity);
  if (filters?.status) params.set("status", filters.status);
  const qs = params.toString();
  return fetchAPI<{ reports: Report[] }>(
    `/api/reports${qs ? `?${qs}` : ""}`
  ).then((res) => res.reports);
}

export async function submitReport(data: {
  latitude: number;
  longitude: number;
  description: string;
  severity: string;
}): Promise<Report> {
  return fetchAPI<{ report: Report }>("/api/report", {
    method: "POST",
    body: JSON.stringify(data),
  }).then((res) => res.report);
}

export async function updateReportStatus(
  id: string,
  status: string
): Promise<Report> {
  return fetchAPI<{ report: Report }>(`/api/reports/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  }).then((res) => res.report);
}

export async function uploadReportImage(
  reportId: string,
  file: File
): Promise<{ image_url: string }> {
  const formData = new FormData();
  formData.append("file", file);
  const url = `${API_BASE}/api/reports/${reportId}/upload`;
  const res = await fetch(url, { method: "POST", body: formData });
  if (!res.ok) throw new Error("Upload failed");
  return res.json();
}

export async function bulkSyncReports(
  reports: Array<{
    latitude: number;
    longitude: number;
    description: string;
    severity: string;
    created_at?: string;
  }>
): Promise<{ synced: number; failed: number }> {
  return fetchAPI<{ synced: number; failed: number }>("/api/reports/bulk-sync", {
    method: "POST",
    body: JSON.stringify({ reports }),
  });
}

export async function evaluateTerrain(
  latitude: number,
  longitude: number,
  simulated_rain?: number
): Promise<TerrainEvaluation> {
  return fetchAPI<TerrainEvaluation>("/api/evaluate", {
    method: "POST",
    body: JSON.stringify({ latitude, longitude, simulated_rain }),
  });
}

export async function getMapData(): Promise<MapData> {
  return fetchAPI<MapData>("/api/map-data");
}

export async function getPredictGrid(): Promise<PredictGrid> {
  return fetchAPI<{ grid: PredictCell[] }>("/api/analytics/predict-grid").then(
    (res) => ({
      predictions: res.grid,
      count: res.grid.length,
    })
  );
}

export async function getRiskTrend(): Promise<RiskTrend> {
  return fetchAPI<{ trend: TrendPoint[] }>("/api/analytics/trend");
}

export async function getSensorData(): Promise<SensorData[]> {
  return fetchAPI<{ stations: SensorData[] }>("/api/sensor-data").then(
    (res) => res.stations
  );
}

export async function getInfrastructure(): Promise<InfrastructureItem[]> {
  return fetchAPI<{ infrastructure: InfrastructureItem[] }>(
    "/api/infrastructure"
  ).then((res) => res.infrastructure);
}

export async function getSubscribers(zone?: string): Promise<Subscriber[]> {
  const qs = zone ? `?zone=${encodeURIComponent(zone)}` : "";
  return fetchAPI<{ subscribers: Subscriber[] }>(`/api/subscribers${qs}`).then(
    (res) => res.subscribers
  );
}

export async function addSubscriber(data: {
  phone?: string;
  email?: string;
  zone: string;
  min_severity?: string;
}): Promise<void> {
  await fetchAPI("/api/subscribers", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function removeSubscriber(id: number): Promise<void> {
  await fetchAPI(`/api/subscribers/${id}`, { method: "DELETE" });
}

export async function sendNotification(
  alertId: string,
  channel: string = "push"
): Promise<{ sent_to: number }> {
  return fetchAPI<{ sent_to: number }>(
    `/api/notifications/send?alert_id=${alertId}&channel=${channel}`,
    { method: "POST" }
  );
}

export async function getNotificationLog(
  alertId?: string
): Promise<NotificationLog[]> {
  const qs = alertId ? `?alert_id=${alertId}` : "";
  return fetchAPI<{ notifications: NotificationLog[] }>(
    `/api/notifications/log${qs}`
  ).then((res) => res.notifications);
}

export async function healthCheck(): Promise<{
  status: string;
  version: string;
  model_loaded: boolean;
  dem_available: boolean;
}> {
  return fetchAPI("/api/health");
}

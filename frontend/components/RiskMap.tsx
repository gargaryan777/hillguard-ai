"use client";

import { useEffect, useRef, useState } from "react";
import {
  Map,
  MapLayerMouseEvent,
  NavigationControl,
  Popup,
  LngLatBounds,
  Marker,
  type StyleSpecification,
  type GeoJSONSource,
} from "maplibre-gl";
import { getMapData } from "@/lib/api";

interface RiskFeature {
  id: string;
  location: string;
  risk: "critical" | "high" | "moderate" | "low";
  score: number;
  confidence: number;
  rainfall: number;
  soilMoisture: number;
  coordinates: [number, number];
}

const FALLBACK_RISK_DATA: RiskFeature[] = [
  { id: "1", location: "NH-10 Km 29 (Coronation Sector)", risk: "critical", score: 96, confidence: 92, rainfall: 185, soilMoisture: 88, coordinates: [88.435, 26.912] },
  { id: "2", location: "Singtam Teesta Basin", risk: "critical", score: 91, confidence: 89, rainfall: 162, soilMoisture: 85, coordinates: [88.498, 27.234] },
  { id: "3", location: "Gangtok Ridge Sector", risk: "critical", score: 88, confidence: 85, rainfall: 140, soilMoisture: 80, coordinates: [88.613, 27.331] },
  { id: "4", location: "Mangan North Sikkim Zone", risk: "critical", score: 94, confidence: 87, rainfall: 175, soilMoisture: 84, coordinates: [88.529, 27.502] },
  { id: "5", location: "Namchi South Zone", risk: "high", score: 76, confidence: 81, rainfall: 110, soilMoisture: 72, coordinates: [88.358, 27.166] },
  { id: "6", location: "Rangpo Border Post", risk: "high", score: 71, confidence: 76, rainfall: 98, soilMoisture: 68, coordinates: [88.52, 27.15] },
  { id: "7", location: "Ravangla Ridge", risk: "moderate", score: 52, confidence: 68, rainfall: 74, soilMoisture: 55, coordinates: [88.36, 27.30] },
];

const RISK_COLORS: Record<string, string> = {
  critical: "#ef4444",
  high: "#f97316",
  moderate: "#eab308",
  low: "#22c55e",
};

const SATELLITE_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    esri: {
      type: "raster",
      tiles: [
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      ],
      tileSize: 256,
      attribution: "Tiles &copy; Esri",
    },
  },
  layers: [{ id: "esri-satellite", type: "raster", source: "esri" }],
};

function getRiskLabel(risk: string): string {
  return risk.charAt(0).toUpperCase() + risk.slice(1);
}

function severityToRisk(severity: string): RiskFeature["risk"] {
  const s = severity.toLowerCase();
  if (s === "critical") return "critical";
  if (s === "high") return "high";
  if (s === "moderate" || s === "medium") return "moderate";
  return "low";
}

function featuresToGeoJSON(items: RiskFeature[]) {
  return {
    type: "FeatureCollection" as const,
    features: items.map((item) => ({
      type: "Feature" as const,
      geometry: { type: "Point" as const, coordinates: item.coordinates },
      properties: {
        id: item.id,
        location: item.location,
        risk: item.risk,
        score: item.score,
        confidence: item.confidence,
        rainfall: item.rainfall,
        soilMoisture: item.soilMoisture,
      },
    })),
  };
}

let activeMarkers: Marker[] = [];

function addRiskLayers(map: Map, items: RiskFeature[]) {
  // Clear existing markers to prevent duplicates when data updates
  activeMarkers.forEach(m => m.remove());
  activeMarkers = [];

  items.forEach(item => {
    // 1. Create a custom HTML element for the marker
    const el = document.createElement("div");
    const isCritical = item.risk === "critical";
    const isHigh = item.risk === "high";

    el.style.width = isCritical ? "24px" : isHigh ? "20px" : "16px";
    el.style.height = isCritical ? "24px" : isHigh ? "20px" : "16px";
    el.style.backgroundColor = RISK_COLORS[item.risk] || RISK_COLORS.low;
    el.style.borderRadius = "50%";
    el.style.border = "3px solid white";
    el.style.cursor = "pointer";
    el.style.boxShadow = "0 2px 4px rgba(0,0,0,0.5)";

    // Add vivid pulsing red glow specifically for Critical & High zones
    if (isCritical) {
      el.style.animation = "pulse-beacon 2s infinite";
    } else if (isHigh) {
      el.style.boxShadow = "0 0 0 4px rgba(249, 115, 22, 0.3)";
    }

    // 2. Create the interactive popup
    const popupHTML = `
      <div style="font-family: system-ui, sans-serif; padding: 4px; min-width: 180px;">
        <div style="font-weight: 800; font-size: 13px; color: ${RISK_COLORS[item.risk] || RISK_COLORS.low}; margin-bottom: 6px; text-transform: uppercase;">
          ${isCritical ? '⚠️ ' : ''}${getRiskLabel(item.risk)} Risk
        </div>
        <div style="font-size: 11px; color: #64748b; margin-bottom: 10px; font-weight: 600;">
          ${item.location}
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px 12px; font-size: 11px;">
          <div><div style="color: #94a3b8; font-size: 9px; text-transform: uppercase;">Risk Score</div><div style="color: #1e293b; font-weight: 700;">${item.score}/100</div></div>
          <div><div style="color: #94a3b8; font-size: 9px; text-transform: uppercase;">Confidence</div><div style="color: #1e293b; font-weight: 700;">${item.confidence}%</div></div>
          <div><div style="color: #94a3b8; font-size: 9px; text-transform: uppercase;">Rainfall (24h)</div><div style="color: #1e293b; font-weight: 700;">${item.rainfall} mm</div></div>
          <div><div style="color: #94a3b8; font-size: 9px; text-transform: uppercase;">Moisture</div><div style="color: #1e293b; font-weight: 700;">${item.soilMoisture}%</div></div>
        </div>
      </div>
    `;

    const popup = new Popup({ offset: 15, closeButton: false, maxWidth: "240px" })
      .setHTML(popupHTML);

    // 3. Mount Marker to Map
    const marker = new Marker({ element: el })
      .setLngLat(item.coordinates)
      .setPopup(popup)
      .addTo(map);

    activeMarkers.push(marker);
  });
}

export default function RiskMap({ height = "420px" }: { height?: string }) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const container = mapContainer.current;
    if (!container) return;

    let cancelled = false;
    let map: Map | null = null;
    let raf = 0;

    const observer = new ResizeObserver(() => {
      map?.resize();
    });
    observer.observe(container);

    const init = () => {
      if (cancelled) return;
      if (container.clientWidth < 8 || container.clientHeight < 8) {
        raf = requestAnimationFrame(init);
        return;
      }

      try {
        map = new Map({
          container,
          style: SATELLITE_STYLE,
          center: [88.50, 27.18],
          zoom: 8.6,
          pitch: 0,
          bearing: 0,
        });
      } catch (err) {
        console.error(err);
        setLoadError("Map failed to start. Check WebGL in this browser.");
        return;
      }

      map.addControl(new NavigationControl({ showCompass: true }), "top-right");
      map.on("error", (e) => {
        console.warn("MapLibre error:", e.error || e);
      });

      map.on("load", () => {
        if (!map || cancelled) return;
        map.resize();

        fetch("/sikkim_boundary.geojson")
          .then((res) => {
            if (!res.ok) throw new Error(`boundary ${res.status}`);
            return res.json();
          })
          .then((sikkimGeojson) => {
            if (!map || cancelled || map.getSource("sikkim-boundary")) return;
            map.addSource("sikkim-boundary", { type: "geojson", data: sikkimGeojson });
            map.addLayer({
              id: "sikkim-fill",
              type: "fill",
              source: "sikkim-boundary",
              paint: { "fill-color": "#38bdf8", "fill-opacity": 0.06 },
            });
            map.addLayer({
              id: "sikkim-outline",
              type: "line",
              source: "sikkim-boundary",
              paint: { "line-color": "#38bdf8", "line-width": 2, "line-opacity": 0.7 },
            });

            const bounds = new LngLatBounds();
            for (const feature of sikkimGeojson.features || []) {
              const geom = feature.geometry;
              if (geom?.type === "Polygon") {
                for (const ring of geom.coordinates) {
                  for (const coord of ring) bounds.extend(coord as [number, number]);
                }
              } else if (geom?.type === "MultiPolygon") {
                for (const polygon of geom.coordinates) {
                  for (const ring of polygon) {
                    for (const coord of ring) bounds.extend(coord as [number, number]);
                  }
                }
              }
            }
            if (!bounds.isEmpty()) {
              // map.fitBounds(bounds, { padding: 40, maxZoom: 11 });
            }
          })
          .catch((err) => {
            console.warn("Could not load Sikkim boundary:", err);
          });

        addRiskLayers(map, FALLBACK_RISK_DATA);

        getMapData()
          .then((data) => {
            if (!map || cancelled) return;
            const fromReports: RiskFeature[] = (data.live_reports || []).map((r) => ({
              id: r.id,
              location: r.description?.slice(0, 48) || r.id,
              risk: severityToRisk(r.severity),
              score:
                r.severity?.toLowerCase() === "critical"
                  ? 90
                  : r.severity?.toLowerCase() === "high"
                    ? 72
                    : r.severity?.toLowerCase() === "moderate"
                      ? 50
                      : 28,
              confidence: 80,
              rainfall: 0,
              soilMoisture: 0,
              coordinates: [r.lng, r.lat],
            }));
            const fromZones: RiskFeature[] = (data.danger_zones || []).slice(0, 80).map((z, i) => ({
              id: `zone-${i}`,
              location: "Historical landslide",
              risk: "high" as const,
              score: 70,
              confidence: 75,
              rainfall: 0,
              soilMoisture: 0,
              coordinates: [z.lng, z.lat],
            }));
        const combined = [...FALLBACK_RISK_DATA, ...fromReports];
        addRiskLayers(map, combined);
      })
      .catch(() => {
        if (map) addRiskLayers(map, FALLBACK_RISK_DATA);
      });
      });

      mapRef.current = map;
    };

    raf = requestAnimationFrame(init);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      observer.disconnect();
      map?.remove();
      mapRef.current = null;
    };
  }, []);

  return (
    <div
      className="relative w-full overflow-hidden rounded-2xl border border-slate-700/50 bg-slate-900"
      style={{ height, minHeight: 320 }}
      aria-label="Sikkim Risk Monitoring Map"
    >
      <div ref={mapContainer} className="absolute inset-0 h-full w-full" />

      <h2 className="pointer-events-none absolute top-5 left-6 z-10 text-xs font-semibold uppercase tracking-wider text-slate-400">
        Sikkim Risk Monitoring
      </h2>

      {loadError && (
        <div className="absolute top-5 right-14 z-10 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs text-amber-400 backdrop-blur-sm">
          {loadError}
        </div>
      )}

      <div className="absolute bottom-5 right-5 z-10 flex flex-wrap items-center gap-3 rounded-xl border border-slate-700/50 bg-slate-900/80 px-3 py-2 backdrop-blur-sm">
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-red-500" />
          <span className="text-xs text-slate-400">Critical</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-orange-500" />
          <span className="text-xs text-slate-400">High</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-yellow-500" />
          <span className="text-xs text-slate-400">Moderate</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-green-500" />
          <span className="text-xs text-slate-400">Low</span>
        </div>
      </div>
    </div>
  );
}

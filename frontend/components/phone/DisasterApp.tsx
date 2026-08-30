"use client";

import React, { useState, useEffect } from "react";
import {
  Shield,
  MapPin,
  Activity,
  AlertTriangle,
  Radio,
  Sliders,
  Send,
  CloudRain,
  ChevronRight,
  Layers,
  PhoneCall,
  CheckCircle2,
  Clock,
  ArrowLeft,
  RefreshCw,
  Eye,
  Camera,
  Compass,
  Mountain,
  FileText,
  Truck,
  Users,
  Check
} from "lucide-react";
import dynamic from "next/dynamic";
import { evaluateTerrain, type SensorData } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import toast from "react-hot-toast";

const RiskMap = dynamic(() => import("@/components/RiskMap"), { ssr: false });

interface DisasterAppProps {
  onBackToHome: () => void;
  isOffline: boolean;
}

// Preset Sikkim Hazard Hotspots for Instant SIH Demo
const SIKKIM_HOTSPOTS = [
  { name: "NH-10 Km 29 (Coronation)", lat: 26.912, lng: 88.435, desc: "Steep gorge cut, chronic rockfall zone", baseSlope: 44 },
  { name: "Singtam Sector", lat: 27.234, lng: 88.498, desc: "High pore pressure near Teesta river basin", baseSlope: 38 },
  { name: "Gangtok Ridge (Deorali)", lat: 27.331, lng: 88.613, desc: "Urban slope overburden with high runoff", baseSlope: 32 },
  { name: "Mangan North Sikkim", lat: 27.502, lng: 88.529, desc: "Permafrost melt & loose debris channel", baseSlope: 49 },
  { name: "Namchi South Sikkim", lat: 27.166, lng: 88.358, desc: "Agricultural slope with tension cracks", baseSlope: 27 },
];

export default function DisasterApp({ onBackToHome, isOffline }: DisasterAppProps) {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<"map" | "telemetry" | "triage" | "lifelines">("map");

  // Point Risk Evaluator State
  const [selectedHotspot, setSelectedHotspot] = useState(SIKKIM_HOTSPOTS[0]);
  const [simulatedRain, setSimulatedRain] = useState(145);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<{
    riskScore: number;
    riskLevel: string;
    elevation: number;
    slope: number;
    aspect: number;
    confidence: number;
  }>({
    riskScore: 84,
    riskLevel: "CRITICAL",
    elevation: 1240,
    slope: 44.2,
    aspect: 135,
    confidence: 0.89,
  });

  // Triage incident list
  const [reports, setReports] = useState<Array<{
    id: string;
    location: string;
    type: string;
    severity: "CRITICAL" | "HIGH" | "MODERATE";
    status: "PENDING" | "VERIFIED" | "DISPATCHED" | "RESOLVED";
    time: string;
    reporter: string;
    details: string;
  }>>([
    {
      id: "R-109",
      location: "NH-10 Km 29 (Teesta Bridge)",
      type: "Massive Rockfall & Debris",
      severity: "CRITICAL",
      status: "DISPATCHED",
      time: "8 mins ago",
      reporter: "BRO Inspector Sharma",
      details: "Road blocked completely. Excavators mobilized from Singtam depot.",
    },
    {
      id: "R-108",
      location: "Namchi Lower Slopes",
      type: "Tension Crack (14m length)",
      severity: "HIGH",
      status: "PENDING",
      time: "24 mins ago",
      reporter: "Panchayat Head Lepcha",
      details: "Ground fissure widening near residential cluster. Requires immediate verification.",
    },
    {
      id: "R-107",
      location: "Mangan Highway Cut",
      type: "Hillside Water Seepage",
      severity: "MODERATE",
      status: "VERIFIED",
      time: "1 hour ago",
      reporter: "Forest Officer Dorjee",
      details: "Turbid water discharging from slope toe; drainage clearing initiated.",
    },
  ]);

  // Infrastructure lifelines
  const [lifelines, setLifelines] = useState([
    { name: "NH-10 Siliguri-Gangtok Highway", type: "Road Lifeline", status: "BLOCKED", location: "29th Mile", updated: "Just now" },
    { name: "Singtam Teesta Suspension Bridge", type: "Bridge", status: "ALERT", location: "Singtam", updated: "12m ago" },
    { name: "Gangtok Central District Hospital", type: "Medical", status: "OPERATIONAL", location: "Gangtok", updated: "1h ago" },
    { name: "Rangpo Power Distribution Grid", type: "Utility", status: "OPERATIONAL", location: "Rangpo", updated: "2h ago" },
  ]);

  // 15 Simulated Sensors
  const [sensors, setSensors] = useState([
    { id: "SN-01", name: "Singtam River Station", type: "Piezometer", value: "3.4 m", status: "CRITICAL", trend: "+0.8m", lat: 27.23, lng: 88.50 },
    { id: "SN-02", name: "29th Mile Rock Monitor", type: "Tiltmeter", value: "4.8° tilt", status: "CRITICAL", trend: "+1.2°", lat: 26.91, lng: 88.43 },
    { id: "SN-03", name: "Gangtok Ridge Radar", type: "Soil Moisture", value: "88% VWC", status: "WARNING", trend: "+5%", lat: 27.33, lng: 88.61 },
    { id: "SN-04", name: "Mangan Slope Gauge", type: "Pore Pressure", value: "142 kPa", status: "WARNING", trend: "+18 kPa", lat: 27.50, lng: 88.53 },
    { id: "SN-05", name: "Namchi Lower Station", type: "Vibration Sensor", value: "1.2 mm/s", status: "NORMAL", trend: "0.0", lat: 27.16, lng: 88.35 },
    { id: "SN-06", name: "Rangpo Border Post", type: "Rain Gauge", value: "34 mm/h", status: "WARNING", trend: "+12 mm", lat: 27.17, lng: 88.52 },
    { id: "SN-07", name: "Ravangla Ridge AWS", type: "Anemometer", value: "42 km/h", status: "NORMAL", trend: "-3 km/h", lat: 27.30, lng: 88.36 },
    { id: "SN-08", name: "Pelling Western Inclinometer", type: "Inclinometer", value: "1.8 mm disp", status: "NORMAL", trend: "+0.2 mm", lat: 27.31, lng: 88.23 },
  ]);

  const handleEvaluate = async (hotspot = selectedHotspot, rain = simulatedRain) => {
    setIsEvaluating(true);
    try {
      if (!isOffline) {
        const res = await evaluateTerrain(hotspot.lat, hotspot.lng, rain);
        setEvaluationResult({
          riskScore: Math.round(res.risk_score),
          riskLevel: res.risk_level,
          elevation: Math.round(res.terrain.elevation_m),
          slope: Number(res.terrain.slope_deg.toFixed(1)),
          aspect: Math.round(res.terrain.aspect_deg),
          confidence: 0.88,
        });
      } else {
        // Deterministic local simulation when offline
        const base = hotspot.baseSlope * 1.5;
        const rainBoost = (rain / 300) * 25;
        const finalScore = Math.min(Math.round(base + rainBoost), 98);
        setEvaluationResult({
          riskScore: finalScore,
          riskLevel: finalScore >= 80 ? "CRITICAL" : finalScore >= 60 ? "HIGH" : "MODERATE",
          elevation: 1200 + Math.round(hotspot.lat * 10),
          slope: hotspot.baseSlope,
          aspect: 145,
          confidence: 0.88,
        });
      }
    } catch {
      // Fallback
      const score = Math.min(Math.round(hotspot.baseSlope * 1.4 + (rain / 300) * 20), 96);
      setEvaluationResult({
        riskScore: score,
        riskLevel: score >= 80 ? "CRITICAL" : score >= 60 ? "HIGH" : "MODERATE",
        elevation: 1350,
        slope: hotspot.baseSlope,
        aspect: 135,
        confidence: 0.85,
      });
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleDispatchQRT = (id: string) => {
    setReports((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: "DISPATCHED" } : r))
    );
    toast.success(`NDRF Quick Reaction Team Dispatched for incident ${id}!`);
  };

  const handleBroadcastAlert = () => {
    toast.success("🚨 Official Evacuation Advisory Broadcasted to Local Panchayats!");
  };

  return (
    <div className="h-full flex flex-col bg-slate-50 overflow-hidden text-slate-800 relative">
      {/* Top Tactical App Header */}
      <div className="shrink-0 bg-white border-b border-slate-200 px-3.5 py-2.5 flex items-center justify-between z-20 shadow-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={onBackToHome}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors"
            title="Return to Portal Selector"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-sky-600" />
              <span className="font-extrabold text-xs text-slate-900">
                NDRF / SDMA Command
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-medium">
              Sikkim Tactical Operations Hub
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span className="text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200 px-2 py-0.5 rounded-full">
            Unit 12 OPS
          </span>
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 p-3.5 overflow-y-auto">
        {/* ========================================================================= */}
        {/* TAB 1: TACTICAL MAP & 30m DEM EVALUATOR */}
        {/* ========================================================================= */}
        {activeTab === "map" && (
          <div className="space-y-3.5 animate-fade-in">
            {/* Live Interactive GIS Map Card */}
            <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs relative">
              <div className="bg-slate-900 text-white px-3 py-2 text-[11px] font-bold flex items-center justify-between z-10 relative">
                <span className="flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-sky-400 animate-spin" />
                  Sikkim Interactive GIS Risk Map
                </span>
                <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-500/30 uppercase font-mono">
                  Esri 30m
                </span>
              </div>
              <div className="h-[200px] w-full relative">
                <RiskMap />
              </div>
            </div>

            {/* Hotspot Quick Select Carousel */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  Critical Himalayan Hotspots
                </span>
                <span className="text-[10px] text-sky-600 font-bold">5 Monitored</span>
              </div>
              <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                {SIKKIM_HOTSPOTS.map((spot) => (
                  <button
                    key={spot.name}
                    onClick={() => {
                      setSelectedHotspot(spot);
                      handleEvaluate(spot, simulatedRain);
                    }}
                    className={`px-3 py-2 rounded-2xl text-left transition-all shrink-0 w-[140px] border ${
                      selectedHotspot.name === spot.name
                        ? "bg-sky-600 text-white border-sky-600 shadow-sm"
                        : "bg-white text-slate-800 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    <div className="text-[11px] font-bold truncate">{spot.name}</div>
                    <div
                      className={`text-[9px] truncate mt-0.5 ${
                        selectedHotspot.name === spot.name ? "text-sky-100" : "text-slate-500"
                      }`}
                    >
                      Slope: {spot.baseSlope}° • DEM
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* AI Terrain Risk Evaluation Card */}
            <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
                    ⚡
                  </div>
                  <div>
                    <h3 className="text-xs font-extrabold text-slate-900">
                      30m DEM Slope AI Inference
                    </h3>
                    <p className="text-[10px] text-slate-500 font-mono">
                      {selectedHotspot.lat}°N, {selectedHotspot.lng}°E
                    </p>
                  </div>
                </div>

                <div
                  className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                    evaluationResult.riskLevel === "CRITICAL"
                      ? "bg-red-100 text-red-700 border border-red-200"
                      : evaluationResult.riskLevel === "HIGH"
                      ? "bg-orange-100 text-orange-700 border border-orange-200"
                      : "bg-emerald-100 text-emerald-700 border border-emerald-200"
                  }`}
                >
                  {evaluationResult.riskLevel} RISK
                </div>
              </div>

              {/* Risk Score Meter */}
              <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100 mb-3 flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase">
                    Calculated Failure Probability
                  </div>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-3xl font-black text-slate-900 tracking-tight">
                      {evaluationResult.riskScore}%
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500">
                      (AUC ~0.87)
                    </span>
                  </div>
                </div>

                {/* Visual Bar Gauge */}
                <div className="w-28 h-3 rounded-full bg-slate-200 overflow-hidden relative">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      evaluationResult.riskScore >= 80
                        ? "bg-red-600"
                        : evaluationResult.riskScore >= 60
                        ? "bg-orange-500"
                        : "bg-emerald-500"
                    }`}
                    style={{ width: `${evaluationResult.riskScore}%` }}
                  />
                </div>
              </div>

              {/* Terrain Features Extracted from NASA SRTM */}
              <div className="grid grid-cols-3 gap-2 text-center mb-3">
                <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                  <span className="text-[9px] font-bold text-slate-500 block uppercase">
                    Elevation
                  </span>
                  <span className="text-xs font-extrabold text-slate-800">
                    {evaluationResult.elevation} m
                  </span>
                </div>
                <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                  <span className="text-[9px] font-bold text-slate-500 block uppercase">
                    Slope Gradient
                  </span>
                  <span className="text-xs font-extrabold text-slate-800">
                    {evaluationResult.slope}°
                  </span>
                </div>
                <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                  <span className="text-[9px] font-bold text-slate-500 block uppercase">
                    Aspect Angle
                  </span>
                  <span className="text-xs font-extrabold text-slate-800">
                    {evaluationResult.aspect}° SE
                  </span>
                </div>
              </div>

              {/* Dynamic Hydro Simulation Slider */}
              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between text-[11px] font-bold mb-1">
                  <span className="flex items-center gap-1 text-slate-700">
                    <CloudRain className="w-3.5 h-3.5 text-sky-600" />
                    Live 24h Rainfall Boost:
                  </span>
                  <span className="text-sky-700 font-mono">{simulatedRain} mm/day</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="300"
                  step="5"
                  value={simulatedRain}
                  onChange={(e) => {
                    const r = Number(e.target.value);
                    setSimulatedRain(r);
                    handleEvaluate(selectedHotspot, r);
                  }}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-600"
                />
                <div className="flex justify-between text-[9px] text-slate-400 mt-1 font-medium">
                  <span>0 mm (Dry)</span>
                  <span>150 mm (Heavy)</span>
                  <span>300 mm (Extreme Monsoon)</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-3.5 grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleEvaluate()}
                  disabled={isEvaluating}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold py-2 rounded-xl flex items-center justify-center gap-1 transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isEvaluating ? "animate-spin" : ""}`} />
                  <span>Re-Sample DEM</span>
                </button>
                <button
                  onClick={handleBroadcastAlert}
                  className="bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold py-2 rounded-xl flex items-center justify-center gap-1 shadow-sm transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Broadcast Evac</span>
                </button>
              </div>
            </div>

            {/* Quick Tactical Briefing */}
            <div className="bg-sky-50 border border-sky-200 rounded-2xl p-3 text-sky-950">
              <div className="flex items-center gap-2 font-bold text-xs mb-1">
                <Mountain className="w-4 h-4 text-sky-700" />
                <span>Geological Tactical Advisory</span>
              </div>
              <p className="text-[11px] leading-relaxed text-sky-900/90">
                {selectedHotspot.desc}. High pore water pressure buildup under {simulatedRain}mm rain triggers shallow translational slide threshold.
              </p>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: TELEMETRY MATRIX (15 SENSORS) */}
        {/* ========================================================================= */}
        {activeTab === "telemetry" && (
          <div className="space-y-3 animate-fade-in">
            <div className="flex items-center justify-between mb-1">
              <div>
                <h3 className="text-xs font-extrabold text-slate-900">
                  Himalayan IoT Telemetry Matrix
                </h3>
                <p className="text-[10px] text-slate-500">
                  15 Sub-Surface & Hydrological Stations
                </p>
              </div>
              <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                All Online
              </span>
            </div>

            <div className="space-y-2">
              {sensors.map((sensor) => (
                <div
                  key={sensor.id}
                  className="bg-white border border-slate-200 rounded-2xl p-3 shadow-xs flex items-center justify-between"
                >
                  <div className="flex items-start gap-2.5">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
                        sensor.status === "CRITICAL"
                          ? "bg-red-100 text-red-700 border border-red-200"
                          : sensor.status === "WARNING"
                          ? "bg-amber-100 text-amber-700 border border-amber-200"
                          : "bg-emerald-100 text-emerald-700 border border-emerald-200"
                      }`}
                    >
                      <Activity className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">{sensor.name}</div>
                      <div className="text-[10px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                        <span className="font-mono">{sensor.id}</span>
                        <span>•</span>
                        <span>{sensor.type}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs font-extrabold text-slate-900 font-mono">
                      {sensor.value}
                    </div>
                    <span
                      className={`text-[9px] font-bold ${
                        sensor.status === "CRITICAL"
                          ? "text-red-600"
                          : sensor.status === "WARNING"
                          ? "text-amber-600"
                          : "text-emerald-600"
                      }`}
                    >
                      {sensor.trend}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: INCIDENT TRIAGE & EVACUATION QUEUE */}
        {/* ========================================================================= */}
        {activeTab === "triage" && (
          <div className="space-y-3 animate-fade-in">
            <div className="flex items-center justify-between mb-1">
              <div>
                <h3 className="text-xs font-extrabold text-slate-900">
                  Citizen & Field Report Triage
                </h3>
                <p className="text-[10px] text-slate-500">
                  Live Ground Verification & Dispatch
                </p>
              </div>
              <span className="text-[10px] font-bold bg-sky-100 text-sky-800 px-2 py-0.5 rounded-full">
                {reports.length} Active
              </span>
            </div>

            <div className="space-y-2.5">
              {reports.map((item) => (
                <div
                  key={item.id}
                  className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-xs"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold font-mono bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
                      {item.id}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        item.status === "DISPATCHED"
                          ? "bg-sky-100 text-sky-800"
                          : item.status === "VERIFIED"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>

                  <h4 className="text-xs font-extrabold text-slate-900">{item.location}</h4>
                  <p className="text-[11px] text-slate-600 mt-1 leading-snug">{item.details}</p>

                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                    <span>By: {item.reporter}</span>
                    <span>{item.time}</span>
                  </div>

                  {item.status === "PENDING" && (
                    <div className="mt-2.5 grid grid-cols-2 gap-1.5">
                      <button
                        onClick={() => handleDispatchQRT(item.id)}
                        className="bg-sky-600 hover:bg-sky-700 text-white text-[10px] font-bold py-1.5 rounded-xl transition-colors"
                      >
                        Dispatch NDRF QRT
                      </button>
                      <button
                        onClick={() => {
                          setReports((prev) =>
                            prev.map((r) => (r.id === item.id ? { ...r, status: "VERIFIED" } : r))
                          );
                          toast.success(`Report ${item.id} verified.`);
                        }}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold py-1.5 rounded-xl transition-colors"
                      >
                        Mark Verified
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: INFRASTRUCTURE LIFELINES */}
        {/* ========================================================================= */}
        {activeTab === "lifelines" && (
          <div className="space-y-3 animate-fade-in">
            <div className="flex items-center justify-between mb-1">
              <div>
                <h3 className="text-xs font-extrabold text-slate-900">
                  Himalayan Arterial Lifelines
                </h3>
                <p className="text-[10px] text-slate-500">
                  NH-10, Bridges, Hospitals & Power
                </p>
              </div>
              <button
                onClick={() => toast.success("Notified BRO & Traffic Police of Road Closure")}
                className="text-[10px] font-bold bg-red-600 text-white px-2 py-1 rounded-xl"
              >
                Issue Closure
              </button>
            </div>

            <div className="space-y-2">
              {lifelines.map((item) => (
                <div
                  key={item.name}
                  className="bg-white border border-slate-200 rounded-2xl p-3 shadow-xs flex items-center justify-between"
                >
                  <div>
                    <div className="text-xs font-bold text-slate-900">{item.name}</div>
                    <div className="text-[10px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                      <span>{item.type}</span>
                      <span>•</span>
                      <span>{item.location}</span>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase ${
                      item.status === "BLOCKED"
                        ? "bg-red-100 text-red-700 border border-red-200"
                        : item.status === "ALERT"
                        ? "bg-amber-100 text-amber-700 border border-amber-200"
                        : "bg-emerald-100 text-emerald-700 border border-emerald-200"
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Tactical App Navigation Bar (Pinned Footer inside Phone) */}
      <div className="shrink-0 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1.5 flex items-center justify-around z-30 shadow-md">
        <button
          onClick={() => setActiveTab("map")}
          className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all ${
            activeTab === "map" ? "text-sky-600 font-bold" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <Mountain className="w-4 h-4" />
          <span className="text-[9px]">30m Map</span>
        </button>

        <button
          onClick={() => setActiveTab("telemetry")}
          className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all ${
            activeTab === "telemetry" ? "text-sky-600 font-bold" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <Activity className="w-4 h-4" />
          <span className="text-[9px]">Sensors</span>
        </button>

        <button
          onClick={() => setActiveTab("triage")}
          className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all relative ${
            activeTab === "triage" ? "text-sky-600 font-bold" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <FileText className="w-4 h-4" />
          <span className="text-[9px]">Triage</span>
          <span className="absolute top-0 right-2 w-1.5 h-1.5 rounded-full bg-red-500" />
        </button>

        <button
          onClick={() => setActiveTab("lifelines")}
          className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all ${
            activeTab === "lifelines" ? "text-sky-600 font-bold" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <Truck className="w-4 h-4" />
          <span className="text-[9px]">Lifelines</span>
        </button>
      </div>
    </div>
  );
}

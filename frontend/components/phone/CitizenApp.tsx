"use client";

import React, { useState } from "react";
import {
  Shield,
  MapPin,
  CloudRain,
  AlertTriangle,
  Flame,
  Camera,
  Mic,
  MicOff,
  Navigation,
  PhoneCall,
  ArrowLeft,
  CheckCircle2,
  Volume2,
  ChevronRight,
  Info,
  Radio,
  Send,
  Upload,
  Compass,
  Car,
  Heart,
  Share2
} from "lucide-react";
import { saveReportOffline, getOfflineReportCount } from "@/lib/db";
import { useI18n } from "@/lib/i18n";
import toast from "react-hot-toast";

interface CitizenAppProps {
  onBackToHome: () => void;
  isOffline: boolean;
}

export default function CitizenApp({ onBackToHome, isOffline }: CitizenAppProps) {
  const { t, language } = useI18n();
  const [activeTab, setActiveTab] = useState<"safety" | "report" | "nh10" | "contacts">("safety");

  // SOS State
  const [sosCountdown, setSosCountdown] = useState<number | null>(null);
  const [sosTriggered, setSosTriggered] = useState(false);

  // Reporting Wizard State
  const [hazardType, setHazardType] = useState<"rockfall" | "mudslide" | "crack" | "seepage">("rockfall");
  const [severity, setSeverity] = useState<"minor" | "moderate" | "severe">("moderate");
  const [description, setDescription] = useState("");
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [voiceRecorded, setVoiceRecorded] = useState(false);
  const [imageAttached, setImageAttached] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // NH-10 Road Stretch Status
  const [roadStretches, setRoadStretches] = useState([
    {
      name: "NH-10 Km 29 (Coronation Sector)",
      status: "BLOCKED",
      details: "Boulders on roadway; BRO clearing with heavy excavators.",
      passable: false,
      delay: "+2.5 hrs",
    },
    {
      name: "Teesta Bazar Low Bridge",
      status: "CAUTION",
      details: "River level high; single-lane escorted convoy moving.",
      passable: true,
      delay: "+35 mins",
    },
    {
      name: "Rangpo Border Checkpost",
      status: "CLEAR",
      details: "Road conditions stable; normal vehicular movement.",
      passable: true,
      delay: "No delay",
    },
    {
      name: "Melli - Jorethang Alternate Bypass",
      status: "RECOMMENDED",
      details: "Safe mountain bypass route active for light vehicles & ambulances.",
      passable: true,
      delay: "+20 mins",
    },
  ]);

  // Handle SOS Panic Trigger
  const startSOS = () => {
    setSosCountdown(3);
    const interval = setInterval(() => {
      setSosCountdown((prev) => {
        if (prev === 1) {
          clearInterval(interval);
          setSosTriggered(true);
          toast.error("🚨 EMERGENCY SOS BROADCASTED TO NDRF & NEAREST VILLAGE RESPONDERS!");
          return null;
        }
        return prev ? prev - 1 : null;
      });
    }, 1000);
  };

  const cancelSOS = () => {
    setSosCountdown(null);
    toast("SOS Cancelled", { icon: "🛡️" });
  };

  // Handle Citizen Report Submission
  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // 1. Save locally in IndexedDB (guaranteed offline resilience)
      await saveReportOffline({
        latitude: 27.234,
        longitude: 88.498,
        description: `[${hazardType.toUpperCase()}] ${description || "Field incident reported by citizen"}`,
        severity: severity === "severe" ? "HIGH" : severity === "moderate" ? "MODERATE" : "LOW",
        timestamp: Date.now(),
      });

      if (!isOffline) {
        // Online sync simulation
        toast.success("✅ Hazard Report Sent to Sikkim Command Center!");
      } else {
        toast.success("📦 Saved Offline in Phone! Will auto-sync when network returns.");
      }

      // Reset form
      setDescription("");
      setImageAttached(false);
      setVoiceRecorded(false);
      setActiveTab("safety");
    } catch {
      toast.error("Failed to store report");
    } finally {
      setIsSubmitting(false);
    }
  };

  const playVoiceAdvisory = () => {
    toast("🔊 Playing Local Language Safety Announcement...", { icon: "📢" });
  };

  return (
    <div className="h-full flex flex-col bg-slate-50 overflow-hidden text-slate-800 relative">
      {/* Top Citizen App Header */}
      <div className="shrink-0 bg-white border-b border-slate-200 px-3.5 py-2.5 flex items-center justify-between z-20 shadow-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={onBackToHome}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors"
            title="Back to Portals"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-red-500" />
              <span className="font-extrabold text-xs text-slate-900">Singtam, East Sikkim</span>
            </div>
            <p className="text-[10px] text-slate-500 font-medium">GPS Active • Elev 1,320m</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={playVoiceAdvisory}
            className="w-7 h-7 rounded-full bg-sky-50 hover:bg-sky-100 text-sky-600 flex items-center justify-center transition-colors"
            title="Listen to Audio Warning"
          >
            <Volume2 className="w-3.5 h-3.5" />
          </button>
          <span className="text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full flex items-center gap-1">
            <CloudRain className="w-3 h-3 text-amber-700" />
            28 mm/h
          </span>
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 p-3.5 overflow-y-auto">
        {/* ========================================================================= */}
        {/* TAB 1: AM I SAFE? SAFETY RADAR & SOS */}
        {/* ========================================================================= */}
        {activeTab === "safety" && (
          <div className="space-y-3.5 animate-fade-in">
            {/* Live Safety Gauge Card */}
            <div className="bg-gradient-to-br from-white to-amber-50/50 border-2 border-amber-200 rounded-3xl p-4 shadow-sm relative overflow-hidden">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <span className="text-[10px] font-extrabold text-amber-800 uppercase tracking-wider bg-amber-100 px-2 py-0.5 rounded-full">
                    Current Slope Status
                  </span>
                  <h2 className="text-base font-extrabold text-slate-900 mt-1">
                    High Landslide Risk Here
                  </h2>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-black text-lg shadow-md shadow-amber-500/30">
                  78%
                </div>
              </div>

              <p className="text-[11px] text-slate-600 leading-relaxed mb-3">
                Steep saturated slope above your position (38° gradient) with heavy rainfall. Ground seepage detected 400m uphill.
              </p>

              {/* Immediate Action Advice */}
              <div className="bg-white/90 border border-amber-200/80 rounded-2xl p-2.5 text-[11px] space-y-1.5 mb-3">
                <div className="flex items-start gap-1.5 text-slate-800 font-medium">
                  <span className="text-red-500 font-bold">⚠️</span>
                  <span>Do not park or halt vehicles below road-cut cliffs.</span>
                </div>
                <div className="flex items-start gap-1.5 text-slate-800 font-medium">
                  <span className="text-emerald-600 font-bold">🛡️</span>
                  <span>Designated Safe Shelter: <strong>Singtam Senior Secondary School</strong> (850m).</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setActiveTab("report")}
                  className="bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold py-2 rounded-xl flex items-center justify-center gap-1 transition-colors"
                >
                  <Camera className="w-3.5 h-3.5 text-amber-400" />
                  <span>Report Hazard</span>
                </button>
                <button
                  onClick={() => toast.success("Opening GPS Walking Path to Safe Shelter...")}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold py-2 rounded-xl flex items-center justify-center gap-1 transition-colors shadow-xs"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Safe Shelter Route</span>
                </button>
              </div>
            </div>

            {/* Emergency SOS Panic Button Card */}
            <div className="bg-red-50 border border-red-200 rounded-3xl p-4 shadow-sm text-center">
              <h3 className="text-xs font-extrabold text-red-900 mb-0.5">
                Emergency Distress Beacon (SOS)
              </h3>
              <p className="text-[10px] text-red-700 mb-3">
                Transmits GPS coordinates to NDRF and sounds local alarm
              </p>

              {sosCountdown !== null ? (
                <div className="space-y-2">
                  <div className="text-3xl font-black text-red-600 animate-ping">
                    {sosCountdown}
                  </div>
                  <p className="text-xs font-bold text-red-800">Broadcasting SOS in {sosCountdown}s...</p>
                  <button
                    onClick={cancelSOS}
                    className="bg-slate-800 text-white text-xs font-bold px-4 py-1.5 rounded-full"
                  >
                    Cancel SOS
                  </button>
                </div>
              ) : sosTriggered ? (
                <div className="bg-white p-3 rounded-2xl border border-red-300 space-y-1.5">
                  <div className="flex items-center justify-center gap-1 text-red-600 font-extrabold text-xs">
                    <Flame className="w-4 h-4" />
                    <span>SOS ACTIVE • HELP DISPATCHED</span>
                  </div>
                  <p className="text-[10px] text-slate-600">
                    Your GPS coordinates (27.234°N, 88.498°E) sent to NDRF Unit 12.
                  </p>
                  <button
                    onClick={() => setSosTriggered(false)}
                    className="text-[10px] text-slate-500 underline"
                  >
                    Reset Beacon
                  </button>
                </div>
              ) : (
                <button
                  onClick={startSOS}
                  className="animate-sos-pulse w-24 h-24 mx-auto rounded-full bg-gradient-to-tr from-red-600 to-rose-500 text-white font-black text-xl flex flex-col items-center justify-center shadow-lg shadow-red-500/40 active:scale-90 transition-transform cursor-pointer"
                >
                  <span>SOS</span>
                  <span className="text-[9px] font-semibold tracking-wider uppercase opacity-90">
                    Press 3s
                  </span>
                </button>
              )}
            </div>

            {/* Quick Community Alerts Feed */}
            <div className="bg-white border border-slate-200 rounded-3xl p-3.5 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-900">
                  Regional Broadcasts (क्षेत्रीय चेतावनी)
                </span>
                <span className="text-[9px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full font-bold">
                  LIVE
                </span>
              </div>
              <div className="text-[11px] text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100 space-y-1">
                <p className="font-bold text-slate-900">
                  ⚠️ Singtam-Rangpo Corridor Advisory
                </p>
                <p className="text-[10px] text-slate-600 leading-normal">
                  भारी वर्षाको कारणले गर्दा २९ माईलमा सडक अवरुद्ध छ। (Due to heavy rain, NH-10 is blocked at 29th Mile. Use Melli detour.)
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: QUICK HAZARD & CRACK REPORTER (OFFLINE READY) */}
        {/* ========================================================================= */}
        {activeTab === "report" && (
          <form onSubmit={handleSubmitReport} className="space-y-3 animate-fade-in">
            <div className="bg-sky-50 border border-sky-200 rounded-2xl p-3 text-sky-950 text-[11px] flex items-center justify-between">
              <div>
                <span className="font-extrabold block text-xs">Offline-First Reporter</span>
                <span className="text-[10px] text-sky-800">
                  Works without internet; automatically syncs via IndexedDB.
                </span>
              </div>
              <Radio className="w-4 h-4 text-sky-600 shrink-0" />
            </div>

            {/* Hazard Category Grid */}
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1.5">
                Select Hazard Type (खतराको प्रकार)
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "rockfall", label: "🪨 Rockfall on Road", desc: "Falling stones & boulders" },
                  { id: "mudslide", label: "🌊 Soil / Mudslide", desc: "Sliding earth & trees" },
                  { id: "crack", label: "〰️ Tension Crack", desc: "Ground fissure widening" },
                  { id: "seepage", label: "💧 Water Seepage", desc: "Turbid muddy water burst" },
                ].map((type) => (
                  <button
                    type="button"
                    key={type.id}
                    onClick={() => setHazardType(type.id as any)}
                    className={`p-2.5 rounded-2xl text-left border transition-all ${
                      hazardType === type.id
                        ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                        : "bg-white text-slate-800 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <div className="text-xs font-bold">{type.label}</div>
                    <div
                      className={`text-[9px] mt-0.5 ${
                        hazardType === type.id ? "text-slate-300" : "text-slate-500"
                      }`}
                    >
                      {type.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Severity Level */}
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1.5">
                Threat Level
              </label>
              <div className="grid grid-cols-3 gap-1.5 text-center text-xs font-bold">
                {[
                  { id: "minor", label: "Minor", color: "border-emerald-300 text-emerald-700 bg-emerald-50" },
                  { id: "moderate", label: "Moderate", color: "border-amber-300 text-amber-700 bg-amber-50" },
                  { id: "severe", label: "Severe Cutoff", color: "border-red-300 text-red-700 bg-red-50" },
                ].map((s) => (
                  <button
                    type="button"
                    key={s.id}
                    onClick={() => setSeverity(s.id as any)}
                    className={`py-1.5 rounded-xl border ${
                      severity === s.id
                        ? "bg-slate-900 text-white border-slate-900"
                        : `${s.color} hover:opacity-80`
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Photo & Audio Capture */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setImageAttached(!imageAttached);
                  toast.success(imageAttached ? "Photo removed" : "📸 Simulated Camera Photo Attached!");
                }}
                className={`p-2.5 rounded-2xl border flex flex-col items-center justify-center gap-1 transition-all ${
                  imageAttached
                    ? "bg-emerald-50 border-emerald-300 text-emerald-800 font-bold"
                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
              >
                <Camera className="w-5 h-5 text-sky-600" />
                <span className="text-[10px]">
                  {imageAttached ? "✓ Photo Attached" : "Take Slope Photo"}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsRecordingVoice(!isRecordingVoice);
                  if (!isRecordingVoice) {
                    setTimeout(() => {
                      setIsRecordingVoice(false);
                      setVoiceRecorded(true);
                      toast.success("🎙️ 8s Voice Description Recorded!");
                    }, 3000);
                  }
                }}
                className={`p-2.5 rounded-2xl border flex flex-col items-center justify-center gap-1 transition-all ${
                  isRecordingVoice
                    ? "bg-red-100 border-red-300 text-red-700 font-bold animate-pulse"
                    : voiceRecorded
                    ? "bg-emerald-50 border-emerald-300 text-emerald-800 font-bold"
                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
              >
                {isRecordingVoice ? <Mic className="w-5 h-5 text-red-600" /> : <Mic className="w-5 h-5 text-sky-600" />}
                <span className="text-[10px]">
                  {isRecordingVoice
                    ? "Recording Voice..."
                    : voiceRecorded
                    ? "✓ Audio Saved"
                    : "Record Voice Note"}
                </span>
              </button>
            </div>

            {/* Incident Description */}
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Additional Details (ऐच्छिक विवरण)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe landmark, road blockage, or crack width..."
                className="w-full text-xs p-2.5 rounded-2xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:border-slate-900"
                rows={2}
              />
            </div>

            {/* GPS Autofill info */}
            <div className="text-[10px] text-slate-500 flex items-center justify-between px-1">
              <span>📍 Geotagged: 27.234°N, 88.498°E</span>
              <span className="text-emerald-600 font-bold">Accuracy ±4m</span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs py-3 rounded-2xl flex items-center justify-center gap-2 shadow-md transition-colors"
            >
              <Send className="w-4 h-4 text-emerald-400" />
              <span>{isOffline ? "Save Offline Incident" : "Submit Incident Report"}</span>
            </button>
          </form>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: NH-10 HIGHWAY & ROAD STATUS LIVE */}
        {/* ========================================================================= */}
        {activeTab === "nh10" && (
          <div className="space-y-3 animate-fade-in">
            <div className="flex items-center justify-between mb-1">
              <div>
                <h3 className="text-xs font-extrabold text-slate-900">
                  NH-10 Himalayan Lifeline Status
                </h3>
                <p className="text-[10px] text-slate-500">
                  Live Traffic & Landslide Choke Points
                </p>
              </div>
              <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                1 Sector Blocked
              </span>
            </div>

            <div className="space-y-2">
              {roadStretches.map((road) => (
                <div
                  key={road.name}
                  className="bg-white border border-slate-200 rounded-2xl p-3 shadow-xs"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-900">{road.name}</span>
                    <span
                      className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase ${
                        road.status === "BLOCKED"
                          ? "bg-red-100 text-red-700"
                          : road.status === "CAUTION"
                          ? "bg-amber-100 text-amber-700"
                          : road.status === "RECOMMENDED"
                          ? "bg-sky-100 text-sky-800"
                          : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {road.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-snug">{road.details}</p>
                  <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px]">
                    <span className="text-slate-500">Delay: {road.delay}</span>
                    <button
                      onClick={() => toast.success(`Viewing bypass route for ${road.name}`)}
                      className="text-sky-600 font-bold flex items-center gap-0.5"
                    >
                      <span>Show Route</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: EMERGENCY SPEED DIALS */}
        {/* ========================================================================= */}
        {activeTab === "contacts" && (
          <div className="space-y-3 animate-fade-in">
            <div className="mb-1">
              <h3 className="text-xs font-extrabold text-slate-900">
                Disaster Emergency Speed Dials
              </h3>
              <p className="text-[10px] text-slate-500">
                1-Tap Toll-Free Direct Helplines for Sikkim
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {[
                { title: "NDRF Helpline", number: "1078", color: "bg-sky-600", desc: "National Rescue Force" },
                { title: "Sikkim SDMA", number: "1070", color: "bg-indigo-600", desc: "State Disaster Authority" },
                { title: "Ambulance", number: "108", color: "bg-emerald-600", desc: "Medical Emergency" },
                { title: "Police Emergency", number: "112", color: "bg-slate-800", desc: "Immediate Police Aid" },
                { title: "BRO Road Control", number: "+91-3592-202202", color: "bg-amber-600", desc: "Border Roads Org" },
                { title: "Panchayat SOS", number: "+91-94340-12345", color: "bg-teal-600", desc: "Singtam Village Hub" },
              ].map((c) => (
                <a
                  key={c.title}
                  href={`tel:${c.number}`}
                  onClick={(e) => {
                    e.preventDefault();
                    toast.success(`Calling ${c.title} (${c.number})...`);
                  }}
                  className="bg-white border border-slate-200 rounded-2xl p-3 shadow-xs hover:border-slate-400 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="w-7 h-7 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center mb-1.5">
                      <PhoneCall className="w-3.5 h-3.5 text-sky-600" />
                    </div>
                    <div className="text-xs font-extrabold text-slate-900">{c.title}</div>
                    <div className="text-[9px] text-slate-500">{c.desc}</div>
                  </div>
                  <div className="mt-2 text-xs font-black text-sky-700 font-mono">
                    {c.number}
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Citizen App Navigation Bar (Pinned Footer inside Phone) */}
      <div className="shrink-0 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1.5 flex items-center justify-around z-30 shadow-md">
        <button
          onClick={() => setActiveTab("safety")}
          className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all ${
            activeTab === "safety" ? "text-emerald-600 font-bold" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <Shield className="w-4 h-4" />
          <span className="text-[9px]">My Safety</span>
        </button>

        <button
          onClick={() => setActiveTab("report")}
          className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all ${
            activeTab === "report" ? "text-emerald-600 font-bold" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <Camera className="w-4 h-4" />
          <span className="text-[9px]">Report Hazard</span>
        </button>

        <button
          onClick={() => setActiveTab("nh10")}
          className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all ${
            activeTab === "nh10" ? "text-emerald-600 font-bold" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <Car className="w-4 h-4" />
          <span className="text-[9px]">NH-10 Roads</span>
        </button>

        <button
          onClick={() => setActiveTab("contacts")}
          className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all ${
            activeTab === "contacts" ? "text-emerald-600 font-bold" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <PhoneCall className="w-4 h-4" />
          <span className="text-[9px]">Speed Dials</span>
        </button>
      </div>
    </div>
  );
}

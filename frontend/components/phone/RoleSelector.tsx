"use client";

import React, { useState } from "react";
import {
  Shield,
  Users,
  AlertTriangle,
  Radio,
  CloudRain,
  ChevronRight,
  Sparkles,
  Layers,
  MapPin,
  Flame,
  Activity,
  HeartHandshake,
  CheckCircle,
  HelpCircle
} from "lucide-react";
import { useI18n, LANGUAGES, type Language } from "@/lib/i18n";

interface RoleSelectorProps {
  onSelectRole: (role: "disaster" | "citizen") => void;
  isOffline: boolean;
  onToggleOffline: () => void;
}

export default function RoleSelector({
  onSelectRole,
  isOffline,
  onToggleOffline,
}: RoleSelectorProps) {
  const { language, setLanguage, t } = useI18n();
  const [showInfo, setShowInfo] = useState(false);

  return (
    <div className="flex-1 flex flex-col justify-between p-4 bg-gradient-to-b from-sky-50 via-white to-slate-50 min-h-full animate-fade-in">
      {/* Top Header & Branding */}
      <div className="pt-2">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center shadow-md shadow-sky-500/20 text-white font-bold text-xl">
              🛡️
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base font-extrabold text-slate-900 tracking-tight">
                  HillGuard AI
                </span>
                <span className="text-[9px] bg-sky-100 text-sky-700 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  v2.0
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                Landslide Early Warning & Rescue
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowInfo(!showInfo)}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors text-xs"
            title="System Overview"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>



        {/* Language Selector Pills */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              Select Language (क्षेत्रीय भाषा)
            </span>
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => setLanguage(lang.code)}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold transition-all shrink-0 ${
                  language === lang.code
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
              >
                {lang.nativeName}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Role Selection Cards */}
      <div className="space-y-3.5 my-auto">
        <div className="text-center mb-1">
          <h2 className="text-sm font-extrabold text-slate-900">
            Choose Your Access Portal
          </h2>
          <p className="text-[11px] text-slate-500">
            Tailored interfaces for tactical responders and mountain citizens
          </p>
        </div>

        {/* 1. Disaster Response Team Portal */}
        <div
          onClick={() => onSelectRole("disaster")}
          className="group relative bg-gradient-to-br from-white to-sky-50/60 border-2 border-sky-200 hover:border-sky-500 rounded-3xl p-4 shadow-sm hover:shadow-md cursor-pointer transition-all duration-200 active:scale-[0.98]"
        >
          <div className="flex items-start justify-between mb-2">
            <div className="w-11 h-11 rounded-2xl bg-sky-600 text-white flex items-center justify-center shadow-md shadow-sky-500/30">
              <Shield className="w-6 h-6" />
            </div>
            <span className="bg-sky-100 text-sky-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-sky-200 uppercase tracking-wider">
              Official & Command
            </span>
          </div>

          <h3 className="text-sm font-bold text-slate-900 group-hover:text-sky-700 transition-colors">
            Disaster Response & Operations
          </h3>
          <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
            NDRF, BRO Engineers, District SDMA & Forest Dept.
          </p>

          <div className="mt-3 pt-2.5 border-t border-slate-200/60 grid grid-cols-3 gap-1.5 text-[10px] text-slate-600 font-medium">
            <span className="flex items-center gap-1 bg-white/80 px-1.5 py-0.5 rounded-md border border-slate-100">
              ⚡ 30m AI Risk
            </span>
            <span className="flex items-center gap-1 bg-white/80 px-1.5 py-0.5 rounded-md border border-slate-100">
              📡 15 Sensors
            </span>
            <span className="flex items-center gap-1 bg-white/80 px-1.5 py-0.5 rounded-md border border-slate-100">
              🚨 Triage & Evac
            </span>
          </div>

          <div className="mt-3 flex items-center justify-between text-sky-700 text-xs font-bold">
            <span>Enter Command Console</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* 2. Citizen & Mountain Commuter Portal */}
        <div
          onClick={() => onSelectRole("citizen")}
          className="group relative bg-gradient-to-br from-white to-emerald-50/60 border-2 border-emerald-200 hover:border-emerald-500 rounded-3xl p-4 shadow-sm hover:shadow-md cursor-pointer transition-all duration-200 active:scale-[0.98]"
        >
          <div className="flex items-start justify-between mb-2">
            <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/30">
              <Users className="w-6 h-6" />
            </div>
            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200 uppercase tracking-wider">
              Public & Village
            </span>
          </div>

          <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
            Citizen & Mountain Commuter
          </h3>
          <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
            Local Residents, Tourists, Drivers & Panchayat Reporters.
          </p>

          <div className="mt-3 pt-2.5 border-t border-slate-200/60 grid grid-cols-3 gap-1.5 text-[10px] text-slate-600 font-medium">
            <span className="flex items-center gap-1 bg-white/80 px-1.5 py-0.5 rounded-md border border-slate-100">
              🛡️ Am I Safe?
            </span>
            <span className="flex items-center gap-1 bg-white/80 px-1.5 py-0.5 rounded-md border border-slate-100">
              🆘 1-Tap SOS
            </span>
            <span className="flex items-center gap-1 bg-white/80 px-1.5 py-0.5 rounded-md border border-slate-100">
              🛣️ NH-10 Live
            </span>
          </div>

          <div className="mt-3 flex items-center justify-between text-emerald-700 text-xs font-bold">
            <span>Launch Citizen App</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>

      {/* Bottom Offline & System Info Bar */}
      <div className="pt-3 pb-1 border-t border-slate-200/80">
        <div className="flex items-center justify-between text-[11px]">
          <button
            onClick={onToggleOffline}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl font-bold transition-all ${
              isOffline
                ? "bg-amber-100 text-amber-800 border border-amber-300"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>{isOffline ? "Mode: Offline (Flight)" : "Simulate Offline"}</span>
          </button>

          <div className="flex items-center gap-1 text-slate-400 font-medium text-[10px]">
            <span>SIH 2026 Theme</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          </div>
        </div>
      </div>

      {/* System info modal */}
      {showInfo && (
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 shadow-2xl max-w-[340px] text-slate-800 border border-slate-200 animate-scale-up">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">🛡️</span>
              <div>
                <h4 className="font-extrabold text-sm text-slate-900">HillGuard AI Mobile</h4>
                <p className="text-[10px] text-slate-500">Smart India Hackathon Prototype</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed mb-3">
              HillGuard AI unifies high-resolution 30m NASA SRTM terrain modeling with dynamic meteorological forecasting and an offline-first mobile architecture.
            </p>
            <div className="space-y-1.5 text-[11px] text-slate-700 mb-4 bg-slate-50 p-2.5 rounded-2xl border border-slate-200">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>30m Point ML Inference on DEM</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>Zero-Bandwidth IndexedDB Cache</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>5 Regional Himalayan Dialects</span>
              </div>
            </div>
            <button
              onClick={() => setShowInfo(false)}
              className="w-full bg-slate-900 text-white py-2 rounded-2xl text-xs font-bold hover:bg-slate-800 transition-colors"
            >
              Close Overview
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

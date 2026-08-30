"use client";

import React, { useState } from "react";
import PhoneFrame from "./PhoneFrame";
import RoleSelector from "./RoleSelector";
import DisasterApp from "./DisasterApp";
import CitizenApp from "./CitizenApp";
import {
  Shield,
  Radio,
  Flame,
  Users
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

export default function PresentationCanvas() {
  const [activeRole, setActiveRole] = useState<"home" | "disaster" | "citizen">("home");
  const [isOffline, setIsOffline] = useState(false);
  const [activeAlertNotification, setActiveAlertNotification] = useState<{
    title: string;
    message: string;
    severity: "critical" | "warning" | "info";
  } | null>(null);

  const handleToggleOffline = () => {
    setIsOffline((prev) => {
      const next = !prev;
      if (next) {
        toast("✈️ Airplane Mode ON: Operating in offline IndexedDB mode", { icon: "📡" });
      } else {
        toast.success("🌐 Online Mode Restored: Synchronizing offline reports...");
      }
      return next;
    });
  };

  const triggerSimulatedAlert = () => {
    setActiveAlertNotification({
      title: "NH-10 Km 29 CRITICAL",
      message: "Massive rockfall hazard detected by Singtam sensor SN-02.",
      severity: "critical",
    });
    toast.error("🚨 Simulated Red Alert Dispatched to Dynamic Island!");
    setTimeout(() => {
      setActiveAlertNotification(null);
    }, 6000);
  };

  return (
    <div className="h-screen w-screen bg-slate-950 text-white flex flex-col justify-between overflow-hidden select-none">
      {/* Toast provider */}
      <Toaster position="top-center" reverseOrder={false} />

      {/* Top Presentation Bar */}
      <header className="bg-slate-900/90 border-b border-slate-800 px-4 py-2 flex items-center justify-between shrink-0 z-20">
        {/* Title */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold shadow-sm">
            🛡️
          </div>
          <div>
            <h1 className="text-xs font-black text-white tracking-tight">
              HillGuard AI — Mobile Early Warning Platform
            </h1>
            <p className="text-[10px] text-slate-400 font-medium">
              Smart India Hackathon 2026 Prototype
            </p>
          </div>
        </div>

        {/* Quick Portal Switcher & Controls */}
        <div className="flex items-center gap-2">
          {/* Quick Role Switcher */}
          <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center gap-1 text-[11px] font-bold">
            <button
              onClick={() => setActiveRole("home")}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                activeRole === "home"
                  ? "bg-slate-800 text-white shadow-xs"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              🏠 Home Hub
            </button>
            <button
              onClick={() => setActiveRole("disaster")}
              className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
                activeRole === "disaster"
                  ? "bg-sky-600 text-white shadow-xs"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Shield className="w-3 h-3" />
              <span>NDRF Command</span>
            </button>
            <button
              onClick={() => setActiveRole("citizen")}
              className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
                activeRole === "citizen"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Users className="w-3 h-3" />
              <span>Citizen App</span>
            </button>
          </div>

          {/* Offline Simulation Toggle */}
          <button
            onClick={handleToggleOffline}
            className={`text-[11px] font-bold px-2.5 py-1.5 rounded-xl border transition-all flex items-center gap-1 ${
              isOffline
                ? "bg-amber-500 text-slate-950 border-amber-400 font-extrabold"
                : "bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800"
            }`}
            title="Test Offline IndexedDB queueing"
          >
            <Radio className="w-3 h-3" />
            <span>{isOffline ? "Flight Mode (Offline)" : "Simulate Offline"}</span>
          </button>

          {/* Trigger Alert */}
          <button
            onClick={triggerSimulatedAlert}
            className="bg-red-950/80 hover:bg-red-900 text-red-300 border border-red-800 text-[11px] font-bold px-2.5 py-1.5 rounded-xl flex items-center gap-1 transition-all"
            title="Simulate red alert in phone dynamic island"
          >
            <Flame className="w-3 h-3 text-red-500 animate-pulse" />
            <span>Trigger Alert</span>
          </button>
        </div>
      </header>

      {/* Main Centered Stage for Phone (No Outer Scroll) */}
      <main className="flex-1 flex items-center justify-center p-2">
        <PhoneFrame
          activeRole={activeRole}
          onSelectRole={setActiveRole}
          isOffline={isOffline}
          onToggleOffline={handleToggleOffline}
          alertNotification={activeAlertNotification}
          onDismissAlert={() => setActiveAlertNotification(null)}
        >
          {activeRole === "home" && (
            <RoleSelector
              onSelectRole={setActiveRole}
              isOffline={isOffline}
              onToggleOffline={handleToggleOffline}
            />
          )}

          {activeRole === "disaster" && (
            <DisasterApp
              onBackToHome={() => setActiveRole("home")}
              isOffline={isOffline}
            />
          )}

          {activeRole === "citizen" && (
            <CitizenApp
              onBackToHome={() => setActiveRole("home")}
              isOffline={isOffline}
            />
          )}
        </PhoneFrame>
      </main>

      {/* Subdued Footer Note */}
      <footer className="py-1 text-center text-[10px] text-slate-500 shrink-0 border-t border-slate-900">
        HillGuard AI Mobile Prototype • Interactive Light Theme Inside Smartphone Frame
      </footer>
    </div>
  );
}

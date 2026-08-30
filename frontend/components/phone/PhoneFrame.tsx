"use client";

import React, { useState, useEffect, ReactNode } from "react";
import {
  Wifi,
  Shield,
  Radio,
  Plane,
  Flame
} from "lucide-react";

interface PhoneFrameProps {
  children: ReactNode;
  activeRole: "home" | "disaster" | "citizen";
  onSelectRole: (role: "home" | "disaster" | "citizen") => void;
  isOffline: boolean;
  onToggleOffline: () => void;
  alertNotification?: { title: string; message: string; severity: "critical" | "warning" | "info" } | null;
  onDismissAlert?: () => void;
}

export default function PhoneFrame({
  children,
  activeRole,
  onSelectRole,
  isOffline,
  onToggleOffline,
  alertNotification,
}: PhoneFrameProps) {
  const [currentTime, setCurrentTime] = useState("9:41");
  const [batteryLevel] = useState(92);
  const [isExpandedIsland, setIsExpandedIsland] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const formattedMinutes = minutes < 10 ? `0${minutes}` : `${minutes}`;
      const formattedHours = hours % 12 || 12;
      setCurrentTime(`${formattedHours}:${formattedMinutes}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative mx-auto flex flex-col items-center">
      {/* Physical iPhone Pro Titanium Chassis */}
      <div
        className="relative w-[375px] sm:w-[395px] h-[790px] sm:h-[810px] max-h-[90vh] rounded-[54px] bg-slate-950 p-[11px] transition-all duration-300 select-none flex flex-col shadow-2xl border-4 border-slate-800"
        style={{
          boxShadow: "0 30px 70px -15px rgba(0, 0, 0, 0.9), inset 0 0 0 1px rgba(255, 255, 255, 0.15)",
        }}
      >
        {/* Hardware side buttons (iPhone Pro Layout) */}
        {/* Action Button (Left Top) */}
        <div className="absolute -left-[6px] top-[95px] w-[5px] h-[22px] bg-slate-700 rounded-l-md border-r border-slate-800" />
        {/* Volume Up (Left Middle) */}
        <div className="absolute -left-[6px] top-[135px] w-[5px] h-[46px] bg-slate-700 rounded-l-md border-r border-slate-800" />
        {/* Volume Down (Left Bottom) */}
        <div className="absolute -left-[6px] top-[195px] w-[5px] h-[46px] bg-slate-700 rounded-l-md border-r border-slate-800" />
        {/* Side Power / Siri Button (Right) */}
        <div className="absolute -right-[6px] top-[160px] w-[5px] h-[72px] bg-slate-700 rounded-r-md border-l border-slate-800" />

        {/* Screen Bezel & Curved OLED Corner Glass (Light App Surface) */}
        <div className="relative w-full h-full rounded-[44px] bg-slate-50 overflow-hidden flex flex-col border border-slate-300/80">
          
          {/* Top Glass Sheen Glare */}
          <div className="absolute top-0 right-0 w-full h-32 bg-gradient-to-b from-white/20 via-white/5 to-transparent pointer-events-none z-40" />

          {/* iOS Status Bar */}
          <div className="relative z-30 flex items-center justify-between px-7 pt-3.5 pb-1 text-slate-900 text-xs font-semibold select-none bg-slate-50/90 backdrop-blur-md">
            {/* iOS Clock */}
            <span className="tracking-tight text-[13px] font-bold text-slate-900 font-mono">
              {currentTime}
            </span>

            {/* iPhone Dynamic Island */}
            <div
              onClick={() => setIsExpandedIsland(!isExpandedIsland)}
              className={`absolute left-1/2 -translate-x-1/2 top-2.5 cursor-pointer transition-all duration-300 ease-out bg-black text-white rounded-full flex items-center justify-between px-3.5 shadow-md ${
                isExpandedIsland
                  ? "w-[280px] h-[44px] rounded-2xl p-2 z-50 bg-slate-950 border border-slate-800"
                  : alertNotification
                  ? "w-[210px] h-[30px] bg-red-950 border border-red-500/50"
                  : "w-[120px] h-[28px]"
              }`}
            >
              {isExpandedIsland ? (
                <div className="flex items-center justify-between w-full text-[11px] px-1 text-slate-200">
                  <div className="flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="font-medium">HillGuard AI</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectRole("home");
                      setIsExpandedIsland(false);
                    }}
                    className="bg-sky-500 hover:bg-sky-400 text-white px-2 py-0.5 rounded-full text-[10px] font-bold"
                  >
                    Switch Portal
                  </button>
                </div>
              ) : alertNotification ? (
                <div className="flex items-center justify-between w-full text-[10px]">
                  <div className="flex items-center gap-1 text-red-400 font-bold">
                    <Flame className="w-3 h-3 animate-pulse text-red-500" />
                    <span className="truncate max-w-[130px]">{alertNotification.title}</span>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                </div>
              ) : (
                <div className="flex items-center justify-between w-full relative">
                  {/* Camera lens cutout visual */}
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center">
                    <div className="w-1 h-1 rounded-full bg-sky-950" />
                  </div>
                  <span className="text-[10px] tracking-wide text-slate-300 font-mono font-bold">
                    {activeRole === "disaster" ? "NDRF OPS" : activeRole === "citizen" ? "CITIZEN" : "PORTAL"}
                  </span>
                  {/* Camera sensor dot */}
                  <div className="w-2 h-2 rounded-full bg-slate-900 border border-slate-800" />
                </div>
              )}
            </div>

            {/* iOS Right Status Icons (4 Bars, 5G, Wi-Fi, iOS Battery) */}
            <div className="flex items-center gap-1.5 text-slate-800">
              {isOffline ? (
                <div className="flex items-center gap-1 text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded-full text-[9px] font-bold">
                  <Plane className="w-2.5 h-2.5" />
                  <span>OFFLINE</span>
                </div>
              ) : (
                <>
                  {/* 4 iOS Signal Bars */}
                  <div className="flex items-end gap-[1.5px] h-2.5">
                    <div className="w-[2px] h-[3px] bg-slate-900 rounded-xs" />
                    <div className="w-[2px] h-[5px] bg-slate-900 rounded-xs" />
                    <div className="w-[2px] h-[7px] bg-slate-900 rounded-xs" />
                    <div className="w-[2px] h-[9px] bg-slate-900 rounded-xs" />
                  </div>
                  <span className="text-[10px] font-extrabold text-slate-800">5G</span>
                  <Wifi className="w-3.5 h-3.5 text-slate-900" />
                </>
              )}

              {/* iOS Battery Icon */}
              <div className="relative w-5 h-2.5 border border-slate-800 rounded-[3px] p-[1px] flex items-center">
                <div
                  className="h-full bg-slate-900 rounded-[1px]"
                  style={{ width: `${batteryLevel}%` }}
                />
                <div className="absolute -right-[3px] top-1/2 -translate-y-1/2 w-[1.5px] h-[3px] bg-slate-800 rounded-r-xs" />
              </div>
            </div>
          </div>

          {/* Active Banner when offline */}
          {isOffline && (
            <div className="bg-amber-500 text-amber-950 text-[10px] font-semibold px-3 py-0.5 flex items-center justify-between shrink-0 shadow-xs z-20">
              <span className="flex items-center gap-1">
                <Radio className="w-3 h-3 animate-spin" />
                Offline IndexedDB Queue Active
              </span>
              <button
                onClick={onToggleOffline}
                className="underline text-[10px] font-bold"
              >
                Go Online
              </button>
            </div>
          )}

          {/* Application Screen Content */}
          <div className="phone-screen flex-1 overflow-hidden bg-slate-50 relative flex flex-col text-slate-800">
            {children}
          </div>

          {/* iOS Bottom Home Bar Indicator */}
          <div className="h-6 bg-slate-50/90 backdrop-blur-md flex items-center justify-center shrink-0 pb-1.5 z-30">
            <div
              onClick={() => onSelectRole("home")}
              className="w-32 h-[4px] bg-slate-900/70 hover:bg-slate-900 active:scale-95 transition-all rounded-full cursor-pointer"
              title="Tap to return to Portal Home"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

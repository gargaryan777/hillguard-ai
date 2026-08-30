"use client";

import {
  LayoutDashboard,
  Map,
  FileText,
  Bell,
  MoreHorizontal,
  X,
} from "lucide-react";
import { useState } from "react";
import { type Route } from "@/lib/navigation-context";
import { useI18n } from "@/lib/i18n";

const TABS = [
  { id: "overview", labelKey: "nav.dashboard", icon: LayoutDashboard },
  { id: "risk-map", labelKey: "nav.riskMap", icon: Map },
  { id: "reports", labelKey: "nav.reports", icon: FileText },
  { id: "alerts", labelKey: "nav.alerts", icon: Bell },
] as const;

const MORE_ITEMS = [
  { id: "monitoring", labelKey: "nav.monitoring" },
  { id: "analytics", labelKey: "nav.analytics" },
  { id: "infrastructure", labelKey: "nav.infrastructure" },
] as const;

interface MobileNavProps {
  activeRoute: Route;
  onNavigate: (route: Route) => void;
}

export default function MobileNav({ activeRoute, onNavigate }: MobileNavProps) {
  const [showMore, setShowMore] = useState(false);
  const { t } = useI18n();

  return (
    <>
      <nav className="fixed bottom-0 inset-x-0 z-50 lg:hidden bg-slate-950/95 backdrop-blur-sm border-t border-slate-700/50 pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center justify-around h-16 px-2">
          {TABS.map((tab) => {
            const isActive = activeRoute === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onNavigate(tab.id)}
                className={`flex flex-col items-center justify-center gap-1 w-16 py-1 rounded-lg transition-colors ${
                  isActive ? "text-emerald-400" : "text-slate-500"
                }`}
              >
                <tab.icon size={20} />
                <span className="text-[10px] font-medium">{t(tab.labelKey)}</span>
              </button>
            );
          })}
          <button
            onClick={() => setShowMore(true)}
            className={`flex flex-col items-center justify-center gap-1 w-16 py-1 rounded-lg transition-colors ${
              MORE_ITEMS.some((i) => i.id === activeRoute)
                ? "text-emerald-400"
                : "text-slate-500"
            }`}
          >
            <MoreHorizontal size={20} />
            <span className="text-[10px] font-medium">More</span>
          </button>
        </div>
      </nav>

      {showMore && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setShowMore(false)}
          />
          <div className="absolute bottom-0 inset-x-0 bg-slate-900 border-t border-slate-700/50 rounded-t-2xl p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white">More</h3>
              <button
                onClick={() => setShowMore(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex flex-col gap-1">
              {MORE_ITEMS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    onNavigate(item.id);
                    setShowMore(false);
                  }}
                  className={`text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    activeRoute === item.id
                      ? "bg-slate-700/50 text-white"
                      : "text-slate-400 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  {t(item.labelKey)}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.25s ease-out;
        }
      `}</style>
    </>
  );
}

"use client";

import { Bell, Search, MapPin, Menu, Globe } from "lucide-react";
import { useEffect, useState } from "react";
import { useI18n, LANGUAGES, type Language } from "@/lib/i18n";

interface HeaderProps {
  onMenuToggle?: () => void;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export default function Header({ onMenuToggle }: HeaderProps) {
  const [now, setNow] = useState<Date | null>(null);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const { language, setLanguage } = useI18n();

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const currentLang = LANGUAGES.find((l) => l.code === language);

  return (
    <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-sm border-b border-slate-700/50">
      <div className="flex items-center justify-between h-16 px-4 lg:px-6">
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuToggle}
            className="lg:hidden p-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            aria-label="Toggle menu"
          >
            <Menu size={20} />
          </button>
          <div className="flex flex-col">
            <span className="text-base font-bold text-white tracking-tight">
              HILLGUARD AI
            </span>
            <span className="hidden sm:block text-[10px] text-slate-500 uppercase tracking-widest">
              Landslide Early Warning System
            </span>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-2 text-sm text-slate-400">
          <MapPin size={14} className="text-emerald-400" />
          <span>Sikkim, India</span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            className="p-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            aria-label="Search"
          >
            <Search size={18} />
          </button>

          <button
            className="relative p-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            aria-label="Notifications"
          >
            <Bell size={18} />
            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              3
            </span>
          </button>

          <div className="relative">
            <button
              onClick={() => setShowLangMenu(!showLangMenu)}
              className="flex items-center gap-1.5 p-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
              aria-label="Change language"
            >
              <Globe size={18} />
              <span className="hidden sm:inline text-xs font-medium">{currentLang?.nativeName || "EN"}</span>
            </button>
            {showLangMenu && (
              <div className="absolute right-0 top-full mt-1 w-44 rounded-lg border border-slate-700/50 bg-slate-800 py-1 shadow-xl z-50">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      setLanguage(lang.code);
                      setShowLangMenu(false);
                    }}
                    className={`w-full px-3 py-2 text-left text-sm transition-colors hover:bg-slate-700 flex items-center justify-between ${
                      language === lang.code ? "text-emerald-400 font-medium" : "text-slate-300"
                    }`}
                  >
                    <span>{lang.nativeName}</span>
                    <span className="text-xs text-slate-500">{lang.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-medium text-emerald-400">
              SYSTEM OPERATIONAL
            </span>
          </div>

          {now && (
            <div className="hidden lg:flex flex-col items-end text-xs text-slate-500">
              <span>{formatDate(now)}</span>
              <span className="text-slate-400">{formatTime(now)}</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

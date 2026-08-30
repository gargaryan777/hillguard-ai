"use client";

import {
  LayoutDashboard,
  Map,
  Activity,
  FileText,
  Bell,
  BarChart3,
  Building2,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { type ReactNode } from "react";
import { type Route, useNavigation } from "@/lib/navigation-context";
import { useI18n } from "@/lib/i18n";

const NAV_ITEMS = [
  { id: "overview", labelKey: "nav.dashboard", icon: LayoutDashboard },
  { id: "risk-map", labelKey: "nav.riskMap", icon: Map },
  { id: "monitoring", labelKey: "nav.monitoring", icon: Activity },
  { id: "reports", labelKey: "nav.reports", icon: FileText },
  { id: "alerts", labelKey: "nav.alerts", icon: Bell },
  { id: "analytics", labelKey: "nav.analytics", icon: BarChart3 },
  { id: "infrastructure", labelKey: "nav.infrastructure", icon: Building2 },
] as const;

interface SidebarProps {
  activeRoute: Route;
  onNavigate: (route: Route) => void;
  isCollapsed?: boolean;
}

export default function Sidebar({
  activeRoute,
  onNavigate,
  isCollapsed = false,
}: SidebarProps) {
  const { toggleSidebar } = useNavigation();
  const { t } = useI18n();

  return (
    <aside
      className={`hidden lg:flex flex-col h-screen bg-slate-950 border-r border-slate-700/50 transition-all duration-300 ease-in-out ${
        isCollapsed ? "w-[72px]" : "w-[240px]"
      }`}
    >
      <div className="flex-1 flex flex-col py-4">
        <nav className="flex flex-col gap-1 px-3">
          {NAV_ITEMS.map((item) => (
            <NavItem
              key={item.id}
              icon={<item.icon size={20} />}
              label={t(item.labelKey)}
              isActive={activeRoute === item.id}
              collapsed={isCollapsed}
              onClick={() => onNavigate(item.id)}
            />
          ))}
        </nav>
      </div>

      <div className="px-3 pb-4">
        <button
          onClick={toggleSidebar}
          className="flex items-center justify-center gap-2 w-full rounded-lg px-3 py-2.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <ChevronsRight size={20} /> : <ChevronsLeft size={20} />}
          {!isCollapsed && (
            <span className="text-sm font-medium">Collapse</span>
          )}
        </button>
      </div>
    </aside>
  );
}

function NavItem({
  icon,
  label,
  isActive,
  collapsed,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  isActive: boolean;
  collapsed: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors ${
        isActive
          ? "bg-slate-700/50 text-white"
          : "text-slate-400 hover:bg-slate-800 hover:text-white"
      }`}
      title={collapsed ? label : undefined}
    >
      <span className="shrink-0">{icon}</span>
      {!collapsed && (
        <span className="text-sm font-medium truncate">{label}</span>
      )}
    </button>
  );
}

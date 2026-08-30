"use client";

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";

type Route = "overview" | "risk-map" | "monitoring" | "reports" | "alerts" | "analytics" | "infrastructure";

const ROUTE_MAP: Record<string, Route> = {
  "/": "overview",
  "/dashboard": "overview",
  "/risk-map": "risk-map",
  "/monitoring": "monitoring",
  "/reports": "reports",
  "/alerts": "alerts",
  "/analytics": "analytics",
  "/infrastructure": "infrastructure",
};

const ROUTE_PATHS: Record<Route, string> = {
  overview: "/dashboard",
  "risk-map": "/risk-map",
  monitoring: "/monitoring",
  reports: "/reports",
  alerts: "/alerts",
  analytics: "/analytics",
  infrastructure: "/infrastructure",
};

function getRouteFromPath(path: string): Route {
  // Remove trailing slash, match against known routes
  const normalized = path.replace(/\/$/, "") || "/";
  return ROUTE_MAP[normalized] || "overview";
}

interface NavigationContextType {
  activeRoute: Route;
  navigate: (route: Route) => void;
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export function NavigationProvider({ children }: { children: ReactNode }) {
  // Initialize from current URL
  const [activeRoute, setActiveRoute] = useState<Route>(() => {
    if (typeof window !== "undefined") {
      return getRouteFromPath(window.location.pathname);
    }
    return "overview";
  });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const navigate = useCallback((route: Route) => {
    setActiveRoute(route);
    // Update URL without full page reload
    const path = ROUTE_PATHS[route];
    if (path && window.location.pathname !== path) {
      window.history.pushState({}, "", path);
    }
    window.scrollTo(0, 0);
  }, []);

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed((prev) => !prev);
  }, []);

  // Listen for browser back/forward
  useEffect(() => {
    const handlePopState = () => {
      const route = getRouteFromPath(window.location.pathname);
      setActiveRoute(route);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  return (
    <NavigationContext.Provider value={{ activeRoute, navigate, sidebarCollapsed, toggleSidebar }}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (!context) throw new Error("useNavigation must be used within NavigationProvider");
  return context;
}

export type { Route };

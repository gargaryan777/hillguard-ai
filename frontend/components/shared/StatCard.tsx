"use client";

import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: {
    value: number;
    isUp: boolean;
  };
}

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
}: StatCardProps) {
  return (
    <div className="group rounded-2xl border border-slate-700/50 bg-slate-900 p-6 transition-colors hover:border-slate-600/50">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            {title}
          </p>
          <p className="text-2xl font-bold text-white">{value}</p>
          {subtitle && (
            <p className="text-sm text-slate-500">{subtitle}</p>
          )}
        </div>
        {Icon && (
          <div className="rounded-lg bg-slate-800 p-2">
            <Icon className="h-5 w-5 text-slate-400" />
          </div>
        )}
      </div>
      {trend && (
        <div className="mt-3 flex items-center gap-1">
          {trend.isUp ? (
            <TrendingUp className="h-3.5 w-3.5 text-green-400" />
          ) : (
            <TrendingDown className="h-3.5 w-3.5 text-red-400" />
          )}
          <span
            className={`text-xs font-medium ${
              trend.isUp ? "text-green-400" : "text-red-400"
            }`}
          >
            {trend.isUp ? "+" : ""}
            {trend.value}%
          </span>
        </div>
      )}
    </div>
  );
}

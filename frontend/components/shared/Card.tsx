"use client";

import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  action?: ReactNode;
}

export default function Card({
  children,
  className = "",
  title,
  subtitle,
  action,
}: CardProps) {
  return (
    <div
      className={`rounded-2xl border border-slate-700/50 bg-slate-900 p-6 ${className}`}
    >
      {(title || action) && (
        <div className="mb-4 flex items-start justify-between">
          <div>
            {title && (
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
            )}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
}

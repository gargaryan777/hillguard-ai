"use client";

import { useEffect, useState } from "react";

interface GaugeProps {
  value: number;
  size?: number;
  label?: string;
  showValue?: boolean;
}

function getColor(value: number): string {
  if (value <= 30) return "#4ade80";
  if (value <= 50) return "#facc15";
  if (value <= 70) return "#fb923c";
  return "#f87171";
}

export default function Gauge({
  value,
  size = 120,
  label,
  showValue = true,
}: GaugeProps) {
  const [mounted, setMounted] = useState(false);
  const strokeWidth = size * 0.1;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const numeric = Number.isFinite(value) ? value : 0;
  const progress = Math.min(Math.max(numeric, 0), 100);
  const offset = circumference - (progress / 100) * circumference;
  const color = getColor(progress);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div className="inline-flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          className="-rotate-90"
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-slate-700/50"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={mounted ? offset : circumference}
            style={{
              transition: "stroke-dashoffset 1s ease-out, stroke 1s ease-out",
            }}
          />
        </svg>
        {showValue && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              className="font-bold text-white"
              style={{ fontSize: size * 0.22 }}
            >
              {Math.round(progress)}
            </span>
          </div>
        )}
      </div>
      {label && (
        <span className="text-xs font-medium text-slate-400">{label}</span>
      )}
    </div>
  );
}

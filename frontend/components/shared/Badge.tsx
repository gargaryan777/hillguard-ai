"use client";

interface BadgeProps {
  level: "critical" | "high" | "moderate" | "low" | "info";
  size?: "sm" | "md";
  className?: string;
}

const levelConfig: Record<
  BadgeProps["level"],
  { bg: string; dot: string; text: string; label: string }
> = {
  critical: {
    bg: "bg-red-500/10",
    dot: "bg-red-400",
    text: "text-red-400",
    label: "Critical",
  },
  high: {
    bg: "bg-orange-500/10",
    dot: "bg-orange-400",
    text: "text-orange-400",
    label: "High",
  },
  moderate: {
    bg: "bg-yellow-500/10",
    dot: "bg-yellow-400",
    text: "text-yellow-400",
    label: "Moderate",
  },
  low: {
    bg: "bg-green-500/10",
    dot: "bg-green-400",
    text: "text-green-400",
    label: "Low",
  },
  info: {
    bg: "bg-blue-500/10",
    dot: "bg-blue-400",
    text: "text-blue-400",
    label: "Info",
  },
};

export default function Badge({
  level,
  size = "sm",
  className = "",
}: BadgeProps) {
  const config = levelConfig[level];
  const sizeClasses = size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${config.bg} ${config.text} ${sizeClasses} ${className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}

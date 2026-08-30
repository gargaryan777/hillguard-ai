"use client";

interface ProgressBarProps {
  value: number;
  color?: "red" | "orange" | "yellow" | "green" | "blue";
  label?: string;
  showPercent?: boolean;
}

const colorMap: Record<string, string> = {
  red: "bg-red-400",
  orange: "bg-orange-400",
  yellow: "bg-yellow-400",
  green: "bg-green-400",
  blue: "bg-blue-400",
};

export default function ProgressBar({
  value,
  color = "blue",
  label,
  showPercent = false,
}: ProgressBarProps) {
  const clamped = Math.min(Math.max(value, 0), 100);

  return (
    <div className="w-full">
      {(label || showPercent) && (
        <div className="mb-1 flex items-center justify-between">
          {label && (
            <span className="text-xs font-medium text-slate-400">{label}</span>
          )}
          {showPercent && (
            <span className="text-xs font-medium text-slate-400">
              {Math.round(clamped)}%
            </span>
          )}
        </div>
      )}
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-700/50">
        <div
          className={`h-full rounded-full ${colorMap[color]}`}
          style={{
            width: `${clamped}%`,
            transition: "width 1s ease-out",
          }}
        />
      </div>
    </div>
  );
}

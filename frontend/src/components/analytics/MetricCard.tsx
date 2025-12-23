"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    trend: "up" | "down" | "neutral";
  };
  icon?: React.ReactNode;
  description?: string;
  className?: string;
}

export function MetricCard({
  title,
  value,
  change,
  icon,
  description,
  className,
}: MetricCardProps) {
  return (
    <div
      className={cn(
        "p-6 rounded-xl border bg-card text-card-foreground shadow-sm",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold tracking-tight">{value}</p>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
        {icon && (
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            {icon}
          </div>
        )}
      </div>

      {change && (
        <div className="mt-4 flex items-center gap-1">
          <span
            className={cn(
              "text-sm font-medium",
              change.trend === "up" && "text-green-600",
              change.trend === "down" && "text-red-600",
              change.trend === "neutral" && "text-muted-foreground"
            )}
          >
            {change.trend === "up" && "↑"}
            {change.trend === "down" && "↓"}
            {change.trend === "neutral" && "→"}
            {" "}
            {Math.abs(change.value)}%
          </span>
          <span className="text-xs text-muted-foreground">vs last week</span>
        </div>
      )}
    </div>
  );
}

export default MetricCard;

"use client";

import React, { useState, useEffect } from "react";
import { Wifi, WifiOff, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

// WebSocket connection state type
type ConnectionState = "connecting" | "connected" | "disconnected" | "error";

// Simulated connection status for demo purposes
// In production, this would be connected to actual WebSocket service
function useWebSocketConnection(projectId: string) {
  const [connectionState, setConnectionState] = useState<ConnectionState>("connecting");

  useEffect(() => {
    // Simulate connection process
    const timer = setTimeout(() => {
      setConnectionState("connected");
    }, 1500);

    return () => clearTimeout(timer);
  }, [projectId]);

  return connectionState;
}

// Connection Status Indicator Component
export function ConnectionStatusIndicator({
  projectId,
  className,
}: {
  projectId?: string;
  className?: string;
}) {
  const connectionState = useWebSocketConnection(projectId || "default");

  const getStatusConfig = () => {
    switch (connectionState) {
      case "connecting":
        return {
          icon: Loader2,
          label: "连接中",
          color: "text-yellow-500",
          bgColor: "bg-yellow-500/10",
          animate: true,
        };
      case "connected":
        return {
          icon: Wifi,
          label: "已连接",
          color: "text-green-500",
          bgColor: "bg-green-500/10",
          animate: false,
        };
      case "disconnected":
        return {
          icon: WifiOff,
          label: "已断开",
          color: "text-gray-500",
          bgColor: "bg-gray-500/10",
          animate: false,
        };
      case "error":
        return {
          icon: WifiOff,
          label: "连接错误",
          color: "text-red-500",
          bgColor: "bg-red-500/10",
          animate: false,
        };
      default:
        return {
          icon: WifiOff,
          label: "未知",
          color: "text-gray-500",
          bgColor: "bg-gray-500/10",
          animate: false,
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-2 py-1 rounded-md",
        config.bgColor,
        className
      )}
    >
      <Icon
        className={cn("h-4 w-4", config.color, config.animate && "animate-spin")}
      />
      <span className={cn("text-xs font-medium", config.color)}>
        {config.label}
      </span>
    </div>
  );
}

// Re-export for convenience
export type { ConnectionState };

"use client";

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";

export type ConnectionStatus = "connecting" | "connected" | "disconnected" | "reconnecting" | "error";

interface WebSocketMessage {
  type: string;
  payload?: any;
  timestamp?: number;
}

interface WebSocketContextType {
  isConnected: boolean;
  connectionStatus: ConnectionStatus;
  lastMessage: WebSocketMessage | null;
  sendMessage: (type: string, payload?: any) => void;
  subscribe: (eventType: string, callback: (message: WebSocketMessage) => void) => () => void;
  reconnect: () => void;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error("useWebSocket must be used within a WebSocketProvider");
  }
  return context;
}

interface WebSocketProviderProps {
  children: React.ReactNode;
  url?: string;
  autoConnect?: boolean;
  reconnectAttempts?: number;
  reconnectDelay?: number;
  maxReconnectDelay?: number;
}

export function WebSocketProvider({
  children,
  url,
  autoConnect = true,
  reconnectAttempts = 5,
  reconnectDelay = 1000,
  maxReconnectDelay = 30000,
}: WebSocketProviderProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("disconnected");
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectCountRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const subscribersRef = useRef<Map<string, Set<(message: WebSocketMessage) => void>>>(new Map());

  // Calculate exponential backoff delay
  const getReconnectDelay = useCallback((attempt: number) => {
    const delay = Math.min(reconnectDelay * Math.pow(2, attempt), maxReconnectDelay);
    return delay + Math.random() * 1000; // Add jitter
  }, [reconnectDelay, maxReconnectDelay]);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  // Send message through WebSocket
  const sendMessage = useCallback((type: string, payload?: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const message: WebSocketMessage = {
        type,
        payload,
        timestamp: Date.now(),
      };
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn("WebSocket is not connected. Message not sent:", type);
    }
  }, []);

  // Subscribe to specific event types
  const subscribe = useCallback((eventType: string, callback: (message: WebSocketMessage) => void) => {
    if (!subscribersRef.current.has(eventType)) {
      subscribersRef.current.set(eventType, new Set());
    }
    subscribersRef.current.get(eventType)?.add(callback);

    // Return unsubscribe function
    return () => {
      subscribersRef.current.get(eventType)?.delete(callback);
    };
  }, []);

  // Handle incoming messages
  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const message: WebSocketMessage = JSON.parse(event.data);
      setLastMessage(message);

      // Notify subscribers
      const callbacks = subscribersRef.current.get(message.type);
      if (callbacks) {
        callbacks.forEach((callback) => callback(message));
      }

      // Also notify wildcard subscribers
      const wildcardCallbacks = subscribersRef.current.get("*");
      if (wildcardCallbacks) {
        wildcardCallbacks.forEach((callback) => callback(message));
      }
    } catch (error) {
      console.error("Failed to parse WebSocket message:", error);
    }
  }, []);

  // Handle connection open
  const handleOpen = useCallback(() => {
    setIsConnected(true);
    setConnectionStatus("connected");
    reconnectCountRef.current = 0;

    // Start heartbeat
    heartbeatIntervalRef.current = setInterval(() => {
      sendMessage("ping", { timestamp: Date.now() });
    }, 30000);
  }, [sendMessage]);

  // Handle connection close
  const handleClose = useCallback(() => {
    setIsConnected(false);
    setConnectionStatus("disconnected");

    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }

    // Attempt reconnection if we haven't exceeded the limit
    if (reconnectCountRef.current < reconnectAttempts) {
      setConnectionStatus("reconnecting");
      const delay = getReconnectDelay(reconnectCountRef.current);
      reconnectCountRef.current++;

      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, delay);
    } else {
      setConnectionStatus("error");
    }
  }, [reconnectAttempts, getReconnectDelay]);

  // Handle errors
  const handleError = useCallback((error: Event) => {
    console.error("WebSocket error:", error);
    setConnectionStatus("error");
  }, []);

  // Connect to WebSocket server
  const connect = useCallback(() => {
    cleanup();

    // Use environment variable or default URL
    const wsUrl = url || process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8080";

    try {
      setConnectionStatus("connecting");
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = handleOpen;
      ws.onclose = handleClose;
      ws.onerror = handleError;
      ws.onmessage = handleMessage;
    } catch (error) {
      console.error("Failed to create WebSocket connection:", error);
      setConnectionStatus("error");
    }
  }, [url, cleanup, handleOpen, handleClose, handleError, handleMessage]);

  // Manual reconnect
  const reconnect = useCallback(() => {
    reconnectCountRef.current = 0;
    connect();
  }, [connect]);

  // Initial connection
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      cleanup();
    };
  }, [autoConnect, connect, cleanup]);

  // Notify about connection status changes
  useEffect(() => {
    if (connectionStatus !== "connected" && connectionStatus !== "disconnected") return;

    const callbacks = subscribersRef.current.get("connection:status");
    if (callbacks) {
      callbacks.forEach((callback) => {
        callback({
          type: "connection:status",
          payload: { status: connectionStatus, isConnected },
          timestamp: Date.now(),
        });
      });
    }
  }, [connectionStatus, isConnected]);

  const value: WebSocketContextType = {
    isConnected,
    connectionStatus,
    lastMessage,
    sendMessage,
    subscribe,
    reconnect,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}

// Connection status indicator component
export function ConnectionStatusIndicator() {
  const { isConnected, connectionStatus, reconnect } = useWebSocket();

  const statusConfig = {
    connecting: { color: "bg-yellow-500", label: "Connecting..." },
    connected: { color: "bg-green-500", label: "Connected" },
    disconnected: { color: "bg-gray-500", label: "Disconnected" },
    reconnecting: { color: "bg-yellow-500", label: "Reconnecting..." },
    error: { color: "bg-red-500", label: "Connection Error" },
  };

  const config = statusConfig[connectionStatus];

  return (
    <div className="flex items-center gap-2">
      <div
        className={`w-2 h-2 rounded-full ${config.color} animate-pulse`}
      />
      <span className="text-xs text-muted-foreground">{config.label}</span>
      {(connectionStatus === "error" || connectionStatus === "disconnected") && (
        <button
          onClick={reconnect}
          className="text-xs text-primary hover:underline"
        >
          Retry
        </button>
      )}
    </div>
  );
}

export default WebSocketProvider;

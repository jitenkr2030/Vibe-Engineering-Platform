"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";
import { Play, Pause, Trash2, Download, Copy, Check, Settings, Maximize2, Minimize2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useWebSocket } from "@/services/websocket.service";

interface WebTerminalProps {
  projectId?: string;
  initialCommand?: string;
  height?: string;
  className?: string;
  onOutput?: (output: string) => void;
  onCommand?: (command: string) => void;
}

export function WebTerminal({
  projectId,
  initialCommand,
  height = "400px",
  className,
  onOutput,
  onCommand,
}: WebTerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const { sendMessage, subscribe, isConnected } = useWebSocket();

  // Initialize terminal
  useEffect(() => {
    if (!terminalRef.current) return;

    // Create terminal instance
    const term = new Terminal({
      cursorBlink: true,
      cursorStyle: "bar",
      fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
      fontSize: 14,
      lineHeight: 1.4,
      theme: {
        background: "#0a0a0f",
        foreground: "#e0e0e0",
        cursor: "#00ff00",
        cursorAccent: "#0a0a0f",
        selectionBackground: "#333344",
        black: "#1a1a2e",
        red: "#ff5555",
        green: "#50fa7b",
        yellow: "#f1fa8c",
        blue: "#bd93f9",
        magenta: "#ff79c6",
        cyan: "#8be9fd",
        white: "#f8f8f2",
        brightBlack: "#6272a4",
        brightRed: "#ff6e6e",
        brightGreen: "#69ff94",
        brightYellow: "#ffffa5",
        brightBlue: "#d6acff",
        brightMagenta: "#ff92df",
        brightCyan: "#a4ffff",
        brightWhite: "#ffffff",
      },
      allowProposedApi: true,
    });

    // Add fit addon for responsive resizing
    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(terminalRef.current);
    fitAddon.fit();

    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    // Write welcome message
    term.writeln("\x1b[1;34m╔════════════════════════════════════════════════════════════╗\x1b[0m");
    term.writeln("\x1b[1;34m║\x1b[0m  \x1b[1;36mVibe Engineering Platform - Terminal\x1b[0m                      \x1b[1;34m║\x1b[0m");
    term.writeln("\x1b[1;34m║\x1b[0m  Type 'help' for available commands                        \x1b[1;34m║\x1b[0m");
    term.writeln("\x1b[1;34m╚════════════════════════════════════════════════════════════╝\x1b[0m");
    term.writeln("");

    // Handle user input
    term.onData((data) => {
      sendMessage("term:input", {
        data,
        projectId,
      });
    });

    // Focus the terminal on click
    term.element?.addEventListener("click", () => {
      term.focus();
    });

    // Resize observer for responsive sizing
    const resizeObserver = new ResizeObserver(() => {
      if (fitAddonRef.current) {
        fitAddonRef.current.fit();
      }
    });
    resizeObserver.observe(terminalRef.current);

    return () => {
      resizeObserver.disconnect();
      term.dispose();
    };
  }, [projectId, sendMessage]);

  // Subscribe to terminal output
  useEffect(() => {
    if (!xtermRef.current) return;

    const unsubscribeOutput = subscribe("term:output", (message) => {
      if (message.payload?.data) {
        xtermRef.current?.write(message.payload.data);
        setHistory((prev) => [...prev, message.payload.data]);
        onOutput?.(message.payload.data);
      }
    });

    const unsubscribeStatus = subscribe("term:status", (message) => {
      setIsRunning(message.payload?.running ?? false);
    });

    return () => {
      unsubscribeOutput();
      unsubscribeStatus();
    };
  }, [subscribe, onOutput]);

  // Handle initial command
  useEffect(() => {
    if (initialCommand && xtermRef.current) {
      xtermRef.current.write(initialCommand + "\r\n");
      onCommand?.(initialCommand);
    }
  }, [initialCommand, onCommand]);

  // Send command
  const sendCommand = useCallback((command: string) => {
    if (xtermRef.current) {
      xtermRef.current.write(command + "\r\n");
      sendMessage("term:input", {
        data: command + "\r\n",
        projectId,
      });
      onCommand?.(command);
    }
  }, [sendMessage, projectId, onCommand]);

  // Clear terminal
  const clearTerminal = useCallback(() => {
    if (xtermRef.current) {
      xtermRef.current.clear();
      setHistory([]);
    }
  }, []);

  // Copy output
  const copyOutput = useCallback(async () => {
    const output = history.join("");
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [history]);

  // Download output
  const downloadOutput = useCallback(() => {
    const output = history.join("");
    const blob = new Blob([output], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `terminal-output-${new Date().toISOString()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [history]);

  // Common commands for quick access
  const quickCommands = [
    { label: "ls", command: "ls -la" },
    { label: "pwd", command: "pwd" },
    { label: "git status", command: "git status" },
    { label: "npm test", command: "npm test" },
  ];

  return (
    <div
      className={cn(
        "flex flex-col border rounded-lg overflow-hidden bg-background",
        isExpanded && "fixed inset-4 z-50",
        className
      )}
    >
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/50">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Terminal</span>
          <div
            className={cn(
              "w-2 h-2 rounded-full",
              isConnected ? "bg-green-500" : "bg-red-500"
            )}
          />
          <span className="text-xs text-muted-foreground">
            {isConnected ? "Connected" : "Disconnected"}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {/* Quick Commands */}
          {quickCommands.map((qc) => (
            <Button
              key={qc.label}
              variant="ghost"
              size="sm"
              onClick={() => sendCommand(qc.command)}
              className="text-xs"
            >
              {qc.label}
            </Button>
          ))}

          <div className="w-px h-4 bg-border mx-2" />

          {/* Actions */}
          <Button variant="ghost" size="icon" onClick={copyOutput} className="h-8 w-8">
            {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={clearTerminal} className="h-8 w-8">
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={downloadOutput} className="h-8 w-8">
            <Download className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-8 w-8"
          >
            {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
          {isExpanded && (
            <Button variant="ghost" size="icon" onClick={() => setIsExpanded(false)} className="h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Terminal Area */}
      <div
        ref={terminalRef}
        className="flex-1 overflow-hidden"
        style={{ height: isExpanded ? "calc(100% - 50px)" : height }}
      />

      {/* Status Bar */}
      <div className="flex items-center justify-between px-3 py-1 border-t bg-muted/30 text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <span>Rows: {xtermRef.current?.rows || 24}</span>
          <span>Cols: {xtermRef.current?.cols || 80}</span>
        </div>
        <div className="flex items-center gap-2">
          <span>Ctrl+C to interrupt</span>
          <span>Ctrl+D to exit</span>
        </div>
      </div>
    </div>
  );
}

export default WebTerminal;

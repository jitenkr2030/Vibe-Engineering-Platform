"use client";

import React, { useState, useCallback } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { Code2, Terminal, GitBranch, Settings, Play, Save, RefreshCw, ChevronLeft, ChevronRight, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { FileExplorer, type FileNode } from "./FileExplorer";
import { CodeEditor } from "@/components/editor/CodeEditor";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { WebTerminal } from "@/components/terminal/WebTerminal";
import { DiffViewer } from "@/components/editor/DiffViewer";
import { ConnectionStatusIndicator } from "@/components/services/websocket.service";

// Types
export interface OpenTab {
  id: string;
  path: string;
  name: string;
  content: string;
  originalContent?: string;
  language: string;
  isDirty: boolean;
  isDiff?: boolean;
  diffOriginal?: string;
}

interface IDELayoutProps {
  projectId: string;
  projectName: string;
  className?: string;
}

// Custom hook for IDE state
function useIDEState(projectId: string) {
  const [openTabs, setOpenTabs] = useState<OpenTab[]>([]);
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [terminalVisible, setTerminalVisible] = useState(true);
  const [rightPanelVisible, setRightPanelVisible] = useState(true);

  // Get active tab object
  const activeTabData = openTabs.find((tab) => tab.id === activeTab);

  // Open a file
  const openFile = useCallback(async (path: string, name: string) => {
    // Check if already open
    const existingTab = openTabs.find((tab) => tab.path === path);
    if (existingTab) {
      setActiveTab(existingTab.id);
      setFileContent(existingTab.content);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `/api/v1/files/content/${projectId}?path=${encodeURIComponent(path)}`
      );
      const data = await response.json();

      if (data.success) {
        const newTab: OpenTab = {
          id: `tab-${Date.now()}`,
          path,
          name,
          content: data.data.content,
          language: getLanguageFromPath(path),
          isDirty: false,
        };

        setOpenTabs((prev) => [...prev, newTab]);
        setActiveTab(newTab.id);
        setFileContent(data.data.content);
      }
    } catch (error) {
      console.error("Error opening file:", error);
    } finally {
      setLoading(false);
    }
  }, [projectId, openTabs]);

  // Close a tab
  const closeTab = useCallback((tabId: string) => {
    setOpenTabs((prev) => {
      const filtered = prev.filter((tab) => tab.id !== tabId);
      // If we closed the active tab, switch to another
      if (activeTab === tabId && filtered.length > 0) {
        setActiveTab(filtered[filtered.length - 1].id);
        setFileContent(filtered[filtered.length - 1].content);
      } else if (filtered.length === 0) {
        setActiveTab(null);
        setFileContent("");
      }
      return filtered;
    });
  }, [activeTab]);

  // Save current file
  const saveFile = useCallback(async () => {
    if (!activeTabData) return;

    try {
      const response = await fetch(`/api/v1/files/save/${projectId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: activeTabData.path,
          content: fileContent,
        }),
      });

      if (response.ok) {
        setOpenTabs((prev) =>
          prev.map((tab) =>
            tab.id === activeTab ? { ...tab, content: fileContent, isDirty: false } : tab
          )
        );
      }
    } catch (error) {
      console.error("Error saving file:", error);
    }
  }, [projectId, activeTabData, fileContent]);

  // Update file content
  const updateContent = useCallback((newContent: string) => {
    setFileContent(newContent);
    setOpenTabs((prev) =>
      prev.map((tab) =>
        tab.id === activeTab ? { ...tab, content: newContent, isDirty: true } : tab
      )
    );
  }, [activeTab]);

  // Get language from file path
  const getLanguage = useCallback(() => {
    if (!activeTabData) return "typescript";
    return activeTabData.language;
  }, [activeTabData]);

  return {
    openTabs,
    activeTab,
    activeTabData,
    fileContent,
    loading,
    terminalVisible,
    rightPanelVisible,
    openFile,
    closeTab,
    saveFile,
    updateContent,
    setTerminalVisible,
    setRightPanelVisible,
    getLanguage,
  };
}

// Helper function to get language from file path
function getLanguageFromPath(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase();
  const languageMap: Record<string, string> = {
    ts: "typescript",
    tsx: "typescript",
    js: "javascript",
    jsx: "javascript",
    py: "python",
    rb: "ruby",
    go: "go",
    rs: "rust",
    java: "java",
    json: "json",
    md: "markdown",
    html: "html",
    css: "css",
    scss: "scss",
    sql: "sql",
    yaml: "yaml",
    yml: "yaml",
    xml: "xml",
    sh: "bash",
    bash: "bash",
    zsh: "bash",
  };
  return languageMap[ext || ""] || "typescript";
}

export function IDELayout({ projectId, projectName, className }: IDELayoutProps) {
  const {
    openTabs,
    activeTab,
    activeTabData,
    fileContent,
    loading,
    terminalVisible,
    rightPanelVisible,
    openFile,
    closeTab,
    saveFile,
    updateContent,
    setTerminalVisible,
    setRightPanelVisible,
    getLanguage,
  } = useIDEState(projectId);

  return (
    <div className={cn("flex flex-col h-full bg-background", className)}>
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/30">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="font-semibold text-sm">{projectName}</h1>
            <p className="text-xs text-muted-foreground">ID: {projectId}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ConnectionStatusIndicator />
          <div className="w-px h-6 bg-border mx-2" />
          <Button variant="outline" size="sm" onClick={saveFile} disabled={!activeTabData?.isDirty}>
            <Save className="mr-2 h-4 w-4" />
            Save
          </Button>
          <Button variant="default" size="sm">
            <Play className="mr-2 h-4 w-4" />
            Run
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setTerminalVisible(!terminalVisible)}>
            <Terminal className={cn("h-4 w-4", terminalVisible && "text-primary")} />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setRightPanelVisible(!rightPanelVisible)}>
            <Code2 className={cn("h-4 w-4", rightPanelVisible && "text-primary")} />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <PanelGroup direction="horizontal">
          {/* Left Sidebar - File Explorer */}
          <Panel defaultSize={15} minSize={10} maxSize={25}>
            <FileExplorer onFileSelect={(path) => openFile(path, path.split("/").pop() || path)} />
          </Panel>

          <PanelResizeHandle className="w-1 bg-border hover:bg-primary/50 transition-colors" />

          {/* Center - Editor */}
          <Panel defaultSize={55} minSize={30}>
            <div className="flex flex-col h-full">
              {/* Tab Bar */}
              {openTabs.length > 0 && (
                <div className="flex items-center px-2 border-b bg-muted/20 overflow-x-auto">
                  {openTabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 text-sm border-r border-l first:border-l-0 rounded-t transition-colors",
                        activeTab === tab.id
                          ? "bg-background border-t border-t-primary"
                          : "hover:bg-muted/50"
                      )}
                    >
                      <span className={cn(tab.isDirty && "text-muted-foreground")}>
                        {tab.name}
                      </span>
                      {tab.isDirty && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          closeTab(tab.id);
                        }}
                        className="ml-1 p-0.5 rounded hover:bg-muted"
                      >
                        ×
                      </button>
                    </button>
                  ))}
                </div>
              )}

              {/* Editor Area */}
              <div className="flex-1 overflow-hidden">
                {activeTabData ? (
                  <CodeEditor
                    code={fileContent}
                    language={getLanguage()}
                    onChange={updateContent}
                    onSave={saveFile}
                    height="100%"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <div className="text-center">
                      <Code2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Select a file to start editing</p>
                      <p className="text-sm mt-1">Or create a new file from the sidebar</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Terminal Panel */}
              {terminalVisible && (
                <>
                  <PanelResizeHandle className="h-1 bg-border hover:bg-primary/50 transition-colors" />
                  <Panel defaultSize={25} minSize={10} maxSize={40}>
                    <div className="h-full flex flex-col border-t bg-muted/10">
                      <div className="flex items-center justify-between px-3 py-1.5 border-b bg-muted/20">
                        <span className="text-xs font-medium">Terminal</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => setTerminalVisible(false)}
                        >
                          ×
                        </Button>
                      </div>
                      <div className="flex-1">
                        <WebTerminal projectId={projectId} height="100%" />
                      </div>
                    </div>
                  </Panel>
                </>
              )}
            </div>
          </Panel>

          {/* Right Panel - Chat */}
          {rightPanelVisible && (
            <>
              <PanelResizeHandle className="w-1 bg-border hover:bg-primary/50 transition-colors" />
              <Panel defaultSize={30} minSize={20} maxSize={50}>
                <ChatInterface className="h-full border-l" />
              </Panel>
            </>
          )}
        </PanelGroup>
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between px-4 py-1 border-t bg-muted/30 text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <span>Ln 1, Col 1</span>
          <span>UTF-8</span>
          <span>{activeTabData?.language || "Plain Text"}</span>
        </div>
        <div className="flex items-center gap-4">
          <span>{openTabs.length} files open</span>
          <span>Prettier: Enabled</span>
          <span>Git: main</span>
        </div>
      </div>
    </div>
  );
}

export default IDELayout;

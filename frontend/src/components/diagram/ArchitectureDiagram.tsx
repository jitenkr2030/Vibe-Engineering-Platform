"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import mermaid from "mermaid";
import {
  RefreshCw,
  Download,
  Edit3,
  Eye,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Copy,
  Check,
  Wand2,
  FolderTree,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface DiagramVisualizerProps {
  projectPath?: string;
  initialDiagram?: string;
  className?: string;
  onGenerate?: (fileStructure: any) => string;
}

type DiagramType =
  | "architecture"
  | "flowchart"
  | "class-diagram"
  | "sequence"
  | "er-diagram"
  | "state-diagram";

const diagramTypeLabels: Record<DiagramType, string> = {
  architecture: "Architecture Overview",
  flowchart: "Flowchart",
  "class-diagram": "Class Diagram",
  sequence: "Sequence Diagram",
  "er-diagram": "ER Diagram",
  "state-diagram": "State Diagram",
};

// Default architecture diagram template
const defaultArchitectureDiagram = `graph TB
    subgraph Frontend
        UI[React Components] --> State[State Management]
        State --> Router[React Router]
    end
    
    subgraph Backend
        API[API Layer] --> Services[Business Logic]
        Services --> Database[(Database)]
        Services --> Cache[(Redis Cache)]
    end
    
    UI --> API
    API --> Auth[Authentication]
    Auth --> JWT[JWT Tokens]
    
    style Frontend fill:#e3f2fd,stroke:#1976d2
    style Backend fill:#f3e5f5,stroke:#7b1fa2
    style Database fill:#fff3e0,stroke:#f57c00`;

export function ArchitectureDiagramVisualizer({
  projectPath,
  initialDiagram,
  className,
  onGenerate,
}: DiagramVisualizerProps) {
  const diagramRef = useRef<HTMLDivElement>(null);
  const [diagramCode, setDiagramCode] = useState(initialDiagram || defaultArchitectureDiagram);
  const [diagramType, setDiagramType] = useState<DiagramType>("architecture");
  const [isEditing, setIsEditing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isValid, setIsValid] = useState(true);
  const [copied, setCopied] = useState(false);
  const [zoom, setZoom] = useState(1);

  // Initialize Mermaid
  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: "dark",
      securityLevel: "loose",
      fontFamily: "'JetBrains Mono', 'Fira Code', sans-serif",
      flowchart: {
        useMaxWidth: true,
        htmlLabels: true,
        curve: "basis",
      },
      themeVariables: {
        primaryColor: "#3b82f6",
        primaryTextColor: "#e0e0e0",
        primaryBorderColor: "#60a5fa",
        lineColor: "#6b7280",
        secondaryColor: "#10b981",
        tertiaryColor: "#1f2937",
      },
    });
  }, []);

  // Render diagram when code changes
  useEffect(() => {
    if (!diagramRef.current || isEditing) return;

    const renderDiagram = async () => {
      try {
        const { svg } = await mermaid.render(`mermaid-${Date.now()}`, diagramCode);
        if (diagramRef.current) {
          diagramRef.current.innerHTML = svg;
          setIsValid(true);
        }
      } catch (error) {
        console.error("Failed to render diagram:", error);
        setIsValid(false);
        if (diagramRef.current) {
          diagramRef.current.innerHTML = `
            <div class="flex flex-col items-center justify-center h-full text-red-400">
              <p class="text-lg font-medium">Invalid Diagram Syntax</p>
              <p class="text-sm text-muted-foreground mt-2">Please check your mermaid code</p>
            </div>
          `;
        }
      }
    };

    renderDiagram();
  }, [diagramCode, isEditing]);

  // Handle diagram generation from file structure
  const handleGenerateDiagram = useCallback(async () => {
    setIsGenerating(true);

    try {
      // Simulate file structure analysis
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Generate diagram based on type
      let generatedCode = "";
      switch (diagramType) {
        case "architecture":
          generatedCode = generateArchitectureDiagram();
          break;
        case "flowchart":
          generatedCode = generateFlowchart();
          break;
        case "class-diagram":
          generatedCode = generateClassDiagram();
          break;
        case "sequence":
          generatedCode = generateSequenceDiagram();
          break;
        default:
          generatedCode = generateArchitectureDiagram();
      }

      setDiagramCode(generatedCode);
    } catch (error) {
      console.error("Failed to generate diagram:", error);
    } finally {
      setIsGenerating(false);
    }
  }, [diagramType]);

  // Copy diagram code
  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(diagramCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [diagramCode]);

  // Download diagram
  const handleDownload = useCallback(() => {
    if (!diagramRef.current) return;

    const svg = diagramRef.current.innerHTML;
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `diagram-${diagramType}-${Date.now()}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  }, [diagramCode, diagramType]);

  // Zoom controls
  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.2, 2));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.2, 0.5));
  const handleResetZoom = () => setZoom(1);

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-background">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold">Architecture Diagram</h2>
          <Select
            value={diagramType}
            onValueChange={(value) => setDiagramType(value as DiagramType)}
          >
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(diagramTypeLabels).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          {/* Zoom Controls */}
          <div className="flex items-center gap-1 mr-4">
            <Button variant="ghost" size="icon" onClick={handleZoomOut} className="h-8 w-8">
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleResetZoom} className="h-8 w-8">
              <span className="text-xs">{Math.round(zoom * 100)}%</span>
            </Button>
            <Button variant="ghost" size="icon" onClick={handleZoomIn} className="h-8 w-8">
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>

          {/* Edit/View Toggle */}
          <Button
            variant={isEditing ? "default" : "outline"}
            size="sm"
            onClick={() => setIsEditing(!isEditing)}
          >
            {isEditing ? (
              <>
                <Eye className="mr-2 h-4 w-4" />
                Preview
              </>
            ) : (
              <>
                <Edit3 className="mr-2 h-4 w-4" />
                Edit
              </>
            )}
          </Button>

          {/* Generate Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerateDiagram}
            disabled={isGenerating}
          >
            <Wand2 className={cn("mr-2 h-4 w-4", isGenerating && "animate-spin")} />
            {isGenerating ? "Generating..." : "Generate"}
          </Button>

          {/* Copy Button */}
          <Button variant="ghost" size="icon" onClick={handleCopy}>
            {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
          </Button>

          {/* Download Button */}
          <Button variant="ghost" size="icon" onClick={handleDownload}>
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {isEditing ? (
          /* Edit Mode */
          <div className="flex-1 flex flex-col">
            <div className="flex-1 p-4">
              <Textarea
                value={diagramCode}
                onChange={(e) => setDiagramCode(e.target.value)}
                className="h-full font-mono text-sm resize-none"
                placeholder="Enter Mermaid diagram code..."
              />
            </div>
            <div className="px-4 py-2 border-t text-xs text-muted-foreground">
              Use Mermaid syntax. See{" "}
              <a
                href="https://mermaid.js.org/intro/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                mermaid.js.org
              </a>{" "}
              for documentation.
            </div>
          </div>
        ) : (
          /* Preview Mode */
          <div className="flex-1 overflow-auto p-4">
            <div
              ref={diagramRef}
              className={cn(
                "transition-transform duration-200",
                !isValid && "flex items-center justify-center"
              )}
              style={{ transform: `scale(${zoom})`, transformOrigin: "top left" }}
            />
          </div>
        )}

        {/* Sidebar */}
        <Card className="w-80 ml-4 flex flex-col">
          <CardHeader className="py-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FolderTree className="h-4 w-4" />
              File Structure
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto py-0">
            <div className="text-sm text-muted-foreground">
              <div className="space-y-1">
                {[
                  { name: "src", type: "folder", children: ["components", "pages", "utils", "hooks"] },
                  { name: "public", type: "folder", children: ["index.html", "assets"] },
                  { name: "tests", type: "folder", children: ["unit", "integration"] },
                  { name: "package.json", type: "file" },
                  { name: "tsconfig.json", type: "file" },
                  { name: "README.md", type: "file" },
                ].map((item) => (
                  <div
                    key={item.name}
                    className="flex items-center gap-2 py-1 px-2 hover:bg-muted/50 rounded"
                  >
                    <span>{item.type === "folder" ? "📁" : "📄"}</span>
                    <span className="font-mono text-xs">{item.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Diagram generation helper functions
function generateArchitectureDiagram(): string {
  return `graph TB
    subgraph Frontend["Frontend Layer"]
        UI["React Components"] --> State["State Management"]
        State --> Router["React Router"]
        UI --> API["HTTP Client"]
    end
    
    subgraph Backend["Backend Layer"]
        Controller["Controllers"] --> Service["Services"]
        Service --> Model["Models"]
        Model --> DB[(PostgreSQL)]
        Service --> Cache[(Redis)]
    end
    
    subgraph Auth["Authentication"]
        JWT["JWT Tokens"]
        OAuth["OAuth 2.0"]
    end
    
    API --> Controller
    API --> Auth
    Auth --> JWT
    
    style Frontend fill:#1e3a5f,stroke:#3b82f6
    style Backend fill:#2d1f4f,stroke:#8b5cf6
    style Auth fill:#1f3f1f,stroke:#22c55e`;
}

function generateFlowchart(): string {
  return `flowchart TD
    A[User Request] --> B{Authenticated?}
    B -->|Yes| C[Check Permissions]
    B -->|No| D[Redirect to Login]
    D --> E[User Logs In]
    E --> A
    C -->|Has Permission| F[Process Request]
    C -->|No Permission| G[Return 403 Error]
    F --> H[Return Response]
    H --> I[Log Action]
    I --> J[End]`;
}

function generateClassDiagram(): string {
  return `classDiagram
    class User {
        +String id
        +String email
        +String name
        +login()
        +logout()
    }
    
    class Project {
        +String id
        +String name
        +String description
        +createFile()
        +deleteFile()
    }
    
    class File {
        +String id
        +String name
        +String content
        +save()
        +delete()
    }
    
    User "1" --> "*" Project : owns
    Project "1" --> "*" File : contains`;
}

function generateSequenceDiagram(): string {
  return `sequenceDiagram
    participant User
    participant Frontend
    participant API
    participant Database
    
    User->>Frontend: Submit Form
    Frontend->>API: POST /api/data
    API->>Database: Insert Record
    Database-->>API: Success Response
    API-->>Frontend: 201 Created
    Frontend-->>User: Show Success Message`;
}

export default ArchitectureDiagramVisualizer;

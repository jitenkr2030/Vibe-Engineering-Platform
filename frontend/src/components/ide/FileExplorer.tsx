"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { useParams } from "next/navigation";
import { FileCode, Folder, File, ChevronRight, ChevronDown, MoreHorizontal, Plus, Search, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

// Types
export interface FileNode {
  id: string;
  name: string;
  type: "file" | "folder";
  path: string;
  size?: number;
  contentType?: string;
  children?: FileNode[];
  lastModified?: Date;
}

interface FileExplorerContextType {
  files: FileNode[];
  selectedFile: string | null;
  expandedFolders: Set<string>;
  loading: boolean;
  onSelectFile: (path: string) => void;
  onToggleFolder: (path: string) => void;
  onRefresh: () => void;
}

const FileExplorerContext = createContext<FileExplorerContextType | null>(null);

export function useFileExplorer() {
  const context = useContext(FileExplorerContext);
  if (!context) {
    throw new Error("useFileExplorer must be used within FileExplorerProvider");
  }
  return context;
}

// File Explorer Component
interface FileExplorerProps {
  className?: string;
  onFileSelect?: (path: string) => void;
}

export function FileExplorer({ className, onFileSelect }: FileExplorerProps) {
  const params = useParams();
  const projectId = params.id as string;

  const [files, setFiles] = useState<FileNode[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch file tree
  const fetchFiles = useCallback(async () => {
    if (!projectId) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/v1/files/tree/${projectId}`);
      const data = await response.json();

      if (data.success) {
        setFiles(data.data.tree);
      }
    } catch (error) {
      console.error("Error fetching file tree:", error);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const handleSelectFile = useCallback((path: string) => {
    setSelectedFile(path);
    onFileSelect?.(path);
  }, [onFileSelect]);

  const handleToggleFolder = useCallback((path: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }, []);

  // Filter files based on search
  const filteredFiles = searchQuery
    ? filterFiles(files, searchQuery)
    : files;

  const value: FileExplorerContextType = {
    files: filteredFiles,
    selectedFile,
    expandedFolders,
    loading,
    onSelectFile: handleSelectFile,
    onToggleFolder: handleToggleFolder,
    onRefresh: fetchFiles,
  };

  return (
    <FileExplorerContext.Provider value={value}>
      <div className={cn("flex flex-col h-full", className)}>
        {/* Header */}
        <div className="p-3 border-b space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm">Files</h3>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={fetchFiles} className="h-7 w-7">
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-7 h-8 text-xs"
            />
          </div>
        </div>

        {/* File Tree */}
        <ScrollArea className="flex-1">
          <div className="p-2">
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-6 bg-muted/50 rounded animate-pulse" />
                ))}
              </div>
            ) : filteredFiles.length > 0 ? (
              <div className="space-y-0.5">
                {filteredFiles.map((node) => (
                  <FileTreeNode key={node.id} node={node} depth={0} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No files found
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </FileExplorerContext.Provider>
  );
}

// Individual File Tree Node
interface FileTreeNodeProps {
  node: FileNode;
  depth: number;
}

function FileTreeNode({ node, depth }: FileTreeNodeProps) {
  const { selectedFile, expandedFolders, onSelectFile, onToggleFolder } = useFileExplorer();
  const isSelected = selectedFile === node.path;
  const isExpanded = expandedFolders.has(node.path);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (node.type === "folder") {
      onToggleFolder(node.path);
    } else {
      onSelectFile(node.path);
    }
  };

  const indent = depth * 12;

  if (node.type === "folder") {
    return (
      <div>
        <div
          className={cn(
            "flex items-center gap-1 px-2 py-1 rounded cursor-pointer hover:bg-muted/50 transition-colors",
            isSelected && "bg-primary/10 text-primary"
          )}
          style={{ paddingLeft: `${indent + 8}px` }}
          onClick={handleClick}
        >
          {isExpanded ? (
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
          )}
          <Folder className="h-4 w-4 text-yellow-500 flex-shrink-0" />
          <span className="text-sm truncate">{node.name}</span>
        </div>
        {isExpanded && node.children && (
          <div>
            {node.children.map((child) => (
              <FileTreeNode key={child.id} node={child} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center gap-1 px-2 py-1 rounded cursor-pointer hover:bg-muted/50 transition-colors",
        isSelected && "bg-primary/10 text-primary"
      )}
      style={{ paddingLeft: `${indent + 28}px` }}
      onClick={handleClick}
    >
      <FileCodeIcon name={node.name} className="h-4 w-4 flex-shrink-0" />
      <span className="text-sm truncate">{node.name}</span>
    </div>
  );
}

// File icon based on extension
function FileCodeIcon({ name, className }: { name: string; className?: string }) {
  const ext = name.split(".").pop()?.toLowerCase();

  const iconMap: Record<string, React.ReactNode> = {
    ts: <FileCode className="h-4 w-4 text-blue-400" />,
    tsx: <FileCode className="h-4 w-4 text-blue-400" />,
    js: <FileCode className="h-4 w-4 text-yellow-400" />,
    jsx: <FileCode className="h-4 w-4 text-yellow-400" />,
    json: <FileCode className="h-4 w-4 text-yellow-300" />,
    md: <FileCode className="h-4 w-4 text-gray-400" />,
    html: <FileCode className="h-4 w-4 text-orange-400" />,
    css: <FileCode className="h-4 w-4 text-blue-300" />,
    py: <FileCode className="h-4 w-4 text-green-400" />,
    go: <FileCode className="h-4 w-4 text-cyan-400" />,
    rs: <FileCode className="h-4 w-4 text-orange-500" />,
    dockerfile: <FileCode className="h-4 w-4 text-blue-300" />,
    yml: <FileCode className="h-4 w-4 text-purple-400" />,
    yaml: <FileCode className="h-4 w-4 text-purple-400" />,
    gitignore: <FileCode className="h-4 w-4 text-gray-500" />,
  };

  return iconMap[ext || ""] || <File className={cn("h-4 w-4 text-gray-400", className)} />;
}

// Helper function to filter files
function filterFiles(nodes: FileNode[], query: string): FileNode[] {
  const lowerQuery = query.toLowerCase();

  const filterNode = (node: FileNode): FileNode | null => {
    // Check if this node matches
    const matches = node.name.toLowerCase().includes(lowerQuery);

    if (node.type === "folder") {
      // Check children
      const filteredChildren = (node.children || [])
        .map(filterNode)
        .filter((n): n is FileNode => n !== null);

      // Include folder if it has matching children
      if (filteredChildren.length > 0 || matches) {
        return {
          ...node,
          children: filteredChildren,
        };
      }
    } else if (matches) {
      return node;
    }

    return null;
  };

  return (nodes.map(filterNode).filter((n): n is FileNode => n !== null));
}

export default FileExplorer;

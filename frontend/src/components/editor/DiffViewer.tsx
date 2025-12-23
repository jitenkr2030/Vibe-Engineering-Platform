"use client";

import React, { useRef, useCallback, useState } from "react";
import { DiffEditor, OnMount, OnChange } from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import { Check, X, ArrowRight, GitCompare, Copy, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export interface DiffViewerProps {
  original: string;
  modified: string;
  language?: string;
  theme?: "vs-dark" | "light";
  originalLanguageLabel?: string;
  modifiedLanguageLabel?: string;
  onAccept?: (value: string) => void;
  onReject?: () => void;
  readOnly?: boolean;
  height?: string;
  className?: string;
}

export function DiffViewer({
  original,
  modified,
  language = "typescript",
  theme = "vs-dark",
  originalLanguageLabel = "Original",
  modifiedLanguageLabel = "Modified",
  onAccept,
  onReject,
  readOnly = false,
  height = "500px",
  className,
}: DiffViewerProps) {
  const [showInline, setShowInline] = useState(false);
  const [copied, setCopied] = useState<"original" | "modified" | null>(null);
  const editorRef = useRef<editor.IStandaloneDiffEditor | null>(null);

  const handleEditorMount: OnMount = useCallback((editor) => {
    editorRef.current = editor;
  }, []);

  const handleCopy = useCallback(async (type: "original" | "modified") => {
    const content = type === "original" ? original : modified;
    await navigator.clipboard.writeText(content);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  }, [original, modified]);

  const handleAccept = useCallback(() => {
    if (onAccept && editorRef.current) {
      const modifiedModel = editorRef.current.getModifiedEditor().getValue();
      onAccept(modifiedModel);
    }
  }, [onAccept]);

  const handleReject = useCallback(() => {
    onReject?.();
  }, [onReject]);

  const handleInlineChange = useCallback((value: boolean) => {
    setShowInline(value);
  }, []);

  return (
    <div className={cn("flex flex-col rounded-lg overflow-hidden border", className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-muted/50 border-b">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <GitCompare className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Diff Viewer</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="px-2 py-0.5 bg-red-500/20 text-red-600 rounded">
              -{original.split('\n').length} lines
            </span>
            <span className="px-2 py-0.5 bg-green-500/20 text-green-600 rounded">
              +{modified.split('\n').length} lines
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Inline/Full Toggle */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                {showInline ? (
                  <>
                    <EyeOff className="mr-2 h-3 w-3" />
                    Inline
                  </>
                ) : (
                  <>
                    <Eye className="mr-2 h-3 w-3" />
                    Split
                  </>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleInlineChange(false)}>
                <GitCompare className="mr-2 h-4 w-4" />
                Split View
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleInlineChange(true)}>
                <ArrowRight className="mr-2 h-4 w-4" />
                Inline View
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Copy Buttons */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleCopy("original")}
          >
            {copied === "original" ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
            <span className="ml-2">Original</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleCopy("modified")}
          >
            {copied === "modified" ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
            <span className="ml-2">Modified</span>
          </Button>
        </div>
      </div>

      {/* Editor */}
      <DiffEditor
        height={height}
        original={original}
        modified={modified}
        language={language}
        theme={theme}
        onMount={handleEditorMount}
        options={{
          readOnly,
          renderSideBySide: !showInline,
          inlineDiff: showInline,
          diffWordWrap: "off",
          minimap: { enabled: false },
          fontSize: 14,
          fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
          lineNumbers: "on",
          lineNumbersMinChars: 3,
          scrollbar: {
            useShadows: false,
            vertical: "visible",
            horizontal: "visible",
            verticalScrollbarSize: 10,
            horizontalScrollbarSize: 10,
          },
          renderLineHighlight: "all",
          automaticLayout: true,
          ignoreTrimWhitespace: false,
          originalEditable: false,
          diffAlgorithm: "advanced",
          hideUnchangedRegions: {
            enabled: true,
            revealLineEnd: 3,
            revealLineStart: 3,
          },
          overviewRulerBorder: true,
          scrollBeyondLastLine: false,
          folding: true,
          foldingStrategy: "indentation",
          showFoldingControls: "mouseover",
          useInlineViewWhenSmall: true,
          renderMarkers: "all",
        }}
        loading={
          <div className="flex items-center justify-center h-full bg-background">
            <div className="flex flex-col items-center gap-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="text-sm text-muted-foreground">Loading diff...</span>
            </div>
          </div>
        }
      />

      {/* Actions Footer */}
      {(onAccept || onReject) && (
        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t bg-muted/30">
          {onReject && (
            <Button variant="outline" onClick={handleReject}>
              <X className="mr-2 h-4 w-4" />
              Reject Changes
            </Button>
          )}
          {onAccept && (
            <Button
              variant="default"
              onClick={handleAccept}
            >
              <Check className="mr-2 h-4 w-4" />
              Accept Changes
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// Simplified diff view for smaller comparisons
export function SimpleDiff({
  original,
  modified,
  className,
}: {
  original: string;
  modified: string;
  className?: string;
}) {
  const originalLines = original.split("\n");
  const modifiedLines = modified.split("\n");

  return (
    <div
      className={cn(
        "font-mono text-sm rounded-md overflow-auto border bg-muted/30",
        className
      )}
    >
      {originalLines.map((line, i) => {
        const modifiedLine = modifiedLines[i];

        if (line === modifiedLine) {
          return (
            <div key={i} className="px-2 py-0.5 text-muted-foreground">
              <span className="inline-block w-6 text-right mr-4 text-xs opacity-50">
                {i + 1}
              </span>
              {line || " "}
            </div>
          );
        }

        return (
          <React.Fragment key={i}>
            <div className="px-2 py-0.5 bg-red-500/10 text-red-600">
              <span className="inline-block w-6 text-right mr-4 text-xs opacity-50">
                {i + 1}
              </span>
              -{line || " "}
            </div>
            <div className="px-2 py-0.5 bg-green-500/10 text-green-600">
              <span className="inline-block w-6 text-right mr-4 text-xs opacity-50">
                {modifiedLines[i] !== undefined ? i + 1 : " "}
              </span>
              +{modifiedLine || " "}
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}

export default DiffViewer;

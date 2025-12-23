"use client";

import React, { useRef, useEffect, useCallback } from "react";
import Editor, { OnMount, OnChange } from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import { cn } from "@/lib/utils";

export interface CodeEditorProps {
  code: string;
  language?: string;
  theme?: "vs-dark" | "light";
  onChange?: (value: string) => void;
  onSave?: (value: string) => void;
  readOnly?: boolean;
  height?: string;
  className?: string;
  markers?: Array<{
    startLineNumber: number;
    startColumn: number;
    endLineNumber: number;
    endColumn: number;
    severity: "error" | "warning" | "info" | "hint";
    message: string;
  }>;
}

const languageMap: Record<string, string> = {
  ts: "typescript",
  tsx: "typescript",
  js: "javascript",
  jsx: "javascript",
  py: "python",
  rb: "ruby",
  java: "java",
  go: "go",
  rs: "rust",
  sql: "sql",
  html: "html",
  css: "css",
  json: "json",
  md: "markdown",
  yaml: "yaml",
  yml: "yaml",
};

export function CodeEditor({
  code,
  language = "typescript",
  theme = "vs-dark",
  onChange,
  onSave,
  readOnly = false,
  height = "500px",
  className,
  markers = [],
}: CodeEditorProps) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<typeof import("monaco-editor") | null>(null);

  const handleEditorMount: OnMount = useCallback((editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Define custom theme
    monaco.editor.defineTheme("vibe-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "comment", foreground: "6A9955", fontStyle: "italic" },
        { token: "keyword", foreground: "569CD6" },
        { token: "string", foreground: "CE9178" },
        { token: "number", foreground: "B5CEA8" },
        { token: "type", foreground: "4EC9B0" },
      ],
      colors: {
        "editor.background": "#1a1b26",
        "editor.foreground": "#c0caf5",
        "editor.lineHighlightBackground": "#24283b",
        "editorCursor.foreground": "#c0caf5",
        "editor.selectionBackground": "#364a82",
        "editorLineNumber.foreground": "#3b4261",
        "editorLineNumber.activeForeground": "#737aa2",
      },
    });

    monaco.editor.defineTheme("vibe-light", {
      base: "vs",
      inherit: true,
      rules: [
        { token: "comment", foreground: "008000", fontStyle: "italic" },
        { token: "keyword", foreground: "0000FF" },
        { token: "string", foreground: "A31515" },
        { token: "number", foreground: "098658" },
      ],
      colors: {
        "editor.background": "#FFFFFF",
        "editor.foreground": "#383a42",
      },
    });

    // Add save command
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      if (onSave && editorRef.current) {
        onSave(editorRef.current.getValue());
      }
    });

    // Focus the editor
    editor.focus();
  }, [onSave]);

  const handleChange: OnChange = useCallback((value) => {
    if (onChange && value !== undefined) {
      onChange(value);
    }
  }, [onChange]);

  // Update markers when they change
  useEffect(() => {
    if (editorRef.current && monacoRef.current && markers.length > 0) {
      const model = editorRef.current.getModel();
      if (model) {
        monacoRef.current.editor.setModelMarkers(model, "vibe", markers);
      }
    }
  }, [markers]);

  const resolvedLanguage = languageMap[language.toLowerCase()] || language;

  return (
    <div className={cn("rounded-lg overflow-hidden border", className)}>
      <Editor
        height={height}
        language={resolvedLanguage}
        value={code}
        theme={theme}
        onChange={handleChange}
        onMount={handleEditorMount}
        options={{
          readOnly,
          minimap: { enabled: true, scale: 0.8 },
          fontSize: 14,
          fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
          fontLigatures: true,
          lineNumbers: "on",
          lineNumbersMinChars: 3,
          glyphMargin: false,
          folding: true,
          foldingStrategy: "indentation",
          showFoldingControls: "mouseover",
          bracketPairColorization: { enabled: true },
          guides: {
            bracketPairs: true,
            indentation: true,
          },
          renderLineHighlight: "all",
          selectOnLineNumbers: true,
          roundedSelection: true,
          scrollBeyondLastLine: false,
          automaticLayout: true,
          wordWrap: "off",
          tabSize: 2,
          insertSpaces: true,
          cursorBlinking: "smooth",
          cursorSmoothCaretAnimation: "on",
          smoothScrolling: true,
          contextmenu: true,
          mouseWheelZoom: true,
          scrollbar: {
            useShadows: false,
            verticalHasArrows: false,
            horizontalHasArrows: false,
            vertical: "visible",
            horizontal: "visible",
            verticalScrollbarSize: 10,
            horizontalScrollbarSize: 10,
          },
        }}
        loading={
          <div className="flex items-center justify-center h-full bg-background">
            <div className="flex flex-col items-center gap-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="text-sm text-muted-foreground">Loading editor...</span>
            </div>
          </div>
        }
      />
    </div>
  );
}

// Hook for managing editor state
export function useCodeEditor(options: Partial<CodeEditorProps> = {}) {
  const [code, setCode] = React.useState(options.code || "");
  const [language, setLanguage] = React.useState(options.language || "typescript");
  const [markers, setMarkers] = React.useState<CodeEditorProps["markers"]>([]);

  const addMarker = useCallback((
    lineNumber: number,
    column: number,
    message: string,
    severity: "error" | "warning" | "info" | "hint" = "error"
  ) => {
    setMarkers((prev) => [
      ...prev,
      {
        startLineNumber: lineNumber,
        startColumn: column,
        endLineNumber: lineNumber,
        endColumn: column + 1,
        severity,
        message,
      },
    ]);
  }, []);

  const clearMarkers = useCallback(() => {
    setMarkers([]);
  }, []);

  const formatCode = useCallback(() => {
    // This would require access to the editor instance
    // In a real implementation, you'd expose this through a ref
  }, []);

  return {
    code,
    setCode,
    language,
    setLanguage,
    markers,
    addMarker,
    clearMarkers,
    formatCode,
  };
}

export default CodeEditor;

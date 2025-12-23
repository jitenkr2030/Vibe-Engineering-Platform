'use client';

import { useCallback, useRef, useEffect } from 'react';
import { useEditorStore, selectActiveTab } from '@/store';
import { fileStorageService } from '@/services';
import type { EditorTab } from '@/store';

// Hook for editor operations
export function useEditorOperations(projectId: string) {
  const {
    tabs,
    activeTabId,
    fontSize,
    tabSize,
    wordWrap,
    minimap,
    lineNumbers,
    autoSave,
    searchQuery,
    searchResults,
    openFile,
    closeTab,
    closeOtherTabs,
    closeAllTab,
    setActiveTab,
    updateTabContent,
    markTabDirty,
    saveTab,
    saveAllTabs,
    updateTabViewState,
    moveTab,
    setFontSize,
    setTabSize,
    setWordWrap,
    setMinimap,
    setLineNumbers,
    setAutoSave,
    setSearchQuery,
    setSearchResults,
    clearSearch,
    reset,
  } = useEditorStore();

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const activeTab = selectActiveTab(useEditorStore.getState());

  // Auto-save functionality
  const autoSaveTab = useCallback((tabId: string, content: string) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      const tab = tabs.find((t) => t.id === tabId);
      if (tab && autoSave) {
        await saveFile(tab.path, content);
      }
    }, 2000); // Auto-save after 2 seconds of inactivity
  }, [tabs, autoSave]);

  // Open file from path
  const openFileFromPath = useCallback(async (path: string) => {
    try {
      const response = await fileStorageService.getFile(projectId, path);
      const file = response.file;
      openFile({
        id: file.id,
        path: file.path,
        name: file.name,
        language: file.language || getLanguageFromPath(file.path),
        content: file.content || '',
      });
    } catch (err) {
      console.error('Failed to open file:', err);
    }
  }, [projectId, openFile]);

  // Save file
  const saveFile = useCallback(async (path: string, content: string) => {
    try {
      await fileStorageService.updateFile(projectId, path, content);
      // Find the tab and mark it as saved
      const tab = tabs.find((t) => t.path === path);
      if (tab) {
        markTabDirty(tab.id, false);
      }
      return true;
    } catch (err) {
      console.error('Failed to save file:', err);
      return false;
    }
  }, [projectId, tabs, markTabDirty]);

  // Handle content change
  const handleContentChange = useCallback((tabId: string, content: string, isDirty: boolean = true) => {
    updateTabContent(tabId, content);
    if (isDirty) {
      markTabDirty(tabId, true);
    }
    
    const tab = tabs.find((t) => t.id === tabId);
    if (tab && autoSave) {
      autoSaveTab(tabId, content);
    }
  }, [tabs, updateTabContent, markTabDirty, autoSave, autoSaveTab]);

  // Close file with unsaved changes check
  const closeFile = useCallback(async (tabId: string, force: boolean = false) => {
    const tab = tabs.find((t) => t.id === tabId);
    if (!tab) return;

    if (tab.isDirty && !force) {
      // TODO: Show confirmation dialog
      // For close without saving
 now, just      closeTab(tabId);
    } else {
      closeTab(tabId);
    }
  }, [tabs, closeTab]);

  // Save all open files
  const saveAllFiles = useCallback(async () => {
    const dirtyTabs = tabs.filter((t) => t.isDirty);
    const results = await Promise.all(
      dirtyTabs.map((tab) => saveFile(tab.path, tab.content))
    );
    
    if (results.every((r) => r)) {
      saveAllTabs();
    }
    
    return results.every((r) => r);
  }, [tabs, saveFile, saveAllTabs]);

  // Search in files
  const searchInFiles = useCallback(async (query: string, fileTypes?: string[]) => {
    if (!query.trim()) {
      clearSearch();
      return;
    }

    setSearchQuery(query);
    
    try {
      const response = await fileStorageService.searchFiles(projectId, {
        query,
        fileTypes,
      });
      setSearchResults(response.results.map((r) => ({
        path: r.file.path,
        lineNumber: r.matches[0]?.lineNumber || 0,
        matchStart: r.matches[0]?.startIndex || 0,
        matchEnd: r.matches[0]?.endIndex || 0,
      })));
    } catch (err) {
      console.error('Search failed:', err);
      setSearchResults([]);
    }
  }, [projectId, setSearchQuery, setSearchResults, clearSearch]);

  // Go to line
  const goToLine = useCallback((lineNumber: number) => {
    // This will be handled by the editor component
    window.dispatchEvent(new CustomEvent('editor:goToLine', { detail: { lineNumber } }));
  }, []);

  // Format document
  const formatDocument = useCallback(() => {
    window.dispatchEvent(new CustomEvent('editor:format'));
  }, []);

  // Get language from file path
  const getLanguage = useCallback((path: string) => {
    return getLanguageFromPath(path);
  }, []);

  // Editor settings
  const updateFontSize = useCallback((size: number) => {
    setFontSize(Math.max(8, Math.min(24, size)));
  }, [setFontSize]);

  const updateTabSize = useCallback((size: number) => {
    setTabSize(Math.max(1, Math.min(8, size)));
  }, [setTabSize]);

  // Cleanup auto-save timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return {
    // State
    tabs,
    activeTab,
    activeTabId,
    fontSize,
    tabSize,
    wordWrap,
    minimap,
    lineNumbers,
    autoSave,
    searchQuery,
    searchResults,
    
    // Actions
    openFile,
    openFileFromPath,
    closeTab: closeFile,
    closeOtherTabs,
    closeAllTab,
    setActiveTab,
    updateTabContent,
    markTabDirty,
    saveTab: (tabId: string) => {
      const tab = tabs.find((t) => t.id === tabId);
      if (tab) {
        saveFile(tab.path, tab.content);
        markTabDirty(tabId, false);
      }
    },
    saveAllTabs: saveAllFiles,
    saveFile,
    handleContentChange,
    updateTabViewState,
    moveTab,
    
    // Settings
    setFontSize: updateFontSize,
    setTabSize: updateTabSize,
    setWordWrap,
    setMinimap,
    setLineNumbers,
    setAutoSave,
    
    // Search
    searchInFiles,
    clearSearch,
    goToLine,
    
    // Format
    formatDocument,
    getLanguage,
    
    // Reset
    reset,
  };
}

// Helper function to get language from file path
function getLanguageFromPath(path: string): string {
  const extension = path.split('.').pop()?.toLowerCase();
  
  const languageMap: Record<string, string> = {
    ts: 'typescript',
    tsx: 'typescript',
    js: 'javascript',
    jsx: 'javascript',
    py: 'python',
    java: 'java',
    c: 'c',
    cpp: 'cpp',
    cs: 'csharp',
    go: 'go',
    rs: 'rust',
    php: 'php',
    rb: 'ruby',
    swift: 'swift',
    kt: 'kotlin',
    scala: 'scala',
    html: 'html',
    css: 'css',
    scss: 'scss',
    less: 'less',
    json: 'json',
    yaml: 'yaml',
    yml: 'yaml',
    xml: 'xml',
    md: 'markdown',
    markdown: 'markdown',
    sql: 'sql',
    sh: 'shell',
    bash: 'shell',
    ps1: 'powershell',
    dockerfile: 'dockerfile',
    vue: 'vue',
    svelte: 'svelte',
  };
  
  return languageMap[extension || ''] || 'plaintext';
}

export default useEditorOperations;

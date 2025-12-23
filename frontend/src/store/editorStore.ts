import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

// Types
export interface EditorTab {
  id: string;
  fileId: string;
  path: string;
  name: string;
  language: string;
  content: string;
  originalContent: string;
  isDirty: boolean;
  isActive: boolean;
  viewState?: {
    scrollTop: number;
    scrollLeft: number;
    cursorLine: number;
    cursorColumn: number;
  };
}

export interface EditorState {
  // Tabs management
  tabs: EditorTab[];
  activeTabId: string | null;
  
  // Editor settings
  fontSize: number;
  tabSize: number;
  wordWrap: 'off' | 'on';
  minimap: boolean;
  lineNumbers: 'on' | 'off' | 'relative';
  autoSave: boolean;
  
  // Search state
  searchQuery: string;
  searchResults: Array<{ path: string; lineNumber: number; matchStart: number; matchEnd: number }>;
  
  // Actions
  openFile: (file: { id: string; path: string; name: string; language: string; content: string }) => void;
  closeTab: (tabId: string) => void;
  closeOtherTabs: (tabId: string) => void;
  closeAllTabs: () => void;
  setActiveTab: (tabId: string | null) => void;
  updateTabContent: (tabId: string, content: string) => void;
  markTabDirty: (tabId: string, isDirty: boolean) => void;
  saveTab: (tabId: string) => void;
  saveAllTabs: () => void;
  updateTabViewState: (tabId: string, viewState: EditorTab['viewState']) => void;
  moveTab: (fromIndex: number, toIndex: number) => void;
  setFontSize: (size: number) => void;
  setTabSize: (size: number) => void;
  setWordWrap: (wrap: 'off' | 'on') => void;
  setMinimap: (enabled: boolean) => void;
  setLineNumbers: (mode: 'on' | 'off' | 'relative') => void;
  setAutoSave: (enabled: boolean) => void;
  setSearchQuery: (query: string) => void;
  setSearchResults: (results: EditorState['searchResults']) => void;
  clearSearch: () => void;
  reset: () => void;
}

const defaultEditorSettings = {
  fontSize: 14,
  tabSize: 2,
  wordWrap: 'on' as const,
  minimap: true,
  lineNumbers: 'on' as const,
  autoSave: false,
};

const initialState = {
  tabs: [],
  activeTabId: null,
  ...defaultEditorSettings,
  searchQuery: '',
  searchResults: [],
};

export const useEditorStore = create<EditorState>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        openFile: (file) => set(
          (state) => {
            // Check if file is already open
            const existingTab = state.tabs.find((t) => t.fileId === file.id);
            if (existingTab) {
              return { activeTabId: existingTab.id };
            }

            const newTab: EditorTab = {
              id: `tab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              fileId: file.id,
              path: file.path,
              name: file.name,
              language: file.language,
              content: file.content,
              originalContent: file.content,
              isDirty: false,
              isActive: true,
            };

            // Mark other tabs as inactive
            const updatedTabs = state.tabs.map((t) => ({ ...t, isActive: false }));
            
            return {
              tabs: [...updatedTabs, newTab],
              activeTabId: newTab.id,
            };
          },
          false,
          'editorStore/openFile'
        ),
        
        closeTab: (tabId) => set(
          (state) => {
            const tabIndex = state.tabs.findIndex((t) => t.id === tabId);
            if (tabIndex === -1) return state;

            const newTabs = state.tabs.filter((t) => t.id !== tabId);
            let newActiveTabId = state.activeTabId;

            if (state.activeTabId === tabId) {
              // Switch to adjacent tab
              if (tabIndex > 0) {
                newActiveTabId = newTabs[tabIndex - 1].id;
              } else if (newTabs.length > 0) {
                newActiveTabId = newTabs[0].id;
              } else {
                newActiveTabId = null;
              }
            }

            // Update active state
            const updatedTabs = newTabs.map((t) => ({
              ...t,
              isActive: t.id === newActiveTabId,
            }));

            return { tabs: updatedTabs, activeTabId: newActiveTabId };
          },
          false,
          'editorStore/closeTab'
        ),
        
        closeOtherTabs: (tabId) => set(
          (state) => {
            const targetTab = state.tabs.find((t) => t.id === tabId);
            if (!targetTab) return state;

            const updatedTab = { ...targetTab, isActive: true };
            return { tabs: [updatedTab], activeTabId: tabId };
          },
          false,
          'editorStore/closeOtherTabs'
        ),
        
        closeAllTab: () => set(
          { tabs: [], activeTabId: null },
          false,
          'editorStore/closeAllTabs'
        ),
        
        setActiveTab: (tabId) => set(
          (state) => ({
            tabs: state.tabs.map((t) => ({
              ...t,
              isActive: t.id === tabId,
            })),
            activeTabId: tabId,
          }),
          false,
          'editorStore/setActiveTab'
        ),
        
        updateTabContent: (tabId, content) => set(
          (state) => ({
            tabs: state.tabs.map((t) =>
              t.id === tabId ? { ...t, content } : t
            ),
          }),
          false,
          'editorStore/updateTabContent'
        ),
        
        markTabDirty: (tabId, isDirty) => set(
          (state) => ({
            tabs: state.tabs.map((t) =>
              t.id === tabId ? { ...t, isDirty } : t
            ),
          }),
          false,
          'editorStore/markTabDirty'
        ),
        
        saveTab: (tabId) => set(
          (state) => ({
            tabs: state.tabs.map((t) =>
              t.id === tabId
                ? { ...t, isDirty: false, originalContent: t.content }
                : t
            ),
          }),
          false,
          'editorStore/saveTab'
        ),
        
        saveAllTabs: () => set(
          (state) => ({
            tabs: state.tabs.map((t) => ({
              ...t,
              isDirty: false,
              originalContent: t.content,
            })),
          }),
          false,
          'editorStore/saveAllTabs'
        ),
        
        updateTabViewState: (tabId, viewState) => set(
          (state) => ({
            tabs: state.tabs.map((t) =>
              t.id === tabId ? { ...t, viewState } : t
            ),
          }),
          false,
          'editorStore/updateTabViewState'
        ),
        
        moveTab: (fromIndex, toIndex) => set(
          (state) => {
            const tabs = [...state.tabs];
            const [movedTab] = tabs.splice(fromIndex, 1);
            tabs.splice(toIndex, 0, movedTab);
            return { tabs };
          },
          false,
          'editorStore/moveTab'
        ),
        
        setFontSize: (size) => set(
          { fontSize: size },
          false,
          'editorStore/setFontSize'
        ),
        
        setTabSize: (size) => set(
          { tabSize: size },
          false,
          'editorStore/setTabSize'
        ),
        
        setWordWrap: (wrap) => set(
          { wordWrap: wrap },
          false,
          'editorStore/setWordWrap'
        ),
        
        setMinimap: (enabled) => set(
          { minimap: enabled },
          false,
          'editorStore/setMinimap'
        ),
        
        setLineNumbers: (mode) => set(
          { lineNumbers: mode },
          false,
          'editorStore/setLineNumbers'
        ),
        
        setAutoSave: (enabled) => set(
          { autoSave: enabled },
          false,
          'editorStore/setAutoSave'
        ),
        
        setSearchQuery: (query) => set(
          { searchQuery: query },
          false,
          'editorStore/setSearchQuery'
        ),
        
        setSearchResults: (results) => set(
          { searchResults: results },
          false,
          'editorStore/setSearchResults'
        ),
        
        clearSearch: () => set(
          { searchQuery: '', searchResults: [] },
          false,
          'editorStore/clearSearch'
        ),
        
        reset: () => set(initialState, false, 'editorStore/reset'),
      }),
      {
        name: 'editor-store',
        partialize: (state) => ({
          fontSize: state.fontSize,
          tabSize: state.tabSize,
          wordWrap: state.wordWrap,
          minimap: state.minimap,
          lineNumbers: state.lineNumbers,
          autoSave: state.autoSave,
          tabs: state.tabs.map((t) => ({
            id: t.id,
            fileId: t.fileId,
            path: t.path,
            name: t.name,
            language: t.language,
            viewState: t.viewState,
          })),
        }),
      }
    ),
    { name: 'EditorStore' }
  )
);

// Selectors
export const selectActiveTab = (state: EditorState) => {
  if (!state.activeTabId) return null;
  return state.tabs.find((t) => t.id === state.activeTabId) || null;
};

export const selectDirtyTabs = (state: EditorState) => {
  return state.tabs.filter((t) => t.isDirty);
};

export const selectTabByFileId = (fileId: string) => (state: EditorState) => {
  return state.tabs.find((t) => t.fileId === fileId);
};

export const selectTabsByPath = (path: string) => (state: EditorState) => {
  return state.tabs.filter((t) => t.path.startsWith(path));
};

export default useEditorStore;

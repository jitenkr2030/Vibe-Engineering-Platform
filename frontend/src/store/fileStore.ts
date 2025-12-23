import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

// Types
export interface FileNode {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: FileNode[];
  content?: string;
  language?: string;
  size?: number;
  modifiedAt?: string;
  isExpanded?: boolean;
}

export interface FileOperation {
  type: 'upload' | 'download' | 'delete' | 'rename' | 'move';
  path: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  progress?: number;
  error?: string;
}

interface FileStoreState {
  // File tree
  fileTree: FileNode[];
  currentPath: string;
  selectedFile: FileNode | null;
  expandedFolders: Set<string>;
  
  // Loading states
  isLoading: boolean;
  isSaving: boolean;
  
  // Operations queue
  operations: FileOperation[];
  
  // Search
  searchQuery: string;
  searchResults: FileNode[];
  
  // Actions
  setFileTree: (files: FileNode[]) => void;
  setCurrentPath: (path: string) => void;
  selectFile: (file: FileNode | null) => void;
  toggleFolder: (path: string) => void;
  addOperation: (operation: FileOperation) => void;
  updateOperation: (path: string, updates: Partial<FileOperation>) => void;
  removeOperation: (path: string) => void;
  setLoading: (loading: boolean) => void;
  setSaving: (saving: boolean) => void;
  setSearchQuery: (query: string) => void;
  setSearchResults: (results: FileNode[]) => void;
  updateFileContent: (path: string, content: string) => void;
  addFile: (parentPath: string, file: FileNode) => void;
  removeFile: (path: string) => void;
  renameFile: (oldPath: string, newName: string) => void;
  reset: () => void;
}

const initialState = {
  fileTree: [],
  currentPath: '/',
  selectedFile: null,
  expandedFolders: new Set<string>(),
  isLoading: false,
  isSaving: false,
  operations: [],
  searchQuery: '',
  searchResults: [],
};

export const useFileStore = create<FileStoreState>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        setFileTree: (files) => set({ fileTree: files }, false, 'fileStore/setFileTree'),
        
        setCurrentPath: (path) => set({ currentPath: path }, false, 'fileStore/setCurrentPath'),
        
        selectFile: (file) => set({ selectedFile: file }, false, 'fileStore/selectFile'),
        
        toggleFolder: (path) => set((state) => {
          const newExpanded = new Set(state.expandedFolders);
          if (newExpanded.has(path)) {
            newExpanded.delete(path);
          } else {
            newExpanded.add(path);
          }
          return { expandedFolders: newExpanded };
        }, false, 'fileStore/toggleFolder'),
        
        addOperation: (operation) => set((state) => ({
          operations: [...state.operations, operation]
        }), false, 'fileStore/addOperation'),
        
        updateOperation: (path, updates) => set((state) => ({
          operations: state.operations.map((op) =>
            op.path === path ? { ...op, ...updates } : op
          )
        }), false, 'fileStore/updateOperation'),
        
        removeOperation: (path) => set((state) => ({
          operations: state.operations.filter((op) => op.path !== path)
        }), false, 'fileStore/removeOperation'),
        
        setLoading: (loading) => set({ isLoading: loading }, false, 'fileStore/setLoading'),
        
        setSaving: (saving) => set({ isSaving: saving }, false, 'fileStore/setSaving'),
        
        setSearchQuery: (query) => set({ searchQuery: query }, false, 'fileStore/setSearchQuery'),
        
        setSearchResults: (results) => set({ searchResults: results }, false, 'fileStore/setSearchResults'),
        
        updateFileContent: (path, content) => set((state) => {
          const updateNode = (nodes: FileNode[]): FileNode[] => {
            return nodes.map((node) => {
              if (node.path === path) {
                return { ...node, content, modifiedAt: new Date().toISOString() };
              }
              if (node.children) {
                return { ...node, children: updateNode(node.children) };
              }
              return node;
            });
          };
          return { fileTree: updateNode(state.fileTree) };
        }, false, 'fileStore/updateFileContent'),
        
        addFile: (parentPath, file) => set((state) => {
          const addNode = (nodes: FileNode[]): FileNode[] => {
            if (parentPath === '/') {
              return [...nodes, file];
            }
            return nodes.map((node) => {
              if (node.path === parentPath && node.type === 'folder') {
                return { ...node, children: [...(node.children || []), file] };
              }
              if (node.children) {
                return { ...node, children: addNode(node.children) };
              }
              return node;
            });
          };
          return { fileTree: addNode(state.fileTree) };
        }, false, 'fileStore/addFile'),
        
        removeFile: (path) => set((state) => {
          const removeNode = (nodes: FileNode[]): FileNode[] => {
            return nodes.filter((node) => node.path !== path)
              .map((node) => {
                if (node.children) {
                  return { ...node, children: removeNode(node.children) };
                }
                return node;
              });
          };
          return { fileTree: removeNode(state.fileTree) };
        }, false, 'fileStore/removeFile'),
        
        renameFile: (oldPath, newName) => set((state) => {
          const renameNode = (nodes: FileNode[]): FileNode[] => {
            return nodes.map((node) => {
              if (node.path === oldPath) {
                const pathParts = node.path.split('/');
                pathParts[pathParts.length - 1] = newName;
                const newPath = pathParts.join('/');
                return {
                  ...node,
                  name: newName,
                  path: newPath,
                  children: node.children?.map((child) => ({
                    ...child,
                    path: child.path.replace(oldPath, newPath),
                    children: child.children?.map((grandChild) => ({
                      ...grandChild,
                      path: grandChild.path.replace(oldPath, newPath),
                    })),
                  })),
                };
              }
              if (node.children) {
                return { ...node, children: renameNode(node.children) };
              }
              return node;
            });
          };
          return { fileTree: renameNode(state.fileTree) };
        }, false, 'fileStore/renameFile'),
        
        reset: () => set(initialState, false, 'fileStore/reset'),
      }),
      {
        name: 'file-store',
        partialize: (state) => ({
          currentPath: state.currentPath,
          expandedFolders: Array.from(state.expandedFolders),
        }),
      }
    ),
    { name: 'FileStore' }
  )
);

// Helper function to build file tree from flat list
export function buildFileTree(files: Array<{ path: string; name: string; type: string; content?: string; language?: string }>): FileNode[] {
  const root: FileNode[] = [];
  const map = new Map<string, FileNode>();

  // Create all nodes
  files.forEach((file) => {
    const node: FileNode = {
      id: file.path,
      name: file.name,
      path: file.path,
      type: file.type as 'file' | 'folder',
      content: file.content,
      language: file.language,
    };
    map.set(file.path, node);
  });

  // Build tree structure
  files.forEach((file) => {
    const node = map.get(file.path)!;
    const parts = file.path.split('/').filter(Boolean);
    const parentPath = parts.slice(0, -1).join('/') || '/';

    if (parentPath !== '/') {
      const parent = map.get(parentPath);
      if (parent) {
        parent.children = parent.children || [];
        parent.children.push(node);
      }
    } else {
      root.push(node);
    }
  });

  return root;
}

// Helper function to find file by path
export function findFileByPath(nodes: FileNode[], path: string): FileNode | null {
  for (const node of nodes) {
    if (node.path === path) return node;
    if (node.children) {
      const found = findFileByPath(node.children, path);
      if (found) return found;
    }
  }
  return null;
}

// Helper function to flatten file tree
export function flattenFileTree(nodes: FileNode[]): FileNode[] {
  const result: FileNode[] = [];
  const flatten = (node: FileNode) => {
    result.push(node);
    if (node.children) {
      node.children.forEach(flatten);
    }
  };
  nodes.forEach(flatten);
  return result;
}

export default useFileStore;

'use client';

import { useCallback, useEffect, useState } from 'react';
import { useFileStore, useEditorStore } from '@/store';
import { fileStorageService } from '@/services';
import { useFileSync } from '@/services/websocket.integration';
import type { FileNode } from '@/store';

// Hook for file operations with state management
export function useFileOperations(projectId: string) {
  const {
    fileTree,
    currentPath,
    selectedFile,
    expandedFolders,
    isLoading,
    isSaving,
    operations,
    setFileTree,
    setCurrentPath,
    selectFile,
    toggleFolder,
    setLoading,
    setSaving,
    updateFileContent,
    addFile,
    removeFile,
    renameFile,
  } = useFileStore();

  const [error, setError] = useState<string | null>(null);

  // Enable real-time file sync
  useFileSync(projectId);

  // Load directory contents
  const loadDirectory = useCallback(async (path: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fileStorageService.listDirectory(projectId, path);
      // Convert flat list to tree structure
      const allItems = [...response.files, ...response.directories];
      const tree = buildTreeFromLists(response.directories, response.files);
      setFileTree(tree);
      setCurrentPath(path);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load directory');
    } finally {
      setLoading(false);
    }
  }, [projectId, setFileTree, setCurrentPath, setLoading]);

  // Load file tree
  const loadFileTree = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fileStorageService.getFileTree(projectId);
      setFileTree(response.tree);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load file tree');
    } finally {
      setLoading(false);
    }
  }, [projectId, setFileTree, setLoading]);

  // Get file content
  const getFileContent = useCallback(async (path: string): Promise<string> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fileStorageService.getFile(projectId, path);
      return response.file.content || '';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get file content');
      return '';
    } finally {
      setLoading(false);
    }
  }, [projectId, setLoading]);

  // Open file in editor
  const openFile = useCallback(async (file: FileNode) => {
    if (file.type === 'folder') {
      setCurrentPath(file.path);
      toggleFolder(file.path);
      return;
    }

    selectFile(file);
    
    // Load content if not already loaded
    if (!file.content) {
      const content = await getFileContent(file.path);
      // Update the store with content
      updateFileContent(file.path, content);
    }
  }, [selectFile, setCurrentPath, toggleFolder, getFileContent, updateFileContent]);

  // Create new file
  const createFile = useCallback(async (name: string, content?: string) => {
    setSaving(true);
    setError(null);
    try {
      const path = currentPath === '/' ? `/${name}` : `${currentPath}/${name}`;
      const response = await fileStorageService.createFile(projectId, {
        name,
        path,
        content,
      });
      addFile(currentPath, {
        id: response.file.id,
        name: response.file.name,
        path: response.file.path,
        type: 'file',
        content: response.file.content,
        language: response.file.language,
      });
      return response.file;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create file');
      return null;
    } finally {
      setSaving(false);
    }
  }, [projectId, currentPath, addFile, setSaving]);

  // Create new directory
  const createDirectory = useCallback(async (name: string) => {
    setSaving(true);
    setError(null);
    try {
      const path = currentPath === '/' ? `/${name}` : `${currentPath}/${name}`;
      const response = await fileStorageService.createDirectory(projectId, {
        name,
        path,
      });
      addFile(currentPath, {
        id: response.directory.id,
        name: response.directory.name,
        path: response.directory.path,
        type: 'folder',
      });
      return response.directory;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create directory');
      return null;
    } finally {
      setSaving(false);
    }
  }, [projectId, currentPath, addFile, setSaving]);

  // Save file
  const saveFile = useCallback(async (path: string, content: string, language?: string) => {
    setSaving(true);
    setError(null);
    try {
      await fileStorageService.updateFile(projectId, path, content, language);
      updateFileContent(path, content);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save file');
      return false;
    } finally {
      setSaving(false);
    }
  }, [projectId, updateFileContent, setSaving]);

  // Delete file or directory
  const deleteItem = useCallback(async (path: string, recursive: boolean = false) => {
    setSaving(true);
    setError(null);
    try {
      // Determine if it's a file or directory
      const item = findFileByPath(fileTree, path);
      if (!item) {
        throw new Error('Item not found');
      }

      if (item.type === 'folder' && !recursive) {
        await fileStorageService.deleteDirectory(projectId, path, false);
      } else {
        await fileStorageService.deleteFile(projectId, path);
      }
      
      removeFile(path);
      if (selectedFile?.path === path) {
        selectFile(null);
      }
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete item');
      return false;
    } finally {
      setSaving(false);
    }
  }, [projectId, fileTree, removeFile, selectFile, selectedFile, setSaving]);

  // Rename file or directory
  const renameItem = useCallback(async (oldPath: string, newName: string) => {
    setSaving(true);
    setError(null);
    try {
      await fileStorageService.move(projectId, {
        sourcePath: oldPath,
        destinationPath: oldPath.replace(/\/[^/]+$/, `/${newName}`),
      });
      renameFile(oldPath, newName);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to rename item');
      return false;
    } finally {
      setSaving(false);
    }
  }, [projectId, renameFile, setSaving]);

  // Upload file
  const uploadFile = useCallback(async (file: File, onProgress?: (progress: number) => void) => {
    setSaving(true);
    setError(null);
    try {
      const path = currentPath === '/' ? `/${file.name}` : `${currentPath}/${file.name}`;
      const response = await fileStorageService.uploadFile(projectId, path, file, (progress) => {
        onProgress?.(progress.percentage);
      });
      addFile(currentPath, {
        id: response.file.id,
        name: response.file.name,
        path: response.file.path,
        type: 'file',
        language: response.file.language,
      });
      return response.file;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload file');
      return null;
    } finally {
      setSaving(false);
    }
  }, [projectId, currentPath, addFile, setSaving]);

  return {
    // State
    fileTree,
    currentPath,
    selectedFile,
    expandedFolders,
    isLoading,
    isSaving,
    operations,
    error,
    
    // Actions
    loadDirectory,
    loadFileTree,
    getFileContent,
    openFile,
    createFile,
    createDirectory,
    saveFile,
    deleteItem,
    renameItem,
    uploadFile,
    toggleFolder,
    selectFile,
    setCurrentPath,
  };
}

// Helper function to build tree from flat lists
function buildTreeFromLists(
  directories: Array<{ id: string; name: string; path: string; type: string }>,
  files: Array<{ id: string; name: string; path: string; type: string; content?: string; language?: string }>
): FileNode[] {
  const root: FileNode[] = [];
  const map = new Map<string, FileNode>();

  // Create directory nodes
  directories.forEach((dir) => {
    const node: FileNode = {
      id: dir.id,
      name: dir.name,
      path: dir.path,
      type: 'folder',
    };
    map.set(dir.path, node);
  });

  // Create file nodes
  files.forEach((file) => {
    const node: FileNode = {
      id: file.id,
      name: file.name,
      path: file.path,
      type: 'file',
      content: file.content,
      language: file.language,
    };
    map.set(file.path, node);
  });

  // Build tree structure
  directories.forEach((dir) => {
    const node = map.get(dir.path)!;
    const parts = dir.path.split('/').filter(Boolean);
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

// Re-export findFileByPath from store
function findFileByPath(nodes: FileNode[], path: string): FileNode | null {
  for (const node of nodes) {
    if (node.path === path) return node;
    if (node.children) {
      const found = findFileByPath(node.children, path);
      if (found) return found;
    }
  }
  return null;
}

export default useFileOperations;

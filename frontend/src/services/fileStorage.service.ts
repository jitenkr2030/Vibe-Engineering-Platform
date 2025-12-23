import { apiClient } from './api';
import type { FileNode } from '@/store/fileStore';

// Types
export interface FileInfo {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'folder';
  size: number;
  content?: string;
  language?: string;
  modifiedAt: string;
  createdAt: string;
}

export interface DirectoryContents {
  files: FileInfo[];
  directories: FileInfo[];
  path: string;
}

export interface CreateFileParams {
  name: string;
  path: string;
  content?: string;
  language?: string;
}

export interface CreateDirectoryParams {
  name: string;
  path: string;
}

export interface MoveParams {
  sourcePath: string;
  destinationPath: string;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface FileSearchParams {
  query: string;
  path?: string;
  fileTypes?: string[];
  caseSensitive?: boolean;
}

export interface FileSearchResult {
  file: FileInfo;
  matches: Array<{
    lineNumber: number;
    lineContent: string;
    startIndex: number;
    endIndex: number;
  }>;
}

// File storage service
export const fileStorageService = {
  // List directory contents
  async listDirectory(projectId: string, path: string = '/'): Promise<DirectoryContents> {
    return apiClient.get(`/storage/${projectId}/files`, { path });
  },

  // Get file content
  async getFile(projectId: string, path: string): Promise<{ file: FileInfo }> {
    return apiClient.get(`/storage/${projectId}/files/content`, { path });
  },

  // Get file metadata
  async getFileInfo(projectId: string, path: string): Promise<{ file: FileInfo }> {
    return apiClient.get(`/storage/${projectId}/files/info`, { path });
  },

  // Create new file
  async createFile(projectId: string, params: CreateFileParams): Promise<{ file: FileInfo }> {
    return apiClient.post(`/storage/${projectId}/files`, params);
  },

  // Create new directory
  async createDirectory(projectId: string, params: CreateDirectoryParams): Promise<{ directory: FileInfo }> {
    return apiClient.post(`/storage/${projectId}/directories`, params);
  },

  // Update file content
  async updateFile(
    projectId: string,
    path: string,
    content: string,
    language?: string
  ): Promise<{ file: FileInfo }> {
    return apiClient.put(`/storage/${projectId}/files`, {
      path,
      content,
      language,
    });
  },

  // Delete file
  async deleteFile(projectId: string, path: string): Promise<void> {
    return apiClient.delete(`/storage/${projectId}/files`, { data: { path } });
  },

  // Delete directory
  async deleteDirectory(projectId: string, path: string, recursive: boolean = false): Promise<void> {
    return apiClient.delete(`/storage/${projectId}/directories`, { 
      data: { path, recursive } 
    });
  },

  // Move/Rename file or directory
  async move(projectId: string, params: MoveParams): Promise<{ 
    source: FileInfo; 
    destination: FileInfo;
  }> {
    return apiClient.post(`/storage/${projectId}/move`, params);
  },

  // Copy file or directory
  async copy(
    projectId: string,
    sourcePath: string,
    destinationPath: string
  ): Promise<{ 
    source: FileInfo; 
    destination: FileInfo;
  }> {
    return apiClient.post(`/storage/${projectId}/copy`, {
      sourcePath,
      destinationPath,
    });
  },

  // Upload file with progress
  async uploadFile(
    projectId: string,
    path: string,
    file: File,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<{ file: FileInfo }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('path', path);

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) {
          onProgress({
            loaded: event.loaded,
            total: event.total,
            percentage: Math.round((event.loaded / event.total) * 100),
          });
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(JSON.parse(xhr.responseText));
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Upload failed'));
      });

      xhr.open('POST', `${process.env.NEXT_PUBLIC_API_URL}/api/v1/storage/${projectId}/upload`);
      
      const token = localStorage.getItem('accessToken');
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }
      
      xhr.send(formData);
    });
  },

  // Download file
  async downloadFile(projectId: string, path: string): Promise<Blob> {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/storage/${projectId}/download?path=${encodeURIComponent(path)}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      }
    );
    
    if (!response.ok) {
      throw new Error('Download failed');
    }
    
    return response.blob();
  },

  // Search files
  async searchFiles(projectId: string, params: FileSearchParams): Promise<{
    results: FileSearchResult[];
    totalMatches: number;
  }> {
    return apiClient.post(`/storage/${projectId}/search`, params);
  },

  // Get file tree
  async getFileTree(projectId: string): Promise<{ tree: FileNode[] }> {
    return apiClient.get(`/storage/${projectId}/tree`);
  },

  // Batch operations
  async batchDelete(projectId: string, paths: string[]): Promise<{
    deleted: string[];
    failed: Array<{ path: string; error: string }>;
  }> {
    return apiClient.post(`/storage/${projectId}/batch/delete`, { paths });
  },

  async batchMove(
    projectId: string,
    operations: Array<MoveParams>
  ): Promise<{
    moved: Array<{ source: string; destination: string }>;
    failed: Array<{ source: string; error: string }>;
  }> {
    return apiClient.post(`/storage/${projectId}/batch/move`, { operations });
  },

  // Get storage stats for project
  async getStorageStats(projectId: string): Promise<{
    totalSize: number;
    fileCount: number;
    directoryCount: number;
    largestFiles: Array<{ path: string; size: number }>;
  }> {
    return apiClient.get(`/storage/${projectId}/stats`);
  },
};

export default fileStorageService;

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  ListObjectsV2Output,
  HeadObjectCommand,
  CopyObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import * as fs from "fs/promises";
import * as path from "path";
import { v4 as uuidv4 } from "uuid";

export interface FileMetadata {
  key: string;
  size: number;
  lastModified: Date;
  contentType: string;
  etag?: string;
}

export interface UploadOptions {
  bucket?: string;
  contentType?: string;
  metadata?: Record<string, string>;
  isPublic?: boolean;
}

export interface PresignedUrlOptions {
  operation: "getObject" | "putObject";
  expiresIn?: number;
  contentType?: string;
}

export interface ListFilesOptions {
  bucket?: string;
  prefix?: string;
  delimiter?: string;
  maxKeys?: number;
  continuationToken?: string;
}

export interface FileTreeNode {
  id: string;
  name: string;
  type: "file" | "folder";
  path: string;
  size?: number;
  contentType?: string;
  children?: FileTreeNode[];
  lastModified?: Date;
}

export interface StorageServiceConfig {
  endpoint: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  forcePathStyle?: boolean;
}

export class FileStorageService {
  private client: S3Client;
  private defaultBucket: string;
  private projectBasePath: string;

  constructor(config?: Partial<StorageServiceConfig>) {
    const fullConfig: StorageServiceConfig = {
      endpoint: process.env.S3_ENDPOINT || "http://localhost:9000",
      region: process.env.S3_REGION || "us-east-1",
      accessKeyId: process.env.S3_ACCESS_KEY_ID || "minioadmin",
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || "minioadmin",
      bucket: process.env.S3_BUCKET || "vibe-projects",
      forcePathStyle: true,
      ...config,
    };

    this.client = new S3Client({
      endpoint: fullConfig.endpoint,
      region: fullConfig.region,
      credentials: {
        accessKeyId: fullConfig.accessKeyId,
        secretAccessKey: fullConfig.secretAccessKey,
      },
      forcePathStyle: fullConfig.forcePathStyle,
    });

    this.defaultBucket = fullConfig.bucket;
    this.projectBasePath = "projects";
  }

  /**
   * Get the full S3 key for a project file
   */
  private getKey(projectId: string, filePath: string): string {
    // Normalize path separators
    const normalizedPath = filePath.replace(/\\/g, "/");
    // Remove leading slash if present
    const cleanPath = normalizedPath.startsWith("/")
      ? normalizedPath.slice(1)
      : normalizedPath;
    return `${this.projectBasePath}/${projectId}/${cleanPath}`;
  }

  /**
   * Parse S3 key to extract projectId and file path
   */
  parseKey(key: string): { projectId: string; filePath: string } {
    const parts = key.split("/");
    // Expected format: projects/{projectId}/{filePath}
    const projectId = parts[1];
    const filePath = parts.slice(2).join("/");
    return { projectId, filePath };
  }

  /**
   * Upload a file to storage
   */
  async uploadFile(
    projectId: string,
    filePath: string,
    content: Buffer | string,
    options: UploadOptions = {}
  ): Promise<FileMetadata> {
    const bucket = options.bucket || this.defaultBucket;
    const key = this.getKey(projectId, filePath);

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: content,
      ContentType: options.contentType || this.getContentType(filePath),
      Metadata: options.metadata,
    });

    await this.client.send(command);

    return {
      key,
      size: Buffer.isBuffer(content) ? content.length : Buffer.from(content).length,
      lastModified: new Date(),
      contentType: options.contentType || this.getContentType(filePath),
    };
  }

  /**
   * Get file content from storage
   */
  async getFile(
    projectId: string,
    filePath: string
  ): Promise<{ content: Buffer; metadata: FileMetadata }> {
    const bucket = this.defaultBucket;
    const key = this.getKey(projectId, filePath);

    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    const response = await this.client.send(command);
    const body = response.Body;

    if (!body) {
      throw new Error(`File not found: ${key}`);
    }

    const chunks: Buffer[] = [];
    for await (const chunk of body as any) {
      chunks.push(Buffer.from(chunk));
    }
    const content = Buffer.concat(chunks);

    return {
      content,
      metadata: {
        key,
        size: response.ContentLength || content.length,
        lastModified: response.LastModified || new Date(),
        contentType: response.ContentType || "application/octet-stream",
        etag: response.ETag,
      },
    };
  }

  /**
   * Get file content as text
   */
  async getFileAsText(
    projectId: string,
    filePath: string
  ): Promise<{ content: string; metadata: FileMetadata }> {
    const { content, metadata } = await this.getFile(projectId, filePath);
    return {
      content: content.toString("utf-8"),
      metadata,
    };
  }

  /**
   * Delete a file from storage
   */
  async deleteFile(projectId: string, filePath: string): Promise<void> {
    const bucket = this.defaultBucket;
    const key = this.getKey(projectId, filePath);

    const command = new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    await this.client.send(command);
  }

  /**
   * Delete a folder and all its contents
   */
  async deleteFolder(projectId: string, folderPath: string): Promise<void> {
    const bucket = this.defaultBucket;
    const prefix = this.getKey(projectId, folderPath);

    // List all objects with this prefix
    const objects = await this.listFiles(projectId, folderPath);

    // Delete all objects
    for (const obj of objects.files) {
      const command = new DeleteObjectCommand({
        Bucket: bucket,
        Key: obj.path,
      });
      await this.client.send(command);
    }
  }

  /**
   * List files and folders with optional prefix
   */
  async listFiles(
    projectId: string,
    folderPath: string = "",
    options: ListFilesOptions = {}
  ): Promise<{
    files: Array<{ path: string; size?: number; lastModified?: Date }>;
    folders: string[];
    continuationToken?: string;
  }> {
    const bucket = options.bucket || this.defaultBucket;
    const prefix = this.getKey(projectId, folderPath);

    // Ensure prefix ends with / for folder listing
    const searchPrefix = prefix.endsWith("/") ? prefix : `${prefix}/`;

    const command = new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: searchPrefix,
      Delimiter: options.delimiter || "/",
      MaxKeys: options.maxKeys || 1000,
      ContinuationToken: options.continuationToken,
    });

    const response = await this.client.send(command);

    const files: Array<{ path: string; size?: number; lastModified?: Date }> = [];
    const folders: string[] = [];

    // Process files
    if (response.Contents) {
      for (const obj of response.Contents) {
        // Get relative path from project root
        const relativePath = obj.Key!.replace(searchPrefix, "");
        if (relativePath) {
          files.push({
            path: relativePath,
            size: obj.Size,
            lastModified: obj.LastModified,
          });
        }
      }
    }

    // Process folders (common prefixes)
    if (response.CommonPrefixes) {
      for (const prefix of response.CommonPrefixes) {
        // Remove trailing slash and project prefix
        const folderPath = prefix.Prefix!
          .replace(searchPrefix, "")
          .replace(/\/$/, "");
        if (folderPath) {
          folders.push(folderPath);
        }
      }
    }

    return {
      files,
      folders,
      continuationToken: response.NextContinuationToken,
    };
  }

  /**
   * Get file tree structure for a project
   */
  async getFileTree(projectId: string, rootPath: string = ""): Promise<FileTreeNode[]> {
    const { files, folders } = await this.listFiles(projectId, rootPath);
    const treeNodes: FileTreeNode[] = [];

    // Process folders
    for (const folder of folders) {
      const fullPath = rootPath ? `${rootPath}/${folder}` : folder;
      treeNodes.push({
        id: uuidv4(),
        name: folder,
        type: "folder",
        path: fullPath,
        children: await this.getFileTree(projectId, fullPath),
      });
    }

    // Process files
    for (const file of files) {
      treeNodes.push({
        id: uuidv4(),
        name: path.basename(file.path),
        type: "file",
        path: file.path,
        size: file.size,
        lastModified: file.lastModified,
      });
    }

    // Sort: folders first, then files, alphabetically
    return treeNodes.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === "folder" ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });
  }

  /**
   * Generate a presigned URL for direct browser upload/download
   */
  async getPresignedUrl(
    projectId: string,
    filePath: string,
    options: PresignedUrlOptions
  ): Promise<string> {
    const bucket = this.defaultBucket;
    const key = this.getKey(projectId, filePath);

    let command;
    if (options.operation === "getObject") {
      command = new GetObjectCommand({
        Bucket: bucket,
        Key: key,
      });
    } else {
      command = new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        ContentType: options.contentType || this.getContentType(filePath),
      });
    }

    return getSignedUrl(this.client, command, {
      expiresIn: options.expiresIn || 3600, // 1 hour default
    });
  }

  /**
   * Copy a file within storage
   */
  async copyFile(
    projectId: string,
    sourcePath: string,
    destinationPath: string
  ): Promise<void> {
    const bucket = this.defaultBucket;
    const sourceKey = this.getKey(projectId, sourcePath);
    const destKey = this.getKey(projectId, destinationPath);

    const command = new CopyObjectCommand({
      Bucket: bucket,
      CopySource: `${bucket}/${sourceKey}`,
      Key: destKey,
    });

    await this.client.send(command);
  }

  /**
   * Move/rename a file
   */
  async moveFile(
    projectId: string,
    sourcePath: string,
    destinationPath: string
  ): Promise<void> {
    await this.copyFile(projectId, sourcePath, destinationPath);
    await this.deleteFile(projectId, sourcePath);
  }

  /**
   * Check if a file exists
   */
  async fileExists(projectId: string, filePath: string): Promise<boolean> {
    const bucket = this.defaultBucket;
    const key = this.getKey(projectId, filePath);

    try {
      const command = new HeadObjectCommand({
        Bucket: bucket,
        Key: key,
      });
      await this.client.send(command);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get file metadata without downloading
   */
  async getMetadata(
    projectId: string,
    filePath: string
  ): Promise<FileMetadata | null> {
    const bucket = this.defaultBucket;
    const key = this.getKey(projectId, filePath);

    try {
      const command = new HeadObjectCommand({
        Bucket: bucket,
        Key: key,
      });

      const response = await this.client.send(command);

      return {
        key,
        size: response.ContentLength || 0,
        lastModified: response.LastModified || new Date(),
        contentType: response.ContentType || "application/octet-stream",
        etag: response.ETag,
      };
    } catch {
      return null;
    }
  }

  /**
   * Create a new folder (empty marker file)
   */
  async createFolder(projectId: string, folderPath: string): Promise<void> {
    // S3 doesn't have real folders, but we can use a .keep file
    const markerPath = folderPath.endsWith("/")
      ? `${folderPath}.keep`
      : `${folderPath}/.keep`;
    await this.uploadFile(projectId, markerPath, "", {
      contentType: "text/plain",
    });
  }

  /**
   * Determine content type from file extension
   */
  private getContentType(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    const contentTypes: Record<string, string> = {
      ".ts": "application/typescript",
      ".tsx": "application/typescript",
      ".js": "application/javascript",
      ".jsx": "application/javascript",
      ".json": "application/json",
      ".md": "text/markdown",
      ".html": "text/html",
      ".css": "text/css",
      ".scss": "text/x-scss",
      ".less": "text/x-less",
      ".py": "text/x-python",
      ".rb": "text/x-ruby",
      ".go": "text/x-go",
      ".rs": "text/x-rust",
      ".java": "text/x-java",
      ".c": "text/x-c",
      ".cpp": "text/x-c++",
      ".h": "text/x-c",
      ".hpp": "text/x-c++",
      ".sql": "text/x-sql",
      ".xml": "application/xml",
      ".yaml": "application/yaml",
      ".yml": "application/yaml",
      ".svg": "image/svg+xml",
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".gif": "image/gif",
      ".ico": "image/x-icon",
      ".woff": "font/woff",
      ".woff2": "font/woff2",
      ".ttf": "font/ttf",
      ".eot": "application/vnd.ms-fontobject",
    };

    return contentTypes[ext] || "application/octet-stream";
  }

  /**
   * Get file extension from content type
   */
  getExtensionFromContentType(contentType: string): string {
    const reverseMap: Record<string, string> = {
      "application/typescript": ".ts",
      "application/javascript": ".js",
      "application/json": ".json",
      "text/markdown": ".md",
      "text/html": ".html",
      "text/css": ".css",
      "text/x-python": ".py",
      "text/x-ruby": ".rb",
      "text/x-go": ".go",
      "text/x-rust": ".rs",
      "text/x-java": ".java",
      "application/yaml": ".yaml",
      "image/svg+xml": ".svg",
      "application/octet-stream": ".bin",
    };

    return reverseMap[contentType] || "";
  }
}

export const fileStorageService = new FileStorageService();

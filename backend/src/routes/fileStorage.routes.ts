import { Router, Request, Response } from "express";
import { authenticate } from "../middleware/auth";
import { fileStorageService } from "../services/fileStorageService";

const router = Router();

/**
 * @route GET /api/v1/files/tree/:projectId
 * @desc Get file tree for a project
 * @access Private
 */
router.get(
  "/tree/:projectId",
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { projectId } = req.params;
      const { path } = req.query;

      const tree = await fileStorageService.getFileTree(
        projectId,
        path as string || ""
      );

      return res.json({
        success: true,
        data: { tree },
      });
    } catch (error) {
      console.error("Error getting file tree:", error);
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

/**
 * @route GET /api/v1/files/content/:projectId
 * @desc Get file content
 * @access Private
 */
router.get(
  "/content/:projectId",
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { projectId } = req.params;
      const { path } = req.query;

      if (!path) {
        return res.status(400).json({
          success: false,
          error: "path is required",
        });
      }

      const result = await fileStorageService.getFileAsText(projectId, path as string);

      return res.json({
        success: true,
        data: {
          content: result.content,
          metadata: result.metadata,
        },
      });
    } catch (error) {
      console.error("Error getting file content:", error);
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

/**
 * @route POST /api/v1/files/save/:projectId
 * @desc Save file content
 * @access Private
 */
router.post(
  "/save/:projectId",
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { projectId } = req.params;
      const { path, content, contentType } = req.body;

      if (!path || content === undefined) {
        return res.status(400).json({
          success: false,
          error: "path and content are required",
        });
      }

      const metadata = await fileStorageService.uploadFile(
        projectId,
        path,
        content,
        { contentType }
      );

      return res.json({
        success: true,
        data: { metadata },
      });
    } catch (error) {
      console.error("Error saving file:", error);
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

/**
 * @route DELETE /api/v1/files/:projectId
 * @desc Delete a file
 * @access Private
 */
router.delete(
  "/:projectId",
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { projectId } = req.params;
      const { path, recursive } = req.body;

      if (!path) {
        return res.status(400).json({
          success: false,
          error: "path is required",
        });
      }

      if (recursive) {
        await fileStorageService.deleteFolder(projectId, path);
      } else {
        await fileStorageService.deleteFile(projectId, path);
      }

      return res.json({
        success: true,
        message: "File deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting file:", error);
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

/**
 * @route POST /api/v1/files/upload/:projectId
 * @desc Get presigned URL for file upload
 * @access Private
 */
router.post(
  "/upload-url/:projectId",
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { projectId } = req.params;
      const { path, contentType, operation } = req.body;

      if (!path) {
        return res.status(400).json({
          success: false,
          error: "path is required",
        });
      }

      const url = await fileStorageService.getPresignedUrl(projectId, path, {
        operation: operation || "putObject",
        contentType,
        expiresIn: 3600,
      });

      return res.json({
        success: true,
        data: { url },
      });
    } catch (error) {
      console.error("Error generating upload URL:", error);
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

/**
 * @route POST /api/v1/files/create-folder/:projectId
 * @desc Create a new folder
 * @access Private
 */
router.post(
  "/create-folder/:projectId",
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { projectId } = req.params;
      const { path } = req.body;

      if (!path) {
        return res.status(400).json({
          success: false,
          error: "path is required",
        });
      }

      await fileStorageService.createFolder(projectId, path);

      return res.json({
        success: true,
        message: "Folder created successfully",
      });
    } catch (error) {
      console.error("Error creating folder:", error);
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

/**
 * @route POST /api/v1/files/move/:projectId
 * @desc Move/rename a file
 * @access Private
 */
router.post(
  "/move/:projectId",
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { projectId } = req.params;
      const { sourcePath, destinationPath } = req.body;

      if (!sourcePath || !destinationPath) {
        return res.status(400).json({
          success: false,
          error: "sourcePath and destinationPath are required",
        });
      }

      await fileStorageService.moveFile(projectId, sourcePath, destinationPath);

      return res.json({
        success: true,
        message: "File moved successfully",
      });
    } catch (error) {
      console.error("Error moving file:", error);
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

/**
 * @route POST /api/v1/files/copy/:projectId
 * @desc Copy a file
 * @access Private
 */
router.post(
  "/copy/:projectId",
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { projectId } = req.params;
      const { sourcePath, destinationPath } = req.body;

      if (!sourcePath || !destinationPath) {
        return res.status(400).json({
          success: false,
          error: "sourcePath and destinationPath are required",
        });
      }

      await fileStorageService.copyFile(projectId, sourcePath, destinationPath);

      return res.json({
        success: true,
        message: "File copied successfully",
      });
    } catch (error) {
      console.error("Error copying file:", error);
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

/**
 * @route GET /api/v1/files/metadata/:projectId
 * @desc Get file metadata
 * @access Private
 */
router.get(
  "/metadata/:projectId",
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { projectId } = req.params;
      const { path } = req.query;

      if (!path) {
        return res.status(400).json({
          success: false,
          error: "path is required",
        });
      }

      const metadata = await fileStorageService.getMetadata(projectId, path as string);

      if (!metadata) {
        return res.status(404).json({
          success: false,
          error: "File not found",
        });
      }

      return res.json({
        success: true,
        data: { metadata },
      });
    } catch (error) {
      console.error("Error getting file metadata:", error);
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

export default router;

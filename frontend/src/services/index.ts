// API Services
export { apiClient } from './api';
export { default as projectService, type Project, type CreateProjectParams, type ProjectMetrics } from './project';
export { default as fileStorageService, type FileInfo, type DirectoryContents, type UploadProgress, type FileSearchParams, type FileSearchResult } from './fileStorage.service';
export { default as deploymentService, type DeploymentConfig, type DeploymentStatus, type ContainerMetrics, type LogStreamParams, type RollbackParams, type DeployParams } from './deployment.service';

// WebSocket Services
export { 
  useWebSocket, 
  WebSocketProvider, 
  ConnectionStatusIndicator,
  type ConnectionStatus 
} from './websocket.service';

// WebSocket Integration
export { 
  default as wsIntegration,
  WS_EVENTS,
  useFileSync,
  useDeploymentSync,
  useTerminalSync,
  useEditorCollaboration,
  sendTerminalInput,
  broadcastCursorPosition,
  broadcastSelection,
} from './websocket.integration';

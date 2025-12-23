import { useEffect } from 'react';
import { useWebSocket } from './websocket.service';
import { useDeploymentStore, useFileStore } from '@/store';
import type { DeploymentLog } from '@/store/deploymentStore';

// WebSocket event types
export const WS_EVENTS = {
  // Connection events
  CONNECTION_STATUS: 'connection:status',
  
  // File events
  FILE_CREATED: 'file:created',
  FILE_UPDATED: 'file:updated',
  FILE_DELETED: 'file:deleted',
  FILE_MOVED: 'file:moved',
  
  // Deployment events
  DEPLOYMENT_STARTED: 'deployment:started',
  DEPLOYMENT_PROGRESS: 'deployment:progress',
  DEPLOYMENT_COMPLETED: 'deployment:completed',
  DEPLOYMENT_FAILED: 'deployment:failed',
  DEPLOYMENT_STOPPED: 'deployment:stopped',
  DEPLOYMENT_LOGS: 'deployment:logs',
  
  // Terminal events
  TERMINAL_OUTPUT: 'terminal:output',
  TERMINAL_INPUT: 'terminal:input',
  
  // Editor events
  EDITOR_CURSOR_MOVED: 'editor:cursor',
  EDITOR_SELECTION_CHANGED: 'editor:selection',
} as const;

interface FileCreatedPayload {
  file: {
    id: string;
    name: string;
    path: string;
    type: 'file' | 'folder';
  };
  parentPath: string;
}

interface FileUpdatedPayload {
  file: {
    id: string;
    path: string;
    content?: string;
  };
}

interface FileDeletedPayload {
  path: string;
  type: 'file' | 'folder';
}

interface FileMovedPayload {
  sourcePath: string;
  destinationPath: string;
  file: {
    id: string;
    name: string;
    path: string;
  };
}

interface DeploymentProgressPayload {
  deploymentId: string;
  status: 'building' | 'deploying';
  progress: number;
  message: string;
  stage?: string;
}

interface DeploymentLogsPayload {
  deploymentId: string;
  logs: DeploymentLog[];
  isComplete?: boolean;
}

interface TerminalOutputPayload {
  sessionId: string;
  data: string;
  type?: 'stdout' | 'stderr';
}

// Hook for real-time file updates
export function useFileSync(projectId: string) {
  const { subscribe, isConnected } = useWebSocket();
  const { addFile, updateFileContent, removeFile, renameFile } = useFileStore();

  useEffect(() => {
    if (!isConnected) return;

    // Subscribe to file events
    const unsubscribers = [
      subscribe(WS_EVENTS.FILE_CREATED, (message) => {
        const payload = message.payload as FileCreatedPayload;
        addFile(payload.parentPath, {
          id: payload.file.id,
          name: payload.file.name,
          path: payload.file.path,
          type: payload.file.type,
        });
      }),

      subscribe(WS_EVENTS.FILE_UPDATED, (message) => {
        const payload = message.payload as FileUpdatedPayload;
        if (payload.file.content !== undefined) {
          updateFileContent(payload.file.path, payload.file.content);
        }
      }),

      subscribe(WS_EVENTS.FILE_DELETED, (message) => {
        const payload = message.payload as FileDeletedPayload;
        removeFile(payload.path);
      }),

      subscribe(WS_EVENTS.FILE_MOVED, (message) => {
        const payload = message.payload as FileMovedPayload;
        renameFile(payload.sourcePath, payload.file.name);
      }),
    ];

    // Send project subscription
    subscribe('subscribe:project', () => {}); // Ensure we're subscribed

    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, [isConnected, projectId, subscribe, addFile, updateFileContent, removeFile, renameFile]);
}

// Hook for deployment updates
export function useDeploymentSync(deploymentId?: string) {
  const { subscribe, isConnected, sendMessage } = useWebSocket();
  const { 
    updateDeployment, 
    addLog, 
    appendLiveLog,
    setConnectionStatus 
  } = useDeploymentStore();

  useEffect(() => {
    if (!isConnected) {
      setConnectionStatus('disconnected');
      return;
    }

    setConnectionStatus('connected');

    // Subscribe to deployment events
    const unsubscribers = [
      subscribe(WS_EVENTS.CONNECTION_STATUS, (message) => {
        const payload = message.payload as { status: string };
        setConnectionStatus(payload.status as 'connected' | 'disconnected' | 'connecting');
      }),

      subscribe(WS_EVENTS.DEPLOYMENT_STARTED, (message) => {
        const payload = message.payload as { deploymentId: string; status: string };
        updateDeployment(payload.deploymentId, {
          status: payload.status as any,
        });
      }),

      subscribe(WS_EVENTS.DEPLOYMENT_PROGRESS, (message) => {
        const payload = message.payload as DeploymentProgressPayload;
        updateDeployment(payload.deploymentId, {
          status: payload.status === 'building' ? 'building' : 'deploying',
        });
        
        appendLiveLog(`[${payload.stage || 'Progress'}] ${payload.message} (${payload.progress}%)`);
      }),

      subscribe(WS_EVENTS.DEPLOYMENT_COMPLETED, (message) => {
        const payload = message.payload as {
          deploymentId: string;
          status: string;
          url?: string;
          containerId?: string;
          port?: number;
        };
        updateDeployment(payload.deploymentId, {
          status: 'running',
          url: payload.url,
          containerId: payload.containerId,
          port: payload.port,
          completedAt: new Date().toISOString(),
        });
        appendLiveLog(`✓ Deployment completed! URL: ${payload.url}`);
      }),

      subscribe(WS_EVENTS.DEPLOYMENT_FAILED, (message) => {
        const payload = message.payload as {
          deploymentId: string;
          error: string;
        };
        updateDeployment(payload.deploymentId, {
          status: 'failed',
          completedAt: new Date().toISOString(),
        });
        appendLiveLog(`✗ Deployment failed: ${payload.error}`);
      }),

      subscribe(WS_EVENTS.DEPLOYMENT_STOPPED, (message) => {
        const payload = message.payload as { deploymentId: string };
        updateDeployment(payload.deploymentId, {
          status: 'stopped',
          completedAt: new Date().toISOString(),
        });
        appendLiveLog('Deployment stopped');
      }),

      subscribe(WS_EVENTS.DEPLOYMENT_LOGS, (message) => {
        const payload = message.payload as DeploymentLogsPayload;
        
        // Add logs to deployment
        payload.logs.forEach((log) => {
          addLog(payload.deploymentId, log);
        });
        
        // Also append to live logs
        payload.logs.forEach((log) => {
          appendLiveLog(`[${log.timestamp}] [${log.level.toUpperCase()}] ${log.message}`);
        });

        if (payload.isComplete) {
          appendLiveLog('--- Log stream complete ---');
        }
      }),
    ];

    // Request deployment updates if deploymentId is provided
    if (deploymentId) {
      sendMessage('subscribe:deployment', { deploymentId });
    }

    return () => {
      unsubscribers.forEach((unsub) => unsub());
      if (deploymentId) {
        sendMessage('unsubscribe:deployment', { deploymentId });
      }
    };
  }, [isConnected, deploymentId, subscribe, sendMessage, updateDeployment, addLog, appendLiveLog, setConnectionStatus]);
}

// Hook for terminal streaming
export function useTerminalSync(sessionId: string) {
  const { subscribe, isConnected, sendMessage } = useWebSocket();

  useEffect(() => {
    if (!isConnected || !sessionId) return;

    const unsubscriber = subscribe(WS_EVENTS.TERMINAL_OUTPUT, (message) => {
      const payload = message.payload as TerminalOutputPayload;
      if (payload.sessionId === sessionId) {
        // Handle terminal output - this will be processed by the Terminal component
        window.dispatchEvent(new CustomEvent('terminal:output', { detail: payload }));
      }
    });

    // Subscribe to terminal session
    sendMessage('subscribe:terminal', { sessionId });

    return () => {
      unsubscriber();
      sendMessage('unsubscribe:terminal', { sessionId });
    };
  }, [isConnected, sessionId, subscribe, sendMessage]);
}

// Hook for editor collaboration
export function useEditorCollaboration(filePath: string) {
  const { subscribe, isConnected, sendMessage } = useWebSocket();

  useEffect(() => {
    if (!isConnected || !filePath) return;

    const unsubscribers = [
      subscribe(WS_EVENTS.EDITOR_CURSOR_MOVED, (message) => {
        const payload = message.payload as {
          filePath: string;
          userId: string;
          userName: string;
          position: { lineNumber: number; column: number };
          color: string;
        };
        if (payload.filePath === filePath) {
          window.dispatchEvent(new CustomEvent('editor:cursor', { detail: payload }));
        }
      }),

      subscribe(WS_EVENTS.EDITOR_SELECTION_CHANGED, (message) => {
        const payload = message.payload as {
          filePath: string;
          userId: string;
          userName: string;
          selection: {
            startLineNumber: number;
            startColumn: number;
            endLineNumber: number;
            endColumn: number;
          };
          color: string;
        };
        if (payload.filePath === filePath) {
          window.dispatchEvent(new CustomEvent('editor:selection', { detail: payload }));
        }
      }),
    ];

    // Subscribe to file edits
    sendMessage('subscribe:file', { filePath });

    return () => {
      unsubscribers.forEach((unsub) => unsub());
      sendMessage('unsubscribe:file', { filePath });
    };
  }, [isConnected, filePath, subscribe, sendMessage]);
}

// Utility function to send terminal input
export function sendTerminalInput(sessionId: string, data: string) {
  const { sendMessage } = useWebSocket.getState();
  sendMessage(WS_EVENTS.TERMINAL_INPUT, { sessionId, data });
}

// Utility function to broadcast cursor position
export function broadcastCursorPosition(
  filePath: string,
  position: { lineNumber: number; column: number }
) {
  const { sendMessage } = useWebSocket.getState();
  sendMessage(WS_EVENTS.EDITOR_CURSOR_MOVED, { filePath, position });
}

// Utility function to broadcast selection
export function broadcastSelection(
  filePath: string,
  selection: {
    startLineNumber: number;
    startColumn: number;
    endLineNumber: number;
    endColumn: number;
  }
) {
  const { sendMessage } = useWebSocket.getState();
  sendMessage(WS_EVENTS.EDITOR_SELECTION_CHANGED, { filePath, selection });
}

export default {
  WS_EVENTS,
  useFileSync,
  useDeploymentSync,
  useTerminalSync,
  useEditorCollaboration,
  sendTerminalInput,
  broadcastCursorPosition,
  broadcastSelection,
};

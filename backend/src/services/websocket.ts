import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { logger } from '../utils/logger';
import { WSEventType } from '@vibe/shared';

interface WebSocketClient {
  id: string;
  userId: string;
  projectId?: string;
  connectedAt: Date;
}

interface BroadcastOptions {
  room?: string;
  userId?: string;
  exclude?: string[];
}

export class WebSocketHandler {
  private io: Server | null = null;
  private clients: Map<string, WebSocketClient> = new Map();

  initialize(server: HttpServer): void {
    this.io = new Server(server, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true,
      },
      pingTimeout: 60000,
      pingInterval: 25000,
    });

    this.io.on('connection', (socket: Socket) => {
      this.handleConnection(socket);
    });

    logger.info('WebSocket server initialized');
  }

  private handleConnection(socket: Socket): void {
    const clientId = socket.id;
    logger.info('Client connected', { clientId });

    // Store client info
    this.clients.set(clientId, {
      id: clientId,
      userId: '',
      connectedAt: new Date(),
    });

    // Handle authentication
    socket.on('authenticate', (data: { userId: string; token: string }) => {
      // In production, verify the token here
      const client = this.clients.get(clientId);
      if (client) {
        client.userId = data.userId;
        socket.join(`user:${data.userId}`);
        logger.info('Client authenticated', { clientId, userId: data.userId });
      }
    });

    // Join project room
    socket.on('join-project', (data: { projectId: string }) => {
      const client = this.clients.get(clientId);
      if (client) {
        client.projectId = data.projectId;
        socket.join(`project:${data.projectId}`);

        // Notify others in the project
        this.broadcast({
          type: WSEventType.USER_JOINED,
          payload: {
            userId: client.userId,
            projectId: data.projectId,
          },
          room: `project:${data.projectId}`,
          exclude: [clientId],
        });

        logger.info('Client joined project', { clientId, projectId: data.projectId });
      }
    });

    // Leave project room
    socket.on('leave-project', (data: { projectId: string }) => {
      const client = this.clients.get(clientId);
      if (client) {
        socket.leave(`project:${data.projectId}`);

        this.broadcast({
          type: WSEventType.USER_LEFT,
          payload: {
            userId: client.userId,
            projectId: data.projectId,
          },
          room: `project:${data.projectId}`,
          exclude: [clientId],
        });

        logger.info('Client left project', { clientId, projectId: data.projectId });
      }
    });

    // Handle cursor position updates
    socket.on('cursor-move', (data: { projectId: string; position: { line: number; column: number }; file: string }) => {
      const client = this.clients.get(clientId);
      if (client) {
        this.broadcast({
          type: WSEventType.CURSOR_MOVED,
          payload: {
            userId: client.userId,
            ...data,
          },
          room: `project:${data.projectId}`,
          exclude: [clientId],
        });
      }
    });

    // Handle selection changes
    socket.on('selection-change', (data: { projectId: string; selection: { start: any; end: any }; file: string }) => {
      const client = this.clients.get(clientId);
      if (client) {
        this.broadcast({
          type: WSEventType.SELECTION_CHANGED,
          payload: {
            userId: client.userId,
            ...data,
          },
          room: `project:${data.projectId}`,
          exclude: [clientId],
        });
      }
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      const client = this.clients.get(clientId);
      if (client?.projectId) {
        this.broadcast({
          type: WSEventType.USER_LEFT,
          payload: {
            userId: client.userId,
            projectId: client.projectId,
          },
          room: `project:${client.projectId}`,
        });
      }

      this.clients.delete(clientId);
      logger.info('Client disconnected', { clientId, reason });
    });

    // Handle errors
    socket.on('error', (error) => {
      logger.error('Socket error', { clientId, error: error.message });
    });
  }

  broadcast(event: { type: WSEventType; payload: unknown }, options: BroadcastOptions = {}): void {
    if (!this.io) return;

    const { room, userId, exclude } = options;

    let targetRoom: string | undefined;

    if (room) {
      targetRoom = room;
    } else if (userId) {
      targetRoom = `user:${userId}`;
    }

    if (targetRoom) {
      const eventData = {
        ...event,
        timestamp: new Date(),
      };

      if (exclude && exclude.length > 0) {
        this.io.to(targetRoom).except(exclude).emit('event', eventData);
      } else {
        this.io.to(targetRoom).emit('event', eventData);
      }
    }
  }

  // Send to specific user
  sendToUser(userId: string, event: { type: WSEventType; payload: unknown }): void {
    this.broadcast(event, { userId });
  }

  // Send generation progress
  sendGenerationProgress(requestId: string, progress: { stage: string; percentage: number; message: string }): void {
    this.broadcast(
      {
        type: WSEventType.GENERATION_PROGRESS,
        payload: { requestId, ...progress },
      },
      { room: `generation:${requestId}` }
    );
  }

  // Send generation completed
  sendGenerationCompleted(requestId: string, result: unknown): void {
    this.broadcast(
      {
        type: WSEventType.GENERATION_COMPLETED,
        payload: { requestId, result },
      },
      { room: `generation:${requestId}` }
    );
  }

  // Send quality check progress
  sendQualityProgress(projectId: string, checkId: string, progress: { status: string; message: string }): void {
    this.broadcast(
      {
        type: WSEventType.QUALITY_CHECK_PROGRESS,
        payload: { projectId, checkId, ...progress },
      },
      { room: `project:${projectId}` }
    );
  }

  // Send deployment progress
  sendDeploymentProgress(deploymentId: string, progress: { status: string; message: string; logs?: string[] }): void {
    this.broadcast(
      {
        type: WSEventType.DEPLOYMENT_PROGRESS,
        payload: { deploymentId, ...progress },
      },
      { room: `deployment:${deploymentId}` }
    );
  }

  // Send notification
  sendNotification(userId: string, notification: { type: string; title: string; message: string }): void {
    this.broadcast(
      {
        type: WSEventType.NOTIFICATION,
        payload: notification,
      },
      { userId }
    );
  }

  // Get connected clients count
  getConnectedClientsCount(): number {
    return this.clients.size;
  }

  // Get clients in a project
  getProjectClients(projectId: string): string[] {
    const clients: string[] = [];
    for (const [id, client] of this.clients) {
      if (client.projectId === projectId) {
        clients.push(id);
      }
    }
    return clients;
  }
}

export const websocketHandler = new WebSocketHandler();

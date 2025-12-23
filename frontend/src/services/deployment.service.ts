import { apiClient } from './api';
import type { Deployment, DeploymentLog } from '@/store/deploymentStore';

// Types
export interface DeploymentConfig {
  environment: 'development' | 'staging' | 'production';
  containerPort?: number;
  envVariables?: Record<string, string>;
  resources?: {
    cpu?: string;
    memory?: string;
    disk?: string;
  };
  scaling?: {
    minReplicas: number;
    maxReplicas: number;
  };
}

export interface CreateDeploymentParams {
  projectId: string;
  version: string;
  config: DeploymentConfig;
}

export interface DeploymentStatus {
  deploymentId: string;
  status: Deployment['status'];
  containerId?: string;
  url?: string;
  port?: number;
  message?: string;
}

export interface ContainerMetrics {
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  networkIn: number;
  networkOut: number;
  uptime: number;
}

export interface LogStreamParams {
  deploymentId: string;
  tail?: number;
  since?: string;
  follow?: boolean;
  level?: 'info' | 'warn' | 'error' | 'debug';
}

export interface RollbackParams {
  deploymentId: string;
  targetVersion: string;
}

export interface DeployParams {
  projectId: string;
  environment: 'development' | 'staging' | 'production';
  version?: string;
  config?: Partial<DeploymentConfig>;
}

// Deployment service
export const deploymentService = {
  // Create a new deployment
  async createDeployment(params: CreateDeploymentParams): Promise<{
    deployment: Deployment;
  }> {
    return apiClient.post('/deploy', params);
  },

  // Get deployment by ID
  async getDeployment(deploymentId: string): Promise<{
    deployment: Deployment;
  }> {
    return apiClient.get(`/deploy/${deploymentId}`);
  },

  // Get all deployments for a project
  async getProjectDeployments(
    projectId: string,
    params?: {
      environment?: string;
      status?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<{
    deployments: Deployment[];
    total: number;
  }> {
    return apiClient.get(`/deploy/project/${projectId}`, params);
  },

  // Start deployment
  async deploy(params: DeployParams): Promise<{
    deployment: Deployment;
    actionId: string;
  }> {
    return apiClient.post('/deploy', params);
  },

  // Redeploy existing deployment
  async redeploy(deploymentId: string, version?: string): Promise<{
    deployment: Deployment;
    actionId: string;
  }> {
    return apiClient.post(`/deploy/${deploymentId}/redeploy`, { version });
  },

  // Stop deployment
  async stop(deploymentId: string): Promise<{
    deployment: Deployment;
    actionId: string;
  }> {
    return apiClient.post(`/deploy/${deploymentId}/stop`);
  },

  // Restart deployment
  async restart(deploymentId: string): Promise<{
    deployment: Deployment;
    actionId: string;
  }> {
    return apiClient.post(`/deploy/${deploymentId}/restart`);
  },

  // Rollback to previous version
  async rollback(params: RollbackParams): Promise<{
    deployment: Deployment;
    actionId: string;
  }> {
    return apiClient.post(`/deploy/${params.deploymentId}/rollback`, {
      targetVersion: params.targetVersion,
    });
  },

  // Get deployment logs
  async getLogs(
    deploymentId: string,
    params?: {
      tail?: number;
      since?: string;
      level?: string;
    }
  ): Promise<{
    logs: DeploymentLog[];
  }> {
    return apiClient.get(`/deploy/${deploymentId}/logs`, params);
  },

  // Stream logs (returns EventSource for real-time streaming)
  streamLogs(params: LogStreamParams): EventSource {
    const queryParams = new URLSearchParams();
    if (params.tail) queryParams.set('tail', params.tail.toString());
    if (params.since) queryParams.set('since', params.since);
    if (params.follow !== undefined) queryParams.set('follow', params.follow.toString());
    if (params.level) queryParams.set('level', params.level);

    const url = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/deploy/${params.deploymentId}/logs/stream?${queryParams.toString()}`;
    
    return new EventSource(url, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
      },
    });
  },

  // Get container metrics
  async getMetrics(deploymentId: string): Promise<{
    metrics: ContainerMetrics;
    history: Array<{
      timestamp: string;
      cpuUsage: number;
      memoryUsage: number;
    }>;
  }> {
    return apiClient.get(`/deploy/${deploymentId}/metrics`);
  },

  // Update deployment configuration
  async updateConfig(
    deploymentId: string,
    config: Partial<DeploymentConfig>
  ): Promise<{
    deployment: Deployment;
  }> {
    return apiClient.patch(`/deploy/${deploymentId}/config`, config);
  },

  // Get deployment history
  async getHistory(
    projectId: string,
    environment?: string,
    limit: number = 20
  ): Promise<{
    deployments: Deployment[];
  }> {
    return apiClient.get(`/deploy/project/${projectId}/history`, {
      environment,
      limit,
    });
  },

  // Get available versions for rollback
  async getAvailableVersions(projectId: string, environment: string): Promise<{
    versions: string[];
  }> {
    return apiClient.get(`/deploy/project/${projectId}/versions`, {
      environment,
    });
  },

  // Delete deployment
  async deleteDeployment(deploymentId: string): Promise<void> {
    return apiClient.delete(`/deploy/${deploymentId}`);
  },

  // Get deployment URL
  async getDeploymentUrl(deploymentId: string): Promise<{
    url: string;
    previewUrl?: string;
  }> {
    return apiClient.get(`/deploy/${deploymentId}/url`);
  },

  // Health check
  async healthCheck(deploymentId: string): Promise<{
    status: 'healthy' | 'unhealthy' | 'unknown';
    latency: number;
    lastChecked: string;
  }> {
    return apiClient.get(`/deploy/${deploymentId}/health`);
  },
};

export default deploymentService;

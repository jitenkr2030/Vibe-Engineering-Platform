import Dockerode, { DockerOptions, NetworkInspectInfo, ContainerInspectInfo } from "dockerode";
import * as path from "path";
import { EventEmitter } from "events";
import { PassThrough } from "stream";

// Types for deployment
export type DeploymentStatus =
  | "pending"
  | "building"
  | "pushing"
  | "deploying"
  | "running"
  | "failed"
  | "stopping"
  | "stopped"
  | "rolling_back";

export type CloudProvider = "local" | "aws" | "gcp" | "azure";

export interface DeploymentConfig {
  projectId: string;
  projectName: string;
  containerName: string;
  image: string;
  tag: string;
  ports: number[];
  environment: Record<string, string>;
  volumes?: Record<string, string>;
  healthCheck?: {
    test: string[];
    interval: number;
    timeout: number;
    retries: number;
    startPeriod: number;
  };
  resources?: {
    memory?: string;
    cpu?: string;
  };
  cloudProvider?: CloudProvider;
  cloudConfig?: Record<string, any>;
}

export interface DeploymentInfo {
  id: string;
  projectId: string;
  status: DeploymentStatus;
  containerId?: string;
  imageName: string;
  tag: string;
  ports: number[];
  createdAt: Date;
  updatedAt: Date;
  deployedAt?: Date;
  logs?: string;
  endpoint?: string;
  error?: string;
}

export interface DeploymentLog {
  timestamp: Date;
  type: "info" | "warn" | "error" | "debug";
  message: string;
  stream?: "stdout" | "stderr";
}

export interface CloudProviderConfig {
  aws?: {
    region: string;
    ecrRepository?: string;
    fargate?: boolean;
  };
  gcp?: {
    projectId: string;
    region: string;
    artifactRegistry?: string;
    cloudRun?: boolean;
  };
  azure?: {
    subscriptionId: string;
    resourceGroup: string;
    containerRegistry?: string;
    appService?: boolean;
  };
}

class DeploymentService extends EventEmitter {
  private docker: Dockerode | null = null;
  private deployments: Map<string, DeploymentInfo> = new Map();
  private logStreams: Map<string, PassThrough> = new Map();

  constructor() {
    super();
    this.initializeDocker();
  }

  /**
   * Initialize Docker connection
   */
  private async initializeDocker() {
    try {
      const dockerOptions: DockerOptions = {
        socketPath: process.env.DOCKER_SOCKET || "/var/run/docker.sock",
      };

      // For local development, try TCP connection
      if (process.env.DOCKER_HOST) {
        dockerOptions.host = process.env.DOCKER_HOST;
        dockerOptions.port = parseInt(process.env.DOCKER_PORT || "2375");
      }

      this.docker = new Dockerode(dockerOptions);

      // Verify connection
      await this.docker.ping();
      console.log("Docker connection established");
    } catch (error) {
      console.warn("Docker not available, running in mock mode:", error);
      this.docker = null;
    }
  }

  /**
   * Check if Docker is available
   */
  isDockerAvailable(): boolean {
    return this.docker !== null;
  }

  /**
   * Create a new deployment
   */
  async createDeployment(config: DeploymentConfig): Promise<DeploymentInfo> {
    const deployment: DeploymentInfo = {
      id: `deploy-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      projectId: config.projectId,
      status: "pending",
      imageName: config.image,
      tag: config.tag,
      ports: config.ports,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.deployments.set(deployment.id, deployment);
    this.emit("deployment:created", deployment);

    // Start deployment process
    this.startDeployment(deployment.id, config).catch((error) => {
      this.updateDeploymentStatus(deployment.id, "failed", error.message);
    });

    return deployment;
  }

  /**
   * Start the deployment process
   */
  private async startDeployment(
    deploymentId: string,
    config: DeploymentConfig
  ): Promise<void> {
    const deployment = this.deployments.get(deploymentId);
    if (!deployment) throw new Error("Deployment not found");

    try {
      // Step 1: Build/Pull image
      this.updateDeploymentStatus(deploymentId, "building");
      await this.buildOrPullImage(config);
      this.log(deploymentId, "info", `Image ${config.image}:${config.tag} ready`);

      // Step 2: Stop existing container if any
      await this.stopContainer(config.containerName);

      // Step 3: Deploy container
      this.updateDeploymentStatus(deploymentId, "deploying");
      const container = await this.runContainer(config);
      deployment.containerId = container.id;
      this.log(deploymentId, "info", `Container started: ${container.id}`);

      // Step 4: Wait for container to be running
      await this.waitForContainer(container.id);

      // Step 5: Get endpoint
      const endpoint = this.getEndpoint(config);
      deployment.endpoint = endpoint;

      // Final status
      this.updateDeploymentStatus(deploymentId, "running");
      deployment.deployedAt = new Date();
      this.log(deploymentId, "info", `Deployment successful at ${endpoint}`);
    } catch (error) {
      this.updateDeploymentStatus(
        deploymentId,
        "failed",
        error instanceof Error ? error.message : "Unknown error"
      );
      throw error;
    }
  }

  /**
   * Build or pull a Docker image
   */
  private async buildOrPullImage(config: DeploymentConfig): Promise<void> {
    if (!this.docker) {
      // Mock mode - simulate build
      this.log(
        config.projectId,
        "info",
        `[Mock] Building image ${config.image}:${config.tag}`
      );
      await new Promise((resolve) => setTimeout(resolve, 2000));
      return;
    }

    const imageName = `${config.image}:${config.tag}`;

    try {
      // Try to pull the image first
      await this.docker.pull(imageName);
    } catch {
      // If pull fails, try to build (for local builds)
      // In a real implementation, you would have Dockerfile parsing here
      this.log(
        config.projectId,
        "info",
        `Pull failed, using existing image or building`
      );
    }
  }

  /**
   * Run a Docker container
   */
  private async runContainer(config: DeploymentConfig): Promise<{ id: string }> {
    if (!this.docker) {
      // Mock mode
      this.log(
        config.projectId,
        "info",
        `[Mock] Starting container ${config.containerName}`
      );
      return { id: `mock-container-${Date.now()}` };
    }

    const container = await this.docker.createContainer({
      Image: `${config.image}:${config.tag}`,
      name: config.containerName,
      HostConfig: {
        PortBindings: config.ports.reduce((acc, port) => {
          acc[`${port}/tcp`] = [{ HostPort: `${port}` }];
          return acc;
        }, {} as Record<string, Array<{ HostPort: string }>),
        Memory: config.resources?.memory
          ? parseInt(config.resources.memory)
          : 512 * 1024 * 1024,
        CpuQuota: config.resources?.cpu
          ? parseFloat(config.resources.cpu) * 100000
          : 50000,
        Binds: config.volumes
          ? Object.entries(config.volumes).map(([hostPath, containerPath]) => {
              return `${hostPath}:${containerPath}`;
            })
          : undefined,
        RestartPolicy: {
          Name: "unless-stopped",
        },
        NetworkMode: "bridge",
      },
      Env: Object.entries(config.environment).map(([key, value]) => {
        return `${key}=${value}`;
      }),
      ExposedPorts: config.ports.reduce((acc, port) => {
        acc[`${port}/tcp`] = {};
        return acc;
      }, {} as Record<string, {}>),
    });

    await container.start();
    return { id: container.id };
  }

  /**
   * Stop a container
   */
  private async stopContainer(containerName: string): Promise<void> {
    if (!this.docker) {
      this.log(containerName, "info", `[Mock] Stopping container`);
      return;
    }

    try {
      const containers = await this.docker.listContainers({
        filters: { name: [containerName] },
      });

      if (containers.length > 0) {
        const container = this.docker.getContainer(containers[0].Id);
        try {
          await container.stop({ t: 10 });
          await container.remove({ v: true });
          this.log(containerName, "info", "Existing container stopped and removed");
        } catch {
          // Container might already be stopped
        }
      }
    } catch (error) {
      console.warn("Error stopping container:", error);
    }
  }

  /**
   * Wait for container to be running
   */
  private async waitForContainer(containerId: string, maxWait = 30000): Promise<void> {
    if (!this.docker) return;

    const startTime = Date.now();

    while (Date.now() - startTime < maxWait) {
      try {
        const container = this.docker!.getContainer(containerId);
        const inspect = await container.inspect();
        if (inspect.State.Running) {
          return;
        }
      } catch {
        // Container might not exist yet
      }
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    throw new Error("Container failed to start within timeout");
  }

  /**
   * Get the deployment endpoint
   */
  private getEndpoint(config: DeploymentConfig): string {
    const host = process.env.DEPLOYMENT_HOST || "localhost";
    const port = config.ports[0] || 3000;
    return `http://${host}:${port}`;
  }

  /**
   * Update deployment status
   */
  private updateDeploymentStatus(
    deploymentId: string,
    status: DeploymentStatus,
    error?: string
  ): void {
    const deployment = this.deployments.get(deploymentId);
    if (deployment) {
      deployment.status = status;
      deployment.updatedAt = new Date();
      if (error) {
        deployment.error = error;
      }
      this.emit("deployment:status", deployment);
    }
  }

  /**
   * Log a message for a deployment
   */
  private log(
    deploymentId: string,
    type: DeploymentLog["type"],
    message: string
  ): void {
    const log: DeploymentLog = {
      timestamp: new Date(),
      type,
      message,
    };
    this.emit("deployment:log", { deploymentId, log });

    // Also append to deployment logs
    const deployment = this.deployments.get(deploymentId);
    if (deployment) {
      deployment.logs = (deployment.logs || "") + `[${type}] ${message}\n`;
    }
  }

  /**
   * Get deployment by ID
   */
  getDeployment(deploymentId: string): DeploymentInfo | undefined {
    return this.deployments.get(deploymentId);
  }

  /**
   * Get deployments for a project
   */
  getProjectDeployments(projectId: string): DeploymentInfo[] {
    return Array.from(this.deployments.values())
      .filter((d) => d.projectId === projectId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Get current (latest) deployment for a project
   */
  getCurrentDeployment(projectId: string): DeploymentInfo | undefined {
    return this.getProjectDeployments(projectId)[0];
  }

  /**
   * Stream deployment logs
   */
  async streamLogs(
    deploymentId: string,
    onLog: (log: DeploymentLog) => void
  ): Promise<() => void> {
    const deployment = this.deployments.get(deploymentId);
    if (!deployment?.containerId) {
      return () => {};
    }

    if (!this.docker) {
      // Mock logs
      const mockLogs = [
        { timestamp: new Date(), type: "info" as const, message: "Container started" },
        { timestamp: new Date(), type: "info" as const, message: "Application ready" },
      ];
      mockLogs.forEach((log, i) => {
        setTimeout(() => onLog(log), i * 500);
      });
      return () => {};
    }

    const container = this.docker.getContainer(deployment.containerId);
    const stream = await container.logs({
      stdout: true,
      stderr: true,
      follow: true,
      tail: 100,
    });

    const passThrough = new PassThrough();
    stream.pipe(passThrough);

    const onData = (chunk: Buffer) => {
      const lines = chunk.toString().split("\n");
      for (const line of lines) {
        if (line.trim()) {
          onLog({
            timestamp: new Date(),
            type: line.startsWith("\u0001")
              ? "info"
              : line.startsWith("\u0002")
                ? "error"
                : "info",
            message: line.replace(/^[\u0001\u0002]/, "").trim(),
          });
        }
      }
    };

    passThrough.on("data", onData);

    return () => {
      passThrough.removeListener("data", onData);
      passThrough.end();
    };
  }

  /**
   * Stop a deployment
   */
  async stopDeployment(deploymentId: string): Promise<void> {
    const deployment = this.deployments.get(deploymentId);
    if (!deployment) throw new Error("Deployment not found");

    this.updateDeploymentStatus(deploymentId, "stopping");

    if (this.docker && deployment.containerId) {
      try {
        const container = this.docker.getContainer(deployment.containerId);
        await container.stop({ t: 10 });
        await container.remove({ v: true });
      } catch (error) {
        console.warn("Error stopping container:", error);
      }
    }

    this.updateDeploymentStatus(deploymentId, "stopped");
    this.log(deploymentId, "info", "Deployment stopped");
  }

  /**
   * Rollback to previous deployment
   */
  async rollbackDeployment(projectId: string): Promise<DeploymentInfo | null> {
    const deployments = this.getProjectDeployments(projectId);
    const current = deployments.find((d) => d.status === "running");
    const previous = deployments.find(
      (d) => d.id !== current?.id && d.status === "running"
    );

    if (!previous) {
      throw new Error("No previous deployment available for rollback");
    }

    // Create a new deployment with the same config as previous
    // For simplicity, we'll just update status
    this.updateDeploymentStatus(previous.id, "pending");
    this.startDeployment(previous.id, {
      projectId,
      projectName: "",
      containerName: `deploy-${projectId}`,
      image: previous.imageName,
      tag: previous.tag,
      ports: previous.ports,
      environment: {},
    });

    return previous;
  }

  /**
   * Get deployment statistics
   */
  async getStats(): Promise<{
    total: number;
    running: number;
    failed: number;
    stopped: number;
  }> {
    const deployments = Array.from(this.deployments.values());

    return {
      total: deployments.length,
      running: deployments.filter((d) => d.status === "running").length,
      failed: deployments.filter((d) => d.status === "failed").length,
      stopped: deployments.filter((d) => d.status === "stopped").length,
    };
  }

  /**
   * Clean up old deployments
   */
  async cleanupOldDeployments(
    projectId: string,
    keepCount: number = 5
  ): Promise<void> {
    const deployments = this.getProjectDeployments(projectId);
    const toRemove = deployments.slice(keepCount);

    for (const deployment of toRemove) {
      if (deployment.containerId && this.docker) {
        try {
          const container = this.docker.getContainer(deployment.containerId);
          await container.remove({ v: true, force: true });
        } catch {
          // Container might already be removed
        }
      }
      this.deployments.delete(deployment.id);
    }
  }

  /**
   * Get container inspect info
   */
  async getContainerInfo(
    deploymentId: string
  ): Promise<ContainerInspectInfo | null> {
    const deployment = this.deployments.get(deploymentId);
    if (!deployment?.containerId || !this.docker) return null;

    try {
      const container = this.docker.getContainer(deployment.containerId);
      return await container.inspect();
    } catch {
      return null;
    }
  }

  /**
   * Check network connectivity
   */
  async checkNetwork(): Promise<boolean> {
    if (!this.docker) return false;
    try {
      const networks = await this.docker.listNetworks();
      return networks.length > 0;
    } catch {
      return false;
    }
  }
}

export const deploymentService = new DeploymentService();

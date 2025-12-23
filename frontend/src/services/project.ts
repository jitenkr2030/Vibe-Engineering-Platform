import { apiClient } from './api';

export interface Project {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  visibility: 'private' | 'team' | 'public';
  status: 'planning' | 'in_progress' | 'review' | 'deployed' | 'archived';
  techStack?: Record<string, unknown>;
  architecture?: Record<string, unknown>;
  metrics?: ProjectMetrics;
  createdAt: string;
  updatedAt: string;
  owner?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface ProjectMetrics {
  fileCount: number;
  totalLines: number;
  qualityScore?: number;
}

export interface CreateProjectParams {
  name: string;
  description?: string;
  visibility?: 'private' | 'team' | 'public';
  techStack?: Record<string, unknown>;
  architecture?: Record<string, unknown>;
}

export interface ProjectListResponse {
  projects: Project[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export const projectService = {
  async getProjects(params?: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    search?: string;
    status?: string;
  }): Promise<ProjectListResponse> {
    return apiClient.get('/projects', params);
  },

  async getProject(id: string): Promise<{ project: Project }> {
    return apiClient.get(`/projects/${id}`);
  },

  async createProject(params: CreateProjectParams): Promise<{ project: Project }> {
    return apiClient.post('/projects', params);
  },

  async updateProject(id: string, params: Partial<CreateProjectParams>): Promise<{ project: Project }> {
    return apiClient.patch(`/projects/${id}`, params);
  },

  async deleteProject(id: string): Promise<void> {
    return apiClient.delete(`/projects/${id}`);
  },

  async getProjectMetrics(id: string): Promise<{ metrics: ProjectMetrics }> {
    return apiClient.get(`/projects/${id}/metrics`);
  },

  async addCollaborator(
    projectId: string,
    params: { email: string; role: 'admin' | 'developer' | 'viewer' }
  ): Promise<{ collaborator: any }> {
    return apiClient.post(`/projects/${projectId}/collaborators`, params);
  },

  async removeCollaborator(projectId: string, userId: string): Promise<void> {
    return apiClient.delete(`/projects/${projectId}/collaborators/${userId}`);
  },
};

export default projectService;

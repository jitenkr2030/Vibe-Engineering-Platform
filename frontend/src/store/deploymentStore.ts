import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// Types
export interface Deployment {
  id: string;
  projectId: string;
  environment: 'development' | 'staging' | 'production';
  status: 'pending' | 'building' | 'deploying' | 'running' | 'failed' | 'stopped';
  version: string;
  containerId?: string;
  url?: string;
  port?: number;
  logs: DeploymentLog[];
  metrics?: DeploymentMetrics;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface DeploymentLog {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  source?: string;
}

export interface DeploymentMetrics {
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  networkIn: number;
  networkOut: number;
  uptime: number;
  requestCount: number;
  errorCount: number;
}

export interface DeploymentAction {
  type: 'deploy' | 'redeploy' | 'restart' | 'stop' | 'rollback';
  deploymentId: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  startedAt: string;
  completedAt?: string;
  error?: string;
}

interface DeploymentStoreState {
  // Deployments
  deployments: Deployment[];
  currentDeployment: Deployment | null;
  deploymentHistory: Deployment[];
  
  // Actions queue
  actionQueue: DeploymentAction[];
  isProcessing: boolean;
  
  // Live updates
  liveLogs: string[];
  connectionStatus: 'connected' | 'disconnected' | 'connecting';
  
  // Filters
  environmentFilter: 'all' | 'development' | 'staging' | 'production';
  statusFilter: 'all' | 'pending' | 'building' | 'deploying' | 'running' | 'failed' | 'stopped';
  
  // Actions
  setDeployments: (deployments: Deployment[]) => void;
  addDeployment: (deployment: Deployment) => void;
  updateDeployment: (id: string, updates: Partial<Deployment>) => void;
  setCurrentDeployment: (deployment: Deployment | null) => void;
  removeDeployment: (id: string) => void;
  addLog: (deploymentId: string, log: DeploymentLog) => void;
  setLiveLogs: (logs: string[]) => void;
  appendLiveLog: (log: string) => void;
  clearLiveLogs: () => void;
  addAction: (action: DeploymentAction) => void;
  updateAction: (actionId: string, updates: Partial<DeploymentAction>) => void;
  removeAction: (actionId: string) => void;
  setProcessing: (processing: boolean) => void;
  setConnectionStatus: (status: 'connected' | 'disconnected' | 'connecting') => void;
  setEnvironmentFilter: (filter: 'all' | 'development' | 'staging' | 'production') => void;
  setStatusFilter: (filter: 'all' | 'pending' | 'building' | 'deploying' | 'running' | 'failed' | 'stopped') => void;
  reset: () => void;
}

const initialState = {
  deployments: [],
  currentDeployment: null,
  deploymentHistory: [],
  actionQueue: [],
  isProcessing: false,
  liveLogs: [],
  connectionStatus: 'disconnected',
  environmentFilter: 'all' as const,
  statusFilter: 'all' as const,
};

export const useDeploymentStore = create<DeploymentStoreState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      setDeployments: (deployments) => set(
        { deployments }, 
        false, 
        'deploymentStore/setDeployments'
      ),
      
      addDeployment: (deployment) => set(
        (state) => ({ deployments: [...state.deployments, deployment] }),
        false,
        'deploymentStore/addDeployment'
      ),
      
      updateDeployment: (id, updates) => set(
        (state) => ({
          deployments: state.deployments.map((d) =>
            d.id === id ? { ...d, ...updates } : d
          ),
          currentDeployment: state.currentDeployment?.id === id
            ? { ...state.currentDeployment, ...updates }
            : state.currentDeployment,
        }),
        false,
        'deploymentStore/updateDeployment'
      ),
      
      setCurrentDeployment: (deployment) => set(
        { currentDeployment: deployment },
        false,
        'deploymentStore/setCurrentDeployment'
      ),
      
      removeDeployment: (id) => set(
        (state) => ({
          deployments: state.deployments.filter((d) => d.id !== id),
          currentDeployment: state.currentDeployment?.id === id ? null : state.currentDeployment,
        }),
        false,
        'deploymentStore/removeDeployment'
      ),
      
      addLog: (deploymentId, log) => set(
        (state) => ({
          deployments: state.deployments.map((d) =>
            d.id === deploymentId
              ? { ...d, logs: [...d.logs, log] }
              : d
          ),
          currentDeployment: state.currentDeployment?.id === deploymentId
            ? { ...state.currentDeployment, logs: [...state.currentDeployment.logs, log] }
            : state.currentDeployment,
        }),
        false,
        'deploymentStore/addLog'
      ),
      
      setLiveLogs: (logs) => set(
        { liveLogs: logs },
        false,
        'deploymentStore/setLiveLogs'
      ),
      
      appendLiveLog: (log) => set(
        (state) => ({
          liveLogs: [...state.liveLogs, log].slice(-1000), // Keep last 1000 lines
        }),
        false,
        'deploymentStore/appendLiveLog'
      ),
      
      clearLiveLogs: () => set(
        { liveLogs: [] },
        false,
        'deploymentStore/clearLiveLogs'
      ),
      
      addAction: (action) => set(
        (state) => ({
          actionQueue: [...state.actionQueue, action],
        }),
        false,
        'deploymentStore/addAction'
      ),
      
      updateAction: (actionId, updates) => set(
        (state) => ({
          actionQueue: state.actionQueue.map((a) =>
            a.type === updates.type && a.deploymentId === (updates as any).deploymentId
              ? { ...a, ...updates }
              : a
          ),
        }),
        false,
        'deploymentStore/updateAction'
      ),
      
      removeAction: (actionId) => set(
        (state) => ({
          actionQueue: state.actionQueue.filter((a) => 
            !(a.type === (actionId as any).type && a.deploymentId === (actionId as any).deploymentId)
          ),
        }),
        false,
        'deploymentStore/removeAction'
      ),
      
      setProcessing: (processing) => set(
        { isProcessing: processing },
        false,
        'deploymentStore/setProcessing'
      ),
      
      setConnectionStatus: (status) => set(
        { connectionStatus: status },
        false,
        'deploymentStore/setConnectionStatus'
      ),
      
      setEnvironmentFilter: (filter) => set(
        { environmentFilter: filter },
        false,
        'deploymentStore/setEnvironmentFilter'
      ),
      
      setStatusFilter: (filter) => set(
        { statusFilter: filter },
        false,
        'deploymentStore/setStatusFilter'
      ),
      
      reset: () => set(initialState, false, 'deploymentStore/reset'),
    }),
    { name: 'DeploymentStore' }
  )
);

// Selectors
export const selectFilteredDeployments = (state: DeploymentStoreState) => {
  return state.deployments.filter((d) => {
    const matchesEnvironment = state.environmentFilter === 'all' || d.environment === state.environmentFilter;
    const matchesStatus = state.statusFilter === 'all' || d.status === state.statusFilter;
    return matchesEnvironment && matchesStatus;
  });
};

export const selectRunningDeployments = (state: DeploymentStoreState) => {
  return state.deployments.filter((d) => d.status === 'running');
};

export const selectFailedDeployments = (state: DeploymentStoreState) => {
  return state.deployments.filter((d) => d.status === 'failed');
};

export const selectDeploymentById = (id: string) => (state: DeploymentStoreState) => {
  return state.deployments.find((d) => d.id === id);
};

export default useDeploymentStore;

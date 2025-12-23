'use client';

import { useCallback, useState, useEffect } from 'react';
import { useDeploymentStore } from '@/store';
import { deploymentService } from '@/services';
import { useDeploymentSync, WS_EVENTS } from '@/services/websocket.integration';
import type { Deployment, DeploymentConfig, DeploymentLog, DeployParams } from '@/store';

// Hook for deployment operations with state management
export function useDeploymentOperations(projectId: string, initialEnvironment?: string) {
  const {
    deployments,
    currentDeployment,
    liveLogs,
    connectionStatus,
    environmentFilter,
    statusFilter,
    setDeployments,
    setCurrentDeployment,
    updateDeployment,
    addLog,
    appendLiveLog,
    clearLiveLogs,
    setConnectionStatus,
    setEnvironmentFilter,
    setStatusFilter,
    reset,
  } = useDeploymentStore();

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Enable real-time deployment sync
  useDeploymentSync(currentDeployment?.id);

  // Load deployments for project
  const loadDeployments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await deploymentService.getProjectDeployments(projectId, {
        environment: environmentFilter !== 'all' ? environmentFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      });
      setDeployments(response.deployments);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load deployments');
    } finally {
      setIsLoading(false);
    }
  }, [projectId, environmentFilter, statusFilter, setDeployments]);

  // Load single deployment
  const loadDeployment = useCallback(async (deploymentId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await deploymentService.getDeployment(deploymentId);
      setCurrentDeployment(response.deployment);
      return response.deployment;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load deployment');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [setCurrentDeployment, setLoading]);

  // Deploy project
  const deploy = useCallback(async (params: DeployParams) => {
    setIsLoading(true);
    setError(null);
    clearLiveLogs();
    appendLiveLog(`Starting deployment to ${params.environment}...`);

    try {
      const response = await deploymentService.deploy(params);
      setCurrentDeployment(response.deployment);
      appendLiveLog(`Deployment initiated with ID: ${response.deployment.id}`);
      return response.deployment;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Deployment failed';
      appendLiveLog(`✗ ${message}`);
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [setCurrentDeployment, clearLiveLogs, appendLiveLog]);

  // Redeploy
  const redeploy = useCallback(async (deploymentId: string, version?: string) => {
    setIsLoading(true);
    setError(null);
    clearLiveLogs();
    appendLiveLog('Starting redeployment...');

    try {
      const response = await deploymentService.redeploy(deploymentId, version);
      updateDeployment(deploymentId, {
        status: 'building',
        version: response.deployment.version,
      });
      appendLiveLog('Redeployment initiated');
      return response.deployment;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Redeployment failed';
      appendLiveLog(`✗ ${message}`);
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [updateDeployment, clearLiveLogs, appendLiveLog]);

  // Stop deployment
  const stop = useCallback(async (deploymentId: string) => {
    setIsLoading(true);
    setError(null);
    appendLiveLog('Stopping deployment...');

    try {
      await deploymentService.stop(deploymentId);
      updateDeployment(deploymentId, { status: 'stopped' });
      appendLiveLog('Deployment stopped');
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to stop deployment';
      appendLiveLog(`✗ ${message}`);
      setError(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [updateDeployment, appendLiveLog]);

  // Restart deployment
  const restart = useCallback(async (deploymentId: string) => {
    setIsLoading(true);
    setError(null);
    clearLiveLogs();
    appendLiveLog('Restarting deployment...');

    try {
      const response = await deploymentService.restart(deploymentId);
      updateDeployment(deploymentId, { status: 'building' });
      appendLiveLog('Restart initiated');
      return response.deployment;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Restart failed';
      appendLiveLog(`✗ ${message}`);
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [updateDeployment, clearLiveLogs, appendLiveLog]);

  // Rollback deployment
  const rollback = useCallback(async (deploymentId: string, targetVersion: string) => {
    setIsLoading(true);
    setError(null);
    clearLiveLogs();
    appendLiveLog(`Rolling back to version ${targetVersion}...`);

    try {
      const response = await deploymentService.rollback({
        deploymentId,
        targetVersion,
      });
      updateDeployment(deploymentId, {
        status: 'building',
        version: response.deployment.version,
      });
      appendLiveLog('Rollback initiated');
      return response.deployment;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Rollback failed';
      appendLiveLog(`✗ ${message}`);
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [updateDeployment, clearLiveLogs, appendLiveLog]);

  // Get deployment logs
  const loadLogs = useCallback(async (deploymentId: string, tail?: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await deploymentService.getLogs(deploymentId, { tail });
      // Add logs to store
      response.logs.forEach((log) => {
        addLog(deploymentId, log);
        appendLiveLog(`[${log.timestamp}] [${log.level.toUpperCase()}] ${log.message}`);
      });
      return response.logs;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load logs');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [addLog, appendLiveLog]);

  // Get available versions for rollback
  const getAvailableVersions = useCallback(async (environment: string) => {
    try {
      const response = await deploymentService.getAvailableVersions(projectId, environment);
      return response.versions;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get versions');
      return [];
    }
  }, [projectId]);

  // Get deployment URL
  const getDeploymentUrl = useCallback(async (deploymentId: string) => {
    try {
      const response = await deploymentService.getDeploymentUrl(deploymentId);
      return response;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get deployment URL');
      return null;
    }
  }, []);

  // Health check
  const checkHealth = useCallback(async (deploymentId: string) => {
    try {
      const response = await deploymentService.healthCheck(deploymentId);
      return response;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Health check failed');
      return null;
    }
  }, []);

  // Set current deployment and load its logs
  const selectDeployment = useCallback(async (deployment: Deployment | null) => {
    setCurrentDeployment(deployment);
    clearLiveLogs();
    
    if (deployment) {
      appendLiveLog(`Selected deployment: ${deployment.id}`);
      appendLiveLog(`Environment: ${deployment.environment}`);
      appendLiveLog(`Status: ${deployment.status}`);
      if (deployment.url) {
        appendLiveLog(`URL: ${deployment.url}`);
      }
      appendLiveLog('--- Loading logs ---');
      await loadLogs(deployment.id);
    }
  }, [setCurrentDeployment, clearLiveLogs, appendLiveLog, loadLogs]);

  // Filter helpers
  const filterByEnvironment = useCallback((env: 'all' | 'development' | 'staging' | 'production') => {
    setEnvironmentFilter(env);
  }, [setEnvironmentFilter]);

  const filterByStatus = useCallback((status: 'all' | Deployment['status']) => {
    setStatusFilter(status as any);
  }, [setStatusFilter]);

  // Load deployments on mount and when filters change
  useEffect(() => {
    loadDeployments();
  }, [loadDeployments]);

  return {
    // State
    deployments,
    currentDeployment,
    liveLogs,
    connectionStatus,
    environmentFilter,
    statusFilter,
    isLoading,
    error,
    
    // Actions
    loadDeployments,
    loadDeployment,
    deploy,
    redeploy,
    stop,
    restart,
    rollback,
    loadLogs,
    getAvailableVersions,
    getDeploymentUrl,
    checkHealth,
    selectDeployment,
    clearLiveLogs,
    filterByEnvironment,
    filterByStatus,
    reset,
  };
}

// Selector hooks
export function useCurrentDeployment() {
  const currentDeployment = useDeploymentStore((state) => state.currentDeployment);
  const deployments = useDeploymentStore((state) => state.deployments);

  return currentDeployment || (deployments.length > 0 ? deployments[0] : null);
}

export function useDeploymentStatus(deploymentId: string) {
  return useDeploymentStore((state) =>
    state.deployments.find((d) => d.id === deploymentId)
  );
}

export default useDeploymentOperations;

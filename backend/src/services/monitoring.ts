import { logger } from '../utils/logger';
import { Request, Response, NextFunction } from 'express';
import { performance } from 'perf_hooks';

export interface Metric {
  name: string;
  value: number;
  unit?: string;
  tags?: Record<string, string>;
  timestamp: Date;
}

export interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: Date;
  uptime: number;
  version: string;
  checks: HealthCheckResult[];
}

export interface HealthCheckResult {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  message?: string;
  latency?: number;
  details?: Record<string, unknown>;
}

export interface RequestMetrics {
  method: string;
  path: string;
  statusCode: number;
  duration: number;
  timestamp: Date;
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  resetTime: number;
}

class MonitoringService {
  private metrics: Metric[] = [];
  private requestHistory: RequestMetrics[] = [];
  private maxHistorySize = 1000;
  private healthChecks: Map<string, () => Promise<HealthCheckResult>> = new Map();
  private startTime: Date;
  private version: string = '1.0.0';

  constructor() {
    this.startTime = new Date();
    this.registerDefaultHealthChecks();
    logger.info('MonitoringService initialized');
  }

  /**
   * Register default health checks
   */
  private registerDefaultHealthChecks(): void {
    this.registerHealthCheck('memory', async () => {
      const used = process.memoryUsage();
      const total = used.heapTotal + used.heapUsed;
      const usagePercent = (used.heapUsed / total) * 100;

      return {
        name: 'memory',
        status: usagePercent > 90 ? 'unhealthy' : usagePercent > 80 ? 'degraded' : 'healthy',
        message: `Heap usage: ${Math.round(usagePercent)}%`,
        details: {
          heapUsed: Math.round(used.heapUsed / 1024 / 1024),
          heapTotal: Math.round(used.heapTotal / 1024 / 1024),
          external: Math.round(used.external / 1024 / 1024),
          unit: 'MB',
        },
      };
    });

    this.registerHealthCheck('uptime', async () => {
      const uptime = Date.now() - this.startTime.getTime();
      return {
        name: 'uptime',
        status: 'healthy',
        message: `Server running for ${Math.round(uptime / 1000 / 60)} minutes`,
        details: { uptimeMs: uptime },
      };
    });

    this.registerHealthCheck('activeHandles', async () => {
      // @ts-ignore - Node.js internal
      const handles = process._getActiveHandles?.() || [];
      return {
        name: 'activeHandles',
        status: handles.length > 1000 ? 'degraded' : 'healthy',
        message: `${handles.length} active handles`,
        details: { count: handles.length },
      };
    });
  }

  /**
   * Register a health check
   */
  registerHealthCheck(
    name: string,
    check: () => Promise<HealthCheckResult>
  ): void {
    this.healthChecks.set(name, check);
    logger.debug(`Health check registered: ${name}`);
  }

  /**
   * Run all health checks
   */
  async runHealthChecks(): Promise<HealthCheck> {
    const results: HealthCheckResult[] = [];
    let overallStatus: HealthCheck['status'] = 'healthy';

    for (const [name, check] of this.healthChecks) {
      const startTime = performance.now();
      try {
        const result = await check();
        result.latency = performance.now() - startTime;
        results.push(result);

        if (result.status === 'unhealthy') {
          overallStatus = 'unhealthy';
        } else if (result.status === 'degraded' && overallStatus === 'healthy') {
          overallStatus = 'degraded';
        }
      } catch (error) {
        results.push({
          name,
          status: 'unhealthy',
          message: error instanceof Error ? error.message : 'Unknown error',
          latency: performance.now() - startTime,
        });
        overallStatus = 'unhealthy';
      }
    }

    return {
      status: overallStatus,
      timestamp: new Date(),
      uptime: Date.now() - this.startTime.getTime(),
      version: this.version,
      checks: results,
    };
  }

  /**
   * Record a metric
   */
  recordMetric(name: string, value: number, unit?: string, tags?: Record<string, string>): void {
    this.metrics.push({
      name,
      value,
      unit,
      tags,
      timestamp: new Date(),
    });

    // Keep only recent metrics
    if (this.metrics.length > this.maxHistorySize) {
      this.metrics = this.metrics.slice(-this.maxHistorySize);
    }

    logger.debug(`Metric recorded: ${name}=${value}${unit ? unit : ''}`);
  }

  /**
   * Record request metrics
   */
  recordRequest(req: Request, res: Response, duration: number): void {
    const metrics: RequestMetrics = {
      method: req.method,
      path: this.normalizePath(req.path),
      statusCode: res.statusCode,
      duration,
      timestamp: new Date(),
    };

    this.requestHistory.push(metrics);

    // Keep only recent history
    if (this.requestHistory.length > this.maxHistorySize) {
      this.requestHistory = this.requestHistory.slice(-this.maxHistorySize);
    }

    // Record individual metrics
    this.recordMetric('http_request_duration', duration, 'ms', {
      method: req.method,
      path: metrics.path,
      status: res.statusCode >= 400 ? 'error' : 'success',
    });

    if (res.statusCode >= 500) {
      this.recordMetric('http_server_errors', 1, 'count', {
        path: metrics.path,
      });
    }
  }

  /**
   * Get aggregated metrics
   */
  getMetrics(timeWindowMs: number = 300000): Map<string, MetricAggregation> {
    const cutoff = Date.now() - timeWindowMs;
    const recentMetrics = this.metrics.filter(m => m.timestamp.getTime() > cutoff);
    const recentRequests = this.requestHistory.filter(m => m.timestamp.getTime() > cutoff);

    const aggregations = new Map<string, MetricAggregation>();

    // Aggregate request metrics
    const requestCounts = new Map<string, number>();
    const requestDurations = new Map<string, number[]>();
    const statusCodes = new Map<number, number>();

    for (const req of recentRequests) {
      const key = `${req.method} ${req.path}`;
      requestCounts.set(key, (requestCounts.get(key) || 0) + 1);
      
      if (!requestDurations.has(key)) {
        requestDurations.set(key, []);
      }
      requestDurations.get(key)!.push(req.duration);

      statusCodes.set(req.statusCode, (statusCodes.get(req.statusCode) || 0) + 1);
    }

    // Calculate aggregates
    for (const [path, count] of requestCounts) {
      const durations = requestDurations.get(path) || [];
      const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;

      aggregations.set(`requests_${path.replace(/\//g, '_')}`, {
        name: `requests_${path}`,
        count,
        avg: avgDuration,
        min: Math.min(...durations),
        max: Math.max(...durations),
        unit: 'requests',
      });
    }

    // Error rate
    const totalRequests = recentRequests.length;
    const errorRequests = [...statusCodes.entries()]
      .filter(([code]) => code >= 400)
      .reduce((sum, [, count]) => sum + count, 0);
    
    if (totalRequests > 0) {
      aggregations.set('error_rate', {
        name: 'error_rate',
        count: totalRequests,
        avg: (errorRequests / totalRequests) * 100,
        min: 0,
        max: 100,
        unit: 'percent',
      });
    }

    return aggregations;
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary(timeWindowMs: number = 300000): {
    totalRequests: number;
    avgResponseTime: number;
    errorRate: number;
    p50ResponseTime: number;
    p95ResponseTime: number;
    p99ResponseTime: number;
    topSlowEndpoints: Array<{ path: string; avgDuration: number; count: number }>;
  } {
    const cutoff = Date.now() - timeWindowMs;
    const recentRequests = this.requestHistory.filter(m => m.timestamp.getTime() > cutoff);

    if (recentRequests.length === 0) {
      return {
        totalRequests: 0,
        avgResponseTime: 0,
        errorRate: 0,
        p50ResponseTime: 0,
        p95ResponseTime: 0,
        p99ResponseTime: 0,
        topSlowEndpoints: [],
      };
    }

    const totalRequests = recentRequests.length;
    const durations = recentRequests.map(r => r.duration).sort((a, b) => a - b);
    const avgResponseTime = durations.reduce((a, b) => a + b, 0) / durations.length;
    const errorRequests = recentRequests.filter(r => r.statusCode >= 400).length;
    const errorRate = (errorRequests / totalRequests) * 100;

    const p50Index = Math.floor(durations.length * 0.5);
    const p95Index = Math.floor(durations.length * 0.95);
    const p99Index = Math.floor(durations.length * 0.99);

    // Group by path
    const pathStats = new Map<string, { total: number; count: number }>();
    for (const req of recentRequests) {
      const current = pathStats.get(req.path) || { total: 0, count: 0 };
      current.total += req.duration;
      current.count += 1;
      pathStats.set(req.path, current);
    }

    const topSlowEndpoints = [...pathStats.entries()]
      .map(([path, stats]) => ({
        path,
        avgDuration: stats.total / stats.count,
        count: stats.count,
      }))
      .sort((a, b) => b.avgDuration - a.avgDuration)
      .slice(0, 5);

    return {
      totalRequests,
      avgResponseTime,
      errorRate,
      p50ResponseTime: durations[p50Index],
      p95ResponseTime: durations[p95Index],
      p99ResponseTime: durations[p99Index],
      topSlowEndpoints,
    };
  }

  /**
   * Normalize path for metrics
   */
  private normalizePath(path: string): string {
    return path
      .replace(/\/\d+/g, '/:id')
      .replace(/\/[a-f0-9-]{36}/g, '/:uuid')
      .substring(0, 50);
  }

  /**
   * Set version
   */
  setVersion(version: string): void {
    this.version = version;
  }

  /**
   * Get current uptime
   */
  getUptime(): number {
    return Date.now() - this.startTime.getTime();
  }

  /**
   * Clear metrics
   */
  clearMetrics(): void {
    this.metrics = [];
    this.requestHistory = [];
    logger.info('Metrics cleared');
  }
}

interface MetricAggregation {
  name: string;
  count: number;
  avg: number;
  min: number;
  max: number;
  unit?: string;
}

export const monitoringService = new MonitoringService();

/**
 * Request logging middleware with metrics
 */
export const requestMonitoring = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const startTime = performance.now();

  res.on('finish', () => {
    const duration = performance.now() - startTime;
    monitoringService.recordRequest(req, res, duration);
  });

  next();
};

/**
 * Health check endpoint handler
 */
export const healthCheckHandler = async (): Promise<HealthCheck> => {
  return await monitoringService.runHealthChecks();
};

/**
 * Metrics endpoint handler
 */
export const metricsHandler = () => {
  const aggregations = monitoringService.getMetrics();
  const performanceSummary = monitoringService.getPerformanceSummary();

  return {
    timestamp: new Date(),
    uptime: monitoringService.getUptime(),
    metrics: Object.fromEntries(aggregations),
    performance: performanceSummary,
  };
};

export default MonitoringService;

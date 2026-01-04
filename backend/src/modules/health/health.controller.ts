import type { Request, Response, NextFunction } from 'express';
import { getDetailedHealthStatus } from './health.service.js';

export const healthCheckController = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const startTime = Date.now();
    const health = await getDetailedHealthStatus();
    const totalResponseTime = Date.now() - startTime;

    const services = {
      postgres: { ...health.postgres },
      redis: { ...health.redis },
    };

    const statusCounts = {
      healthy: Object.values(services).filter(s => s.status === 'healthy')
        .length,
      degraded: Object.values(services).filter(s => s.status === 'degraded')
        .length,
      unhealthy: Object.values(services).filter(s => s.status === 'unhealthy')
        .length,
    };

    const getHealthMessage = (
      overall: string,
      counts: typeof statusCounts
    ): string => {
      if (overall === 'healthy') return 'All systems operational';
      if (overall === 'degraded')
        return `System degraded (${counts.degraded} service(s) with issues)`;
      return `System unhealthy (${counts.unhealthy} service(s) down)`;
    };

    const statusCode = health.overall === 'healthy' ? 200 : 503;
    const message = getHealthMessage(health.overall, statusCounts);

    res.status(statusCode).json({
      status: health.overall,
      message,
      services,
      statusCounts,
      responseTimeMs: totalResponseTime,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};

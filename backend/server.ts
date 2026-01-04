import type { Server } from 'http';
import type net from 'net';
import { config } from './src/config/index.js';
import { logger } from './src/services/logger/index.js';
import app from './src/app.js';
import {
  checkAllConnections,
  getDetailedHealthStatus,
} from './src/modules/health/health.service.js';
import { shutdownPool } from './src/database/connection.js';
import { shutdownRedis } from './src/services/redis/redis.client.js';
import { retry } from './src/utils/retry.js';

interface ShutdownStep {
  name: string;
  fn: () => Promise<void>;
  critical?: boolean; // Mark if failure should set exitCode to 1
}

let isShuttingDown = false;
const activeConnections = new Set<net.Socket>();

/**
 * Connect to all required services with retry logic
 */
const connectToServices = async (): Promise<boolean> => {
  try {
    return await retry(
      async () => {
        logger.info('Attempting to connect to services...');
        const result = await checkAllConnections();

        const failedServices = Object.entries(result)
          .filter(([_, ok]) => !ok)
          .map(([name]) => name);

        if (failedServices.length > 0) {
          throw new Error(`Failed services: ${failedServices.join(', ')}`);
        }

        const health = await getDetailedHealthStatus();
        logger.info('All required services connected successfully', {
          postgres: health.postgres.status,
          redis: health.redis.status,
        });

        return true;
      },
      { retries: 4, delay: 5000, backoff: true, jitter: true }
    );
  } catch (err) {
    const error = err as Error;
    logger.error('Could not connect to services after retries', {
      error: error.message,
      retries: 4,
    });
    return false;
  }
};

/**
 * Destroy all active socket connections
 */
const destroyAllSockets = (): void => {
  if (activeConnections.size === 0) return;

  logger.warn('Destroying active socket connections', {
    count: activeConnections.size,
  });

  for (const socket of activeConnections) {
    try {
      socket.destroy();
    } catch (err) {
      // Ignore individual socket destruction errors
    }
  }
  activeConnections.clear();
};

/**
 * Best-effort logger flush to ensure logs are written before exit
 */
const flushLogger = async (timeoutMs = 1000): Promise<void> => {
  try {
    // Close transports if they expose close()
    const transports = (logger as any).transports || [];
    for (const transport of transports) {
      if (typeof transport.close === 'function') {
        transport.close();
      }
    }
  } catch (err) {
    // Ignore transport close errors
  }

  // Wait briefly for background writes to flush
  await new Promise(resolve =>
    setTimeout(resolve, Math.min(Math.max(timeoutMs, 200), 2000))
  );
};

/**
 * Graceful shutdown handler
 */
const shutdown = async (signal: string, server?: Server): Promise<void> => {
  if (isShuttingDown) {
    logger.warn('Shutdown already in progress, ignoring signal', { signal });
    return;
  }

  isShuttingDown = true;
  logger.warn(`Received ${signal} signal. Starting graceful shutdown...`);

  const shutdownTimeout = 30_000;
  const gracePeriod = 10_000; // Time to allow for graceful connection close

  // Force exit if shutdown takes too long
  const forceExitTimer = setTimeout(() => {
    logger.error('Shutdown timed out, forcing exit', {
      activeConnections: activeConnections.size,
    });

    // Try to destroy remaining connections before exit
    if (server && typeof (server as any).closeAllConnections === 'function') {
      (server as any).closeAllConnections();
    } else {
      destroyAllSockets();
    }

    void flushLogger(250).finally(() => process.exit(1));
  }, shutdownTimeout);

  let exitCode = 0;

  try {
    const shutdownSteps: ShutdownStep[] = [];

    // Step 1: Stop accepting new HTTP connections
    if (server) {
      shutdownSteps.push({
        name: 'HTTP Server',
        critical: true,
        fn: () =>
          new Promise<void>((resolve, reject) => {
            logger.info('Stopping HTTP server...');

            // Stop accepting new connections
            server.close(err => {
              if (err) {
                logger.error('Error closing HTTP server', {
                  error: err.message,
                });
                reject(err);
              } else {
                logger.info('HTTP server stopped accepting new connections');
                resolve();
              }
            });

            // After grace period, force-close remaining connections
            setTimeout(() => {
              if (activeConnections.size > 0) {
                logger.warn(
                  'Grace period expired, closing remaining connections',
                  {
                    remaining: activeConnections.size,
                  }
                );

                // Use modern API if available (Node 18.2+)
                if (typeof (server as any).closeAllConnections === 'function') {
                  (server as any).closeAllConnections();
                } else {
                  destroyAllSockets();
                }
              }
            }, gracePeriod);
          }),
      });
    }

    // Step 2: Close database connections
    shutdownSteps.push({
      name: 'PostgreSQL Pool',
      critical: true,
      fn: shutdownPool,
    });

    // Step 3: Close Redis connection
    shutdownSteps.push({
      name: 'Redis Client',
      critical: true,
      fn: shutdownRedis,
    });

    // Add additional shutdown steps here (e.g., message queues, workers, etc.)

    // Execute all shutdown steps sequentially
    for (const step of shutdownSteps) {
      try {
        logger.info(`Closing ${step.name}...`);
        await step.fn();
        logger.info(`${step.name} closed successfully`);
      } catch (error) {
        const err = error as Error;
        logger.error(`Error closing ${step.name}`, {
          error: err.message,
          stack: err.stack,
        });
        if (step.critical) {
          exitCode = 1;
        }
      }
    }

    logger.info('Graceful shutdown completed', { exitCode });
  } catch (error) {
    const err = error as Error;
    logger.error('Unexpected error during shutdown', {
      error: err.message,
      stack: err.stack,
    });
    exitCode = 1;
  } finally {
    clearTimeout(forceExitTimer);
    await flushLogger(800);
    process.exit(exitCode);
  }
};

/**
 * Start the HTTP server
 */
const startServer = async (): Promise<void> => {
  let server: Server | undefined;

  try {
    logger.info('Server process initializing...', {
      processId: process.pid,
      nodeVersion: process.version,
      environment: config.app.nodeEnv,
    });

    // Register signal handlers for graceful shutdown
    const handleShutdown = (signal: string) => {
      void shutdown(signal, server);
    };

    ['SIGINT', 'SIGTERM'].forEach(signal => {
      process.removeAllListeners(signal);
      process.on(signal, () => handleShutdown(signal));
    });

    // Handle uncaught exceptions
    process.removeAllListeners('uncaughtException');
    process.on('uncaughtException', async (err: Error) => {
      logger.error('Uncaught exception detected', {
        processId: process.pid,
        error: err.message,
        stack: err.stack,
      });
      await shutdown('uncaughtException', server);
    });

    // Handle unhandled promise rejections
    process.removeAllListeners('unhandledRejection');
    process.on('unhandledRejection', async (reason: unknown) => {
      logger.error('Unhandled promise rejection detected', {
        processId: process.pid,
        reason: String(reason),
      });
      await shutdown('unhandledRejection', server);
    });

    // Connect to required services
    const connected = await connectToServices();
    if (!connected) {
      logger.error('Failed to connect to required services. Exiting.');
      process.exit(1);
    }

    // Start HTTP server
    server = app.listen(config.app.port, config.app.host, () => {
      logger.info('HTTP server started successfully', {
        processId: process.pid,
        url: `http://${config.app.host}:${config.app.port}`,
        host: config.app.host,
        port: config.app.port,
        environment: config.app.nodeEnv,
      });
    });

    // Track active connections for graceful shutdown
    server.on('connection', (socket: net.Socket) => {
      activeConnections.add(socket);

      socket.on('close', () => {
        activeConnections.delete(socket);
      });

      socket.on('error', () => {
        activeConnections.delete(socket);
      });
    });

    // Handle server errors
    server.on('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        logger.error('Port already in use', {
          processId: process.pid,
          port: config.app.port,
          error: err.message,
        });
      } else {
        logger.error('Server error', {
          processId: process.pid,
          error: err.message,
          stack: err.stack,
        });
      }
      process.exit(1);
    });

    // Configure server timeouts
    server.timeout = 30_000; // 30 seconds
    server.keepAliveTimeout = 65_000; // 65 seconds (should be > load balancer timeout)
    server.headersTimeout = 66_000; // 66 seconds (should be > keepAliveTimeout)

    logger.info('Server startup completed successfully', {
      processId: process.pid,
      port: config.app.port,
      host: config.app.host,
    });
  } catch (error) {
    const err = error as Error;
    logger.error('Failed to start server', {
      processId: process.pid,
      error: err.message,
      stack: err.stack,
    });

    if (server) {
      await shutdown('startup-error', server);
    } else {
      process.exit(1);
    }
  }
};

// Start the server
void startServer();

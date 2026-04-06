const app = require('./src/app');
const connectDB = require('./src/config/db');
const env = require('./src/config/env');
const logger = require('./src/utils/logger');
const { startCronJobs } = require('./src/services/cron.service');

const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Start cron jobs
    startCronJobs();

    // Start Express server
    const server = app.listen(env.PORT, () => {
      logger.info(`🚀 KisanSaathi API running on port ${env.PORT}`, {
        service: 'server',
        meta: { env: env.NODE_ENV, port: env.PORT },
      });
    });

    // Graceful shutdown
    const shutdown = (signal) => {
      logger.info(`${signal} received — shutting down gracefully`, { service: 'server' });
      server.close(() => {
        logger.info('HTTP server closed', { service: 'server' });
        process.exit(0);
      });
      setTimeout(() => {
        logger.error('Forceful shutdown after timeout', { service: 'server' });
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    process.on('unhandledRejection', (err) => {
      logger.error('Unhandled Rejection', { service: 'server', meta: { error: err.message, stack: err.stack } });
    });

    process.on('uncaughtException', (err) => {
      logger.error('Uncaught Exception', { service: 'server', meta: { error: err.message, stack: err.stack } });
      process.exit(1);
    });

  } catch (error) {
    logger.error('Failed to start server', { service: 'server', meta: { error: error.message } });
    process.exit(1);
  }
};

startServer();

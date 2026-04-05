require('./config/env');

const app = require('./app');
const { pool, query } = require('./config/db');

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

const startServer = async () => {
  try {
    await query('SELECT 1');
    console.log('PostgreSQL connection established successfully.');

    const server = app.listen(PORT, HOST, () => {
      console.log(`Server is running on http://${HOST}:${PORT}`);
    });

    let isShuttingDown = false;
    let forceShutdownTimer = null;

    const shutdown = async (signal) => {
      if (isShuttingDown) {
        console.log(`${signal} received again. Shutdown already in progress.`);
        return;
      }

      isShuttingDown = true;
      console.log(`${signal} received. Closing server...`);

      forceShutdownTimer = setTimeout(async () => {
        console.error('Graceful shutdown timed out. Forcing shutdown.');

        if (typeof server.closeAllConnections === 'function') {
          server.closeAllConnections();
        }

        try {
          await pool.end();
        } catch (error) {
          console.error('Failed to close database pool during forced shutdown:', error);
        }

        process.exit(1);
      }, 5000);

      if (typeof forceShutdownTimer.unref === 'function') {
        forceShutdownTimer.unref();
      }

      server.close(async () => {
        try {
          if (forceShutdownTimer) {
            clearTimeout(forceShutdownTimer);
          }

          await pool.end();
          console.log('HTTP server and database pool closed.');
          process.exit(0);
        } catch (error) {
          console.error('Failed to close server cleanly:', error);
          process.exit(1);
        }
      });

      if (typeof server.closeIdleConnections === 'function') {
        server.closeIdleConnections();
      }
    };

    process.once('SIGINT', () => shutdown('SIGINT'));
    process.once('SIGTERM', () => shutdown('SIGTERM'));
  } catch (error) {
    console.error('Failed to start the server:', error);
    await pool.end();
    process.exit(1);
  }
};

startServer();

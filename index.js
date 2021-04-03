/**
 * Gracefully shutdown the application when requested, rejecting any requests that come through.
 *
 * Based entirely from express-graceful-shutdown:
 * @link https://npm.im/express-graceful-shutdown
 */
module.exports = function createShutdownMiddleware(server, opts = {}) {
  const logger = opts.logger || console; // Defaults to console
  const forceTimeout = opts.forceTimeout || (30 * 1000); // Defaults to 30s

  let shuttingDown = false;

  process.on('SIGTERM', function gracefulExit() {
    if (shuttingDown) {
      // We already know we're shutting down, don't continue this function
      return;
    } else {
      shuttingDown = true;
    }

    // Don't bother with graceful shutdown in development
    if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
      return process.exit(0);
    }

    logger.warn('Received kill signal (SIGTERM), shutting down...');

    setTimeout(() => {
      logger.error('Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, forceTimeout);

    server.close(() => {
      logger.info('Closed out remaining connections');
      process.exit(0);
    });
  });

  return function shutdown(ctx, next) {
    if (shuttingDown) {
      ctx.status = 503;
      ctx.set('Connection', 'close');
      ctx.body = 'Server is in the process of shutting down';
    } else {
      return next();
    }
  };
};

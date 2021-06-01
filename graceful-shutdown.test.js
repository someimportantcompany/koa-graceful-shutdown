const assert = require('assert');
const crypto = require('crypto');
const rewire = require('rewire');

describe('koa-graceful-shutdown', () => {
  const koaGracefulShutdown = rewire('koa-graceful-shutdown');
  const NOOP = () => {}; // eslint-disable-line no-empty-function

  // A fake logger to silence output
  const logger = { info: NOOP, warn: NOOP, error: NOOP };

  it('should return a middleware function', () => {
    const middleware = koaGracefulShutdown({});
    assert.equal(typeof middleware, 'function');
    assert.equal(middleware.name, 'shutdown');
  });

  it('should always return the next() Promise when not shutting down', () => {
    const middleware = koaGracefulShutdown({});
    const expected = crypto.randomBytes(6).toString('hex');
    const actual = middleware({}, () => expected);
    assert.strictEqual(actual, expected, 'Failed to return the expected value');
  });

  it('should shut down immediately when NODE_ENV is not set', async () => {
    const events = [];
    let gracefulShutdown = () => { throw new Error('gracefulShutdown function not set'); };

    const fakeProcess = {
      env: {},
      on(name, fn) {
        if (name === 'SIGTERM') {
          gracefulShutdown = fn;
        }
      },
      exit() {
        events.push('process.exit');
      },
    };
    const fakeServer = {
      close(callback) {
        events.push('server.close');
        callback();
      },
    };

    await koaGracefulShutdown.__with__({
      process: fakeProcess,
      setTimeout: NOOP,
    })(async () => {
      const middleware = koaGracefulShutdown(fakeServer, { logger });
      gracefulShutdown();

      const ctx = fakeCtx();
      const next = () => { throw new Error('Should not have executed next()'); };
      await middleware(ctx, next);

      assert.strictEqual(ctx.status, 503);
      assert.deepStrictEqual(ctx.headers, { 'Connection': 'close' });
      assert.strictEqual(ctx.body, 'Server is in the process of shutting down');
    });

    assert.deepStrictEqual(events, [ 'process.exit' ]);
  });

  it('should shut down gracefully when NODE_ENV is set', async () => {
    const events = [];
    let gracefulShutdown = () => { throw new Error('gracefulShutdown function not set'); };

    const fakeProcess = {
      env: {
        NODE_ENV: 'production',
      },
      on(name, fn) {
        if (name === 'SIGTERM') {
          gracefulShutdown = fn;
        }
      },
      exit() {
        events.push('process.exit');
      },
    };
    const fakeServer = {
      close(callback) {
        events.push('server.close');
        callback();
      },
    };
    const fakeSetTimeout = (callback, time) => {
      setTimeout(() => {
        events.push('setTimeout');
        callback();
      }, time);
    };

    await koaGracefulShutdown.__with__({
      process: fakeProcess,
      setTimeout: fakeSetTimeout,
    })(async () => {
      const middleware = koaGracefulShutdown(fakeServer, { logger });
      gracefulShutdown();

      const ctx = fakeCtx();
      const next = () => { throw new Error('Should not have executed next()'); };
      await middleware(ctx, next);

      assert.strictEqual(ctx.status, 503);
      assert.deepStrictEqual(ctx.headers, { 'Connection': 'close' });
      assert.strictEqual(ctx.body, 'Server is in the process of shutting down');
    });

    assert.deepStrictEqual(events, [ 'server.close', 'process.exit' ]);
  });

  it('should shut down gracefully when NODE_ENV is set, respecting to multiple SIGTERMs', async () => {
    const events = [];
    let gracefulShutdown = () => { throw new Error('gracefulShutdown function not set'); };

    const fakeProcess = {
      env: {
        NODE_ENV: 'production',
      },
      on(name, fn) {
        if (name === 'SIGTERM') {
          gracefulShutdown = fn;
        }
      },
      exit() {
        events.push('process.exit');
      },
    };
    const fakeServer = {
      close(callback) {
        events.push('server.close');
        callback();
      },
    };
    const fakeSetTimeout = (callback, time) => {
      setTimeout(() => {
        events.push('setTimeout');
        callback();
      }, time);
    };

    await koaGracefulShutdown.__with__({
      process: fakeProcess,
      setTimeout: fakeSetTimeout,
    })(async () => {
      const middleware = koaGracefulShutdown(fakeServer, { logger });
      gracefulShutdown();
      gracefulShutdown();
      gracefulShutdown();

      const ctx = fakeCtx();
      const next = () => { throw new Error('Should not have executed next()'); };
      await middleware(ctx, next);

      assert.strictEqual(ctx.status, 503);
      assert.deepStrictEqual(ctx.headers, { 'Connection': 'close' });
      assert.strictEqual(ctx.body, 'Server is in the process of shutting down');
    });

    assert.deepStrictEqual(events, [ 'server.close', 'process.exit' ]);
  });

  it('should shut down forcefully when NODE_ENV is set & forceTimeout elapses', async () => {
    const events = [];
    let gracefulShutdown = () => { throw new Error('gracefulShutdown function not set'); };

    const fakeProcess = {
      env: {
        NODE_ENV: 'production',
      },
      on(name, fn) {
        if (name === 'SIGTERM') {
          gracefulShutdown = fn;
        }
      },
      exit() {
        events.push('process.exit');
      },
    };
    const fakeServer = {
      close(callback) {
        events.push('server.close');
        callback();
      },
    };
    const fakeSetTimeout = callback => {
      events.push('setTimeout');
      callback();
    };

    await koaGracefulShutdown.__with__({
      process: fakeProcess,
      setTimeout: fakeSetTimeout,
    })(async () => {
      const middleware = koaGracefulShutdown(fakeServer, { logger, forceTimeout: 1 });
      gracefulShutdown();

      const ctx = fakeCtx();
      const next = () => { throw new Error('Should not have executed next()'); };
      await middleware(ctx, next);

      assert.strictEqual(ctx.status, 503);
      assert.deepStrictEqual(ctx.headers, { 'Connection': 'close' });
      assert.strictEqual(ctx.body, 'Server is in the process of shutting down');
    });

    assert.deepStrictEqual(events, [ 'setTimeout', 'process.exit', 'server.close', 'process.exit' ]);
  });

  function fakeCtx() {
    return Object.create({
      set(key, value) {
        this.headers[`${key}`] = `${value}`;
      },
    }, {
      status: {
        value: null,
        enumerable: true,
        writable: true,
      },
      headers: {
        value: {},
        enumerable: true,
      },
      body: {
        value: null,
        enumerable: true,
        writable: true,
      },
    });
  }
});

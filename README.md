# koa-graceful-shutdown

[![NPM](https://badge.fury.io/js/koa-graceful-shutdown.svg)](https://npm.im/koa-graceful-shutdown)
[![CI](https://github.com/someimportantcompany/koa-graceful-shutdown/actions/workflows/ci.yml/badge.svg)](https://github.com/someimportantcompany/koa-graceful-shutdown/actions/workflows/ci.yml)
<!-- [![Coverage](https://coveralls.io/repos/github/someimportantcompany/koa-graceful-shutdown/badge.svg?branch=master)](https://coveralls.io/github/someimportantcompany/koa-graceful-shutdown?branch=master) -->

Ensure that during shutdown [Koa](https://github.com/koajs/koa) returns correctly with a `HTTP 503 Service Unavailable`. Based off [`express-graceful-shutdown`](https://github.com/serby/express-graceful-shutdown) with the middleware adapted for Koa.

```js
const http = require('http');
const Koa = require('koa');
const shutdown = require('koa-graceful-shutdown');

const app = new Koa();
const server = http.createServer(app.callback());

app.use(shutdown(server));

app.use(ctx => {
  ctx.status = 200;
  ctx.body = { foo: 'bar' };
});

server.listen(0, 'localhost', () => {
  const { address, port } = server.address();
  console.log('Listening on http://%s:%d', address, port);
});
```

## Install

```
npm install koa-graceful-shutdown --save
```

## Arguments

```
shutdown(server, opts) => function(ctx, next)
```

| Argument | Description |
| ---- | ---- |
| `server` | [`http.server`](https://nodejs.org/dist/latest-v8.x/docs/api/http.html#http_class_http_server) |
| `opts` | Optional options |
| `opts.logger` | A logger that provides `info`, `warn` and `error` methods, defaults to `console` |
| `opts.forceTimeout` | Milliseconds to wait for `server.close()` to finish, defaults to `30000` |

## Notes

- Original credits to [Paul Serby](https://github.com/serby/) for [`express-graceful-shutdown`](https://github.com/serby/express-graceful-shutdown).
- Any questions or suggestions please [open an issue](https://github.com/someimportantcompany/koa-graceful-shutdown/issues).

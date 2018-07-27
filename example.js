// First, ensure you're running in production
/* eslint-disable no-console */
process.env.NODE_ENV = 'production';

const http = require('http');
const Koa = require('koa');
const shutdown = require('./koa-graceful-shutdown');

// Next, start your HTTP server
(() => {
  const app = new Koa();
  const server = http.createServer(app.callback());

  app.use(shutdown(server));

  app.use(ctx => {
    ctx.status = 200;
    ctx.body = 'Hello, world!';
  });

  server.listen(0, 'localhost', () => {
    const { address, port } = server.address();
    console.log('Listening on http://%s:%d', address, port);

    setInterval(() => http.get({ hostname: address, port }, res => console.log(res.statusCode)), 100);
  });
})();

// Finally, shut down the HTTP server after 1s of uptime
setTimeout(() => {
  console.log('Emitting SIGTERM');
  process.emit('SIGTERM');
}, 1000);

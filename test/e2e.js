const cp = require('child_process');
const execContext = { env: process.env, stdio: 'inherit' };
const server = cp.fork('./build/server/main.js', execContext);

server.once('message', (msg) => {
  if (msg.cmd === 'started') {
    execContext.env.context = msg.ctx;
    execContext.env.startPoint = `http://${msg.ctx.hostname}:${msg.ctx.port}`;

    const test = cp.exec('ava test/e2e/*.js --tap | tap-summary', execContext);

    test.stdout.pipe(process.stdout);
    test.stderr.pipe(process.stderr);

    test.once('error', () => server.send('shutdown'));
    test.once('close', () => server.send('shutdown'));
  }
});

server.once('exit', () => {
  process.exit(0);
});

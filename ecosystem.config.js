module.exports = {
  apps: [
    {
      name: 'api',
      cwd: 'current',
      script: 'node_modules/.bin/rw',
      args: 'serve api',
      // instances: 'max',
      instances: 1,
      // exec_mode: 'cluster',
      exec_mode: 'fork',
      wait_ready: true,
      listen_timeout: 10000,
    },
  ],
}

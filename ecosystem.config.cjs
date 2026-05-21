// PM2 ecosystem config for IIS reverse proxy deployment
// .cjs extension required because package.json uses "type": "module"
module.exports = {
  apps: [
    {
      name: 'kreato-frontend',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3000',
      node_args: '--max-http-header-size=65536',
      cwd: './',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: '3000',
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: 'logs/frontend-error.log',
      out_file: 'logs/frontend-out.log',
    },
    {
      name: 'kreato-backend',
      script: 'dist/server.js',
      cwd: './backend',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: '../logs/backend-error.log',
      out_file: '../logs/backend-out.log',
    },
  ],
};

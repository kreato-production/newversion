// PM2 ecosystem config for IIS reverse proxy deployment
// .cjs extension required because package.json uses "type": "module"
module.exports = {
  apps: [
    {
      name: 'kreato-frontend',
      script: '.next/standalone/server.js',
      cwd: './',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: '3001',
        HOSTNAME: '0.0.0.0',
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

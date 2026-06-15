module.exports = {
    apps: [
      {
        name: 'nest-api-stage',
        script: 'dist/src/main.js',
  
        instances: 1,
        exec_mode: 'cluster',
  
        autorestart: true,
        watch: false,
        max_memory_restart: '300M',
  
        kill_timeout: 5000,
        listen_timeout: 5000,
  
        log_date_format: 'YYYY-MM-DD HH:mm:ss',
        error_file: './logs/error.log',
        out_file: './logs/out.log',
        merge_logs: true,
  
        env: {
          NODE_ENV: 'stage',
          PORT: 9090,
        },
      },
    ],
  };
  
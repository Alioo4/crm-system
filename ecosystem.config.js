module.exports = {
    apps: [
      {
        name: 'nest-api',
        script: 'dist/src/main.js',
  
        instances: 1,
        exec_mode: 'cluster',
  
        autorestart: true,
        watch: false,
        max_memory_restart: '500M',
  
        kill_timeout: 5000,
        listen_timeout: 5000,
  
        log_date_format: 'YYYY-MM-DD HH:mm:ss',
        error_file: './logs/error.log',
        out_file: './logs/out.log',
        merge_logs: true,
  
        env: {
          NODE_ENV: 'production',
          PORT: 8080,
        },
  
        env_production: {
          NODE_ENV: 'production',
          PORT: 8080,
          GIT_SHA: process.env.GIT_SHA,
          GIT_SHORT: process.env.GIT_SHORT,
          GIT_BRANCH: process.env.GIT_BRANCH,
          BUILD_TIME: process.env.BUILD_TIME,
        },
      },
    ],
  };
  
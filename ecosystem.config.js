module.exports = {
  apps: [{
    name: 'weight-tracker',
    script: './server.js',
    cwd: '/root/.openclaw/workspace/weight-tracker-app/.next/standalone',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
}
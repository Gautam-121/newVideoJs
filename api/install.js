const { execSync } = require('child_process');

// Run post-install command to install pg
execSync('npm install pg', { stdio: 'inherit' });
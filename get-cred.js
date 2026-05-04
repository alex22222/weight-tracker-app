const fs = require('fs');
const path = require('path');
const p = path.join(require('os').homedir(), '.cloudbase', 'auth.json');
if (!fs.existsSync(p)) { console.log('FILE_NOT_FOUND'); process.exit(1); }
const data = fs.readFileSync(p, 'utf8');
if (!data.trim()) { console.log('FILE_EMPTY'); process.exit(1); }
const j = JSON.parse(data);
const c = j.credential || {};
console.log('SECRET_ID=' + (c.secretId || ''));
console.log('SECRET_KEY=' + (c.secretKey || ''));
console.log('TOKEN=' + (c.sessionToken || ''));
console.log('EXPIRE=' + (c.tmpExpired || ''));

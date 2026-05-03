#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const files = [
  'src/app/api/reading/route.ts',
  'src/app/api/last-record/route.ts',
  'src/app/api/tasks/route.ts',
  'src/app/api/messages/route.ts',
  'src/app/api/goals/route.ts',
  'src/app/api/auth/password/route.ts',
  'src/app/api/auth/wechat-login/route.ts',
  'src/app/api/auth/register/route.ts',
  'src/app/api/auth/reset-password/route.ts',
  'src/app/api/auth/verify-code/route.ts',
  'src/app/api/auth/login/route.ts',
  'src/app/api/admin/reset-admin/route.ts',
  'src/app/api/user/route.ts',
  'src/app/api/feedback/route.ts',
  'src/app/api/points/route.ts',
  'src/app/api/friends/route.ts',
  'src/app/api/upload/route.ts',
  'src/app/api/channels/ranking/route.ts',
  'src/app/api/channels/[id]/comments/route.ts',
  'src/app/api/channels/[id]/route.ts',
  'src/app/api/channels/[id]/control/route.ts',
  'src/app/api/channels/[id]/stats/route.ts',
  'src/app/api/channels/[id]/leave/route.ts',
];

for (const f of files) {
  const fullPath = path.join(process.cwd(), f);
  if (!fs.existsSync(fullPath)) {
    console.log(`SKIP (not found): ${f}`);
    continue;
  }
  let content = fs.readFileSync(fullPath, 'utf8');
  if (content.includes('export const dynamic')) {
    console.log(`SKIP (already has dynamic): ${f}`);
    continue;
  }
  // Add after the last import line
  const lines = content.split('\n');
  let lastImportIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().startsWith('import ')) {
      lastImportIdx = i;
    }
  }
  if (lastImportIdx >= 0) {
    lines.splice(lastImportIdx + 1, 0, '', 'export const dynamic = \'force-dynamic\'');
    fs.writeFileSync(fullPath, lines.join('\n'));
    console.log(`PATCHED: ${f}`);
  } else {
    console.log(`SKIP (no imports): ${f}`);
  }
}
console.log('Done!');

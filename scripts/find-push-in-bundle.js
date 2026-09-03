const fs = require('fs');
const path = require('path');

const bundlePath = path.resolve(__dirname, '../apps/firetv/android/app/src/main/assets/index.android.bundle');
const content = fs.readFileSync(bundlePath, 'utf-8');

// Find all foo.push(
const regex = /([a-zA-Z0-9_$.]+\.push\([^)]*\))/g;
let match;
const matches = new Set();
while ((match = regex.exec(content)) !== null) {
  matches.add(match[0]);
}

console.log(`Found ${matches.size} unique .push() patterns:`);
for (const m of Array.from(matches).slice(0, 30)) {
  console.log(' -', m);
}

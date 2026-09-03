const fs = require('fs');
const path = require('path');

const bundlePath = path.resolve(__dirname, '../apps/firetv/android/app/src/main/assets/index.android.bundle');
const content = fs.readFileSync(bundlePath, 'utf-8');

const regex = /([^\n]{0,100}\.S[^\n]{0,100})/g;
let match;
let count = 0;
while ((match = regex.exec(content)) !== null && count < 10) {
  console.log(`--- Match ${count} ---`);
  console.log(match[0]);
  count++;
}

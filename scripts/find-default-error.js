const fs = require('fs');
const path = require('path');

const bundlePath = path.resolve(__dirname, '../apps/firetv/android/app/src/main/assets/index.android.bundle');
const content = fs.readFileSync(bundlePath, 'utf-8');

// Search for require/import default issues in bundle
const lines = content.split('\n');
console.log('Total lines in bundle:', lines.length);

// In RN bundles, module definitions are: __d(function(g,r,i,a,m,e,d){ ... }, id, [deps]);
// Look at the error: "TypeError: Cannot read property 'S' of undefined"
// then "TypeError: Cannot read property 'default' of undefined"
// When ReactSharedInternals.S crashed during require('react-native/Libraries/Renderer/shims/ReactTypes.js') or ReactFabric, the module export failed and returned undefined, which caused the subsequent `require(...).default` to fail with "Cannot read property 'default' of undefined"!
